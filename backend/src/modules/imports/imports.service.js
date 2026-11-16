import { executeQuery, isUsingFallback, getMemoryStore } from '../../database/db.js';
import { normalizePhone } from '../../utils/phone.js';

/**
 * Parse CSV raw text into rows
 */
export function parseCsvText(csvText) {
  const lines = csvText.split(/\r?\n/).filter(line => line.trim().length > 0);
  if (lines.length === 0) return { headers: [], rows: [] };

  const parseLine = (line) => {
    const result = [];
    let cur = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const c = line[i];
      if (c === '"') {
        if (inQuotes && line[i + 1] === '"') {
          cur += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (c === ',' && !inQuotes) {
        result.push(cur.trim());
        cur = '';
      } else {
        cur += c;
      }
    }
    result.push(cur.trim());
    return result;
  };

  const headers = parseLine(lines[0]).map(h => h.replace(/^"|"$/g, ''));
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const values = parseLine(lines[i]);
    const rowObj = {};
    headers.forEach((h, idx) => {
      rowObj[h] = values[idx] !== undefined ? values[idx] : '';
    });
    rows.push(rowObj);
  }

  return { headers, rows };
}

/**
 * Preview CSV with header detection & sample rows
 */
export async function previewCsv(csvText) {
  const { headers, rows } = parseCsvText(csvText);
  const sample = rows.slice(0, 5);

  // Suggest mappings
  const mappingSuggestions = {};
  headers.forEach(h => {
    const lower = h.toLowerCase();
    if (lower.includes('phone') || lower.includes('mobile') || lower.includes('whatsapp') || lower.includes('number')) {
      mappingSuggestions.phone = h;
    } else if (lower.includes('name') || lower.includes('full name') || lower.includes('customer')) {
      mappingSuggestions.name = h;
    } else if (lower.includes('email')) {
      mappingSuggestions.email = h;
    } else if (lower.includes('tag')) {
      mappingSuggestions.tag = h;
    }
  });

  return {
    headers,
    totalRows: rows.length,
    sample,
    mappingSuggestions
  };
}

/**
 * Execute CSV Import Job in Background
 * Creates job immediately and processes records asynchronously to prevent HTTP gateway timeouts.
 */
export async function executeImport(businessId, userId, { csvText, fileName = 'contacts.csv', columnMapping, consentSource = 'csv_verified_records', defaultCountryCode = '91', batchTag = '' }) {
  const { headers, rows } = parseCsvText(csvText);

  const phoneCol = columnMapping.phone;
  if (!phoneCol) {
    const error = new Error('Phone column mapping is required');
    error.statusCode = 400;
    throw error;
  }

  // 1. Create Import Job Record immediately
  let jobId = Date.now();
  if (isUsingFallback()) {
    const store = getMemoryStore();
    jobId = store.import_jobs.length + 1;
    store.import_jobs.push({
      id: jobId,
      business_id: Number(businessId),
      user_id: Number(userId),
      file_name: fileName,
      file_size: csvText.length,
      total_rows: rows.length,
      processed_rows: 0,
      successful_rows: 0,
      failed_rows: 0,
      duplicate_rows: 0,
      status: 'processing',
      created_at: new Date()
    });
  } else {
    try {
      const jobRes = await executeQuery(
        `INSERT INTO import_jobs (business_id, user_id, file_name, file_size, total_rows, processed_rows, successful_rows, failed_rows, duplicate_rows, status)
         VALUES (?, ?, ?, ?, ?, 0, 0, 0, 0, 'processing')`,
        [businessId, userId, fileName, csvText.length, rows.length]
      );
      jobId = jobRes.insertId || jobId;
    } catch (err) {
      if (isUsingFallback()) {
        const store = getMemoryStore();
        jobId = store.import_jobs.length + 1;
        store.import_jobs.push({
          id: jobId,
          business_id: Number(businessId),
          user_id: Number(userId),
          file_name: fileName,
          file_size: csvText.length,
          total_rows: rows.length,
          processed_rows: 0,
          successful_rows: 0,
          failed_rows: 0,
          duplicate_rows: 0,
          status: 'processing',
          created_at: new Date()
        });
      } else {
        throw err;
      }
    }
  }

  // 2. Fire and Forget: Process asynchronously in background so HTTP response is instant (< 100ms)
  setImmediate(() => {
    processImportJobInBackground(jobId, businessId, userId, {
      rows,
      fileName,
      columnMapping,
      consentSource,
      defaultCountryCode,
      batchTag
    }).catch(err => {
      console.error(`[Imports] Fatal error in background job #${jobId}:`, err);
    });
  });

  return {
    jobId,
    id: jobId,
    totalRows: rows.length,
    total_rows: rows.length,
    processedRows: 0,
    processed_rows: 0,
    successful: 0,
    successful_rows: 0,
    failed: 0,
    failed_rows: 0,
    duplicates: 0,
    duplicate_rows: 0,
    status: 'processing',
    fileName,
    message: 'Import processing started in background'
  };
}

/**
 * Worker function running asynchronously in background
 */
async function processImportJobInBackground(jobId, businessId, userId, { rows, fileName, columnMapping, consentSource, defaultCountryCode, batchTag }) {
  const phoneCol = columnMapping.phone;
  const nameCol = columnMapping.name;
  const emailCol = columnMapping.email;
  const tagCol = columnMapping.tag;
  const consentCol = columnMapping.consent;

  try {
    const seenPhonesInFile = new Set();
    let successful = 0;
    let failed = 0;
    let duplicates = 0;
    const contactIds = [];
    const rowReports = [];

    // Cache existing contacts and tags to eliminate thousands of slow round-trips
    const existingContactsMap = new Map();
    const tagCache = new Map();

    if (!isUsingFallback()) {
      try {
        const existingRows = await executeQuery(
          'SELECT id, phone, status, is_opted_in FROM contacts WHERE business_id = ?',
          [businessId]
        );
        for (const row of existingRows) {
          existingContactsMap.set(String(row.phone), row);
        }
      } catch (err) {
        console.warn('[Imports] Pre-fetch contacts warning:', err.message);
      }

      try {
        const tagRows = await executeQuery(
          'SELECT id, name FROM tags WHERE business_id = ?',
          [businessId]
        );
        for (const t of tagRows) {
          tagCache.set(String(t.name).toLowerCase(), t.id);
        }
      } catch (err) {
        console.warn('[Imports] Pre-fetch tags warning:', err.message);
      }
    }

    const applyTagsToContact = async (contactId, rowTag) => {
      const tagsToApply = [];
      if (batchTag && String(batchTag).trim()) {
        const splitTags = String(batchTag).split(',').map(t => t.trim()).filter(Boolean);
        tagsToApply.push(...splitTags);
      }
      if (rowTag && String(rowTag).trim()) {
        tagsToApply.push(String(rowTag).trim());
      }
      const uniqueTags = Array.from(new Set(tagsToApply));
      if (uniqueTags.length === 0) return;

      if (isUsingFallback()) {
        const store = getMemoryStore();
        for (const tagName of uniqueTags) {
          let tagRecord = store.tags.find(t => t.business_id === Number(businessId) && t.name.toLowerCase() === tagName.toLowerCase());
          if (!tagRecord) {
            tagRecord = { id: store.tags.length + 1, business_id: Number(businessId), name: tagName, color: '#0d6efd', created_at: new Date() };
            store.tags.push(tagRecord);
          }
          const already = store.contact_tags.some(ct => ct.business_id === Number(businessId) && ct.contact_id === contactId && ct.tag_id === tagRecord.id);
          if (!already) {
            store.contact_tags.push({ id: store.contact_tags.length + 1, business_id: Number(businessId), contact_id: contactId, tag_id: tagRecord.id });
          }
        }
      } else {
        for (const tagName of uniqueTags) {
          const lowerName = tagName.toLowerCase();
          let tagId = tagCache.get(lowerName);
          if (!tagId) {
            const tRes = await executeQuery('INSERT INTO tags (business_id, name) VALUES (?, ?)', [businessId, tagName]);
            tagId = tRes.insertId;
            tagCache.set(lowerName, tagId);
          }
          await executeQuery('INSERT IGNORE INTO contact_tags (business_id, contact_id, tag_id) VALUES (?, ?, ?)', [businessId, contactId, tagId]);
        }
      }
    };

    for (let i = 0; i < rows.length; i++) {
      const rowNum = i + 1;
      const row = rows[i];
      const rawPhone = row[phoneCol];
      const name = nameCol ? row[nameCol] : null;
      const email = emailCol ? row[emailCol] : null;
      const tag = tagCol ? row[tagCol] : null;

      // 1. Phone validation
      const norm = normalizePhone(rawPhone, defaultCountryCode);
      if (!norm.isValid) {
        failed++;
        rowReports.push({ row_number: rowNum, phone: rawPhone, status: 'failed', error_reason: norm.error });
        continue;
      }

      const phone = norm.phone;

      // 2. Intra-file duplicate check
      if (seenPhonesInFile.has(phone)) {
        duplicates++;
        rowReports.push({ row_number: rowNum, phone, status: 'skipped', error_reason: 'Duplicate phone within the same CSV file' });
        continue;
      }
      seenPhonesInFile.add(phone);

      // 3. In-memory fast contact lookup for tenant
      let existing = null;
      if (isUsingFallback()) {
        const store = getMemoryStore();
        existing = store.contacts.find(c => c.business_id === Number(businessId) && c.phone === phone);
      } else {
        existing = existingContactsMap.get(phone);
      }

      if (existing) {
        // CRITICAL COMPLIANCE RULE: If previously unsubscribed, NEVER auto-resubscribe
        if (existing.status === 'unsubscribed' || Number(existing.is_opted_in) === 0) {
          duplicates++;
          rowReports.push({
            row_number: rowNum,
            phone,
            status: 'skipped',
            error_reason: 'Contact previously unsubscribed / opted out. Preserving unsubscribe preference.'
          });
          continue;
        }

        // Existing contact active: update name/email if provided
        if (isUsingFallback()) {
          const store = getMemoryStore();
          const c = store.contacts.find(x => x.id === existing.id);
          if (c) {
            if (name) c.name = name;
            if (email) c.email = email;
          }
        } else {
          await executeQuery(
            'UPDATE contacts SET name = COALESCE(?, name), email = COALESCE(?, email) WHERE id = ?',
            [name, email, existing.id]
          );
        }

        // Apply batch & row tags to existing contact
        await applyTagsToContact(Number(existing.id), tag);

        successful++;
        contactIds.push(Number(existing.id));
        rowReports.push({ row_number: rowNum, phone, status: 'imported', error_reason: 'Existing contact updated' });
        continue;
      }

      // 4. Verify consent: reject ONLY if explicitly opted-out in CSV ('no', 'false', '0', 'opted_out', 'unsubscribed')
      let isExplicitOptOut = false;
      if (consentCol && row[consentCol] !== undefined && row[consentCol] !== null) {
        const rawVal = String(row[consentCol]).toLowerCase().trim();
        if (rawVal === 'no' || rawVal === 'false' || rawVal === '0' || rawVal === 'opted_out' || rawVal === 'unsubscribed' || rawVal === 'rejected') {
          isExplicitOptOut = true;
        }
      }

      if (isExplicitOptOut) {
        // Ineligible contact due to explicit opt-out
        failed++;
        rowReports.push({
          row_number: rowNum,
          phone,
          status: 'failed',
          error_reason: 'Explicitly marked as opt-out/no in CSV consent column.'
        });
        continue;
      }

      // 5. Insert new contact and record verifiable consent
      let insertedContactId;
      if (isUsingFallback()) {
        const store = getMemoryStore();
        const newContactId = store.contacts.length + 1;
        insertedContactId = newContactId;
        const newContact = {
          id: newContactId,
          business_id: Number(businessId),
          phone,
          country_code: defaultCountryCode,
          name: name || null,
          email: email || null,
          is_opted_in: 1,
          status: 'active',
          custom_fields: {},
          created_at: new Date()
        };
        store.contacts.push(newContact);

        store.contact_consents.push({
          id: store.contact_consents.length + 1,
          business_id: Number(businessId),
          contact_id: newContactId,
          consent_status: 'opted_in',
          consent_source: consentSource,
          consent_category: 'promotional',
          proof_notes: `CSV file: ${fileName}, Row #${rowNum}`,
          created_at: new Date()
        });

        // Handle tag
        await applyTagsToContact(newContactId, tag);
      } else {
        const insertRes = await executeQuery(
          `INSERT INTO contacts (business_id, phone, country_code, name, email, is_opted_in, status)
           VALUES (?, ?, ?, ?, ?, TRUE, 'active')`,
          [businessId, phone, defaultCountryCode, name || null, email || null]
        );
        const contactId = insertRes.insertId;
        insertedContactId = contactId;

        // Add to in-memory map so subsequent rows in same import recognize it
        existingContactsMap.set(phone, { id: contactId, phone, status: 'active', is_opted_in: 1 });

        await executeQuery(
          `INSERT INTO contact_consents (business_id, contact_id, consent_status, consent_source, consent_category, proof_notes)
           VALUES (?, ?, 'opted_in', ?, 'promotional', ?)`,
          [businessId, contactId, consentSource, `Import file: ${fileName}, Row ${rowNum}`]
        );

        // Handle tag
        await applyTagsToContact(contactId, tag);
      }

      successful++;
      contactIds.push(Number(insertedContactId));
      rowReports.push({ row_number: rowNum, phone, status: 'imported', error_reason: null });

      // Periodically update progress in database every 200 rows
      if (rowNum % 200 === 0) {
        if (isUsingFallback()) {
          const store = getMemoryStore();
          const j = store.import_jobs.find(x => x.id === jobId);
          if (j) {
            j.processed_rows = rowNum;
            j.successful_rows = successful;
            j.failed_rows = failed;
            j.duplicate_rows = duplicates;
          }
        } else {
          await executeQuery(
            'UPDATE import_jobs SET processed_rows = ?, successful_rows = ?, failed_rows = ?, duplicate_rows = ? WHERE id = ?',
            [rowNum, successful, failed, duplicates, jobId]
          ).catch(() => {});
        }
      }
    }

    // Final Job Summary Update
    if (isUsingFallback()) {
      const store = getMemoryStore();
      const job = store.import_jobs.find(j => j.id === jobId);
      if (job) {
        job.processed_rows = rows.length;
        job.successful_rows = successful;
        job.failed_rows = failed;
        job.duplicate_rows = duplicates;
        job.status = 'completed';
        job.error_summary = `${successful} imported, ${duplicates} duplicates skipped, ${failed} failed`;
      }
    } else {
      await executeQuery(
        `UPDATE import_jobs 
         SET processed_rows = ?, successful_rows = ?, failed_rows = ?, duplicate_rows = ?, status = 'completed', error_summary = ?
         WHERE id = ?`,
        [rows.length, successful, failed, duplicates, `${successful} imported, ${duplicates} duplicates skipped, ${failed} failed`, jobId]
      );

      // Save row-level error reports (for failed or skipped) in a fast single batch query
      const failedOrSkipped = rowReports.filter(r => r.status !== 'imported').slice(0, 100);
      if (failedOrSkipped.length > 0) {
        const placeholders = failedOrSkipped.map(() => '(?, ?, ?, ?, ?)').join(', ');
        const values = [];
        for (const rep of failedOrSkipped) {
          values.push(jobId, rep.row_number, rep.phone || '', rep.status, rep.error_reason || '');
        }
        await executeQuery(
          `INSERT INTO import_rows (job_id, \`row_number\`, phone, status, error_reason) VALUES ${placeholders}`,
          values
        ).catch(e => console.warn('[Imports] Failed saving error rows:', e.message));
      }
    }
  } catch (err) {
    console.error(`[Imports] Background job #${jobId} error:`, err);
    if (isUsingFallback()) {
      const store = getMemoryStore();
      const job = store.import_jobs.find(j => j.id === jobId);
      if (job) {
        job.status = 'failed';
        job.error_summary = err.message;
      }
    } else {
      await executeQuery(
        'UPDATE import_jobs SET status = "failed", error_summary = ? WHERE id = ?',
        [err.message, jobId]
      ).catch(() => {});
    }
  }
}

export async function getImportJob(businessId, jobId) {
  if (isUsingFallback()) {
    const store = getMemoryStore();
    return store.import_jobs.find(j => j.business_id === Number(businessId) && j.id === Number(jobId)) || null;
  }
  const rows = await executeQuery('SELECT * FROM import_jobs WHERE business_id = ? AND id = ? LIMIT 1', [businessId, jobId]);
  return rows[0] || null;
}

export async function listImportJobs(businessId) {
  if (isUsingFallback()) {
    const store = getMemoryStore();
    return store.import_jobs.filter(j => j.business_id === Number(businessId)).sort((a, b) => b.id - a.id);
  }
  return executeQuery('SELECT * FROM import_jobs WHERE business_id = ? ORDER BY created_at DESC', [businessId]);
}

export async function getImportErrors(businessId, jobId) {
  if (isUsingFallback()) {
    const store = getMemoryStore();
    return store.import_rows.filter(r => r.job_id === Number(jobId) && r.status !== 'imported');
  }
  return executeQuery(
    `SELECT ir.* FROM import_rows ir
     JOIN import_jobs ij ON ir.job_id = ij.id
     WHERE ij.business_id = ? AND ij.id = ?
     ORDER BY ir.\`row_number\` ASC`,
    [businessId, jobId]
  );
}

export default {
  previewCsv,
  executeImport,
  getImportJob,
  listImportJobs,
  getImportErrors
};
