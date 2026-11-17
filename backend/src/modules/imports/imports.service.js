import fs from 'fs';
import path from 'path';
import { executeQuery, isUsingFallback, getMemoryStore } from '../../database/db.js';
import { normalizePhone } from '../../utils/phone.js';
import { previewFile } from '../../utils/streamingFileParser.js';
import importQueue from '../../queues/importQueue.js';
import { processImportJob } from '../../services/importBatchProcessor.js';
import { resolveContactsByPhones } from '../contacts/contacts.service.js';
import logger from '../../utils/logger.js';

const UPLOADS_DIR = path.resolve(process.cwd(), 'uploads', 'imports');

/**
 * Handle multipart file upload and generate streaming preview
 */
export async function handleUploadPreview(businessId, file) {
  if (!file) {
    const err = new Error('No file uploaded');
    err.statusCode = 400;
    throw err;
  }

  const filePath = file.path;
  const originalName = file.originalname;
  const fileSize = file.size;
  const ext = path.extname(originalName).replace('.', '').toLowerCase();
  const fileType = ext === 'xlsx' || ext === 'xls' ? 'xlsx' : 'csv';

  try {
    const previewData = await previewFile(filePath, fileType);

    return {
      fileKey: path.basename(filePath),
      fileName: originalName,
      fileSize,
      fileType,
      headers: previewData.headers,
      sampleRows: previewData.sampleRows,
      totalEstimatedRows: previewData.totalEstimatedRows,
      mappingSuggestions: previewData.mappingSuggestions
    };
  } catch (err) {
    // If preview parsing fails, delete uploaded file
    if (fs.existsSync(filePath)) {
      try { fs.unlinkSync(filePath); } catch (_) {}
    }
    logger.error(`[Imports] Preview parsing failed: ${err.message}`);
    throw new Error(`Failed to parse file: ${err.message}`);
  }
}

/**
 * Create a background import job from an uploaded file
 */
export async function createQueuedImportJob(businessId, userId, {
  fileKey,
  fileName,
  columnMapping,
  batchTag = '',
  groupId = null,
  defaultCountryCode = '91',
  consentSource = 'csv_verified_records',
  strictConsent = false,
  skipDuplicates = false
}) {
  if (!fileKey) {
    const err = new Error('fileKey is required');
    err.statusCode = 400;
    throw err;
  }

  const filePath = path.join(UPLOADS_DIR, path.basename(fileKey));
  if (!fs.existsSync(filePath)) {
    const err = new Error('Uploaded file not found or expired. Please upload again.');
    err.statusCode = 404;
    throw err;
  }

  if (!columnMapping || !columnMapping.phone) {
    const err = new Error('Phone column mapping is required');
    err.statusCode = 400;
    throw err;
  }

  const stats = fs.statSync(filePath);
  const ext = path.extname(filePath).replace('.', '').toLowerCase();
  const fileType = ext === 'xlsx' || ext === 'xls' ? 'xlsx' : 'csv';

  // Fast estimate of total rows
  let estimatedTotal = 0;
  try {
    const preview = await previewFile(filePath, fileType);
    estimatedTotal = preview.totalEstimatedRows || 0;
  } catch (_) {}

  const jobId = await importQueue.enqueueImportJob(businessId, userId, {
    fileName: fileName || fileKey,
    filePath,
    fileType,
    fileSize: stats.size,
    totalRows: estimatedTotal,
    columnMapping,
    options: {
      batchTag: batchTag ? String(batchTag).trim() : '',
      groupId: groupId ? Number(groupId) : null,
      defaultCountryCode: defaultCountryCode || '91',
      consentSource: consentSource || 'csv_verified_records',
      strictConsent: Boolean(strictConsent),
      skipDuplicates: Boolean(skipDuplicates)
    }
  });

  logger.info(`📋 [Imports] Job #${jobId} enqueued for Business #${businessId} (${fileName})`);

  return {
    jobId,
    id: jobId,
    status: 'pending',
    totalRows: estimatedTotal,
    fileName: fileName || fileKey,
    message: 'Import job successfully queued for background processing'
  };
}

/**
 * Backward-compatible executeImport for raw text / existing calls
 */
export async function executeImport(businessId, userId, {
  csvText,
  fileName = 'contacts.csv',
  columnMapping,
  consentSource = 'csv_verified_records',
  defaultCountryCode = '91',
  batchTag = '',
  groupId = null,
  strictConsent = true,
  skipDuplicates = true
}) {
  if (!csvText) {
    const err = new Error('csvText is required');
    err.statusCode = 400;
    throw err;
  }

  if (!columnMapping || !columnMapping.phone) {
    const err = new Error('Phone column mapping is required');
    err.statusCode = 400;
    throw err;
  }

  // Save raw text to temporary file
  if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  }
  const safeName = `${Date.now()}-inline-${Math.random().toString(36).substring(2, 8)}.csv`;
  const filePath = path.join(UPLOADS_DIR, safeName);
  fs.writeFileSync(filePath, csvText, 'utf-8');

  const queued = await createQueuedImportJob(businessId, userId, {
    fileKey: safeName,
    fileName,
    columnMapping,
    batchTag,
    groupId,
    defaultCountryCode,
    consentSource,
    strictConsent,
    skipDuplicates
  });

  // For direct executeImport invocation (synchronous/tests), claim and process immediately
  const claimed = await importQueue.claimNextJob();
  if (claimed && claimed.id === queued.jobId) {
    await processImportJob(claimed);
  }

  const finishedJob = await getImportJob(businessId, queued.jobId);

  // Extract phones from CSV and resolve contact IDs
  let contactIds = [];
  try {
    const lines = csvText.split(/\r?\n/).filter(line => line.trim().length > 0);
    if (lines.length > 1) {
      const headerLine = lines[0];
      const headerCols = headerLine.split(',').map(h => h.replace(/^"|"$/g, '').trim());
      const phoneColIdx = headerCols.findIndex(h => /phone|mobile|contact|number|whatsapp/i.test(h));
      const targetIdx = phoneColIdx >= 0 ? phoneColIdx : 0;
      
      const parsedPhones = lines.slice(1).map(l => {
        const parts = l.split(',');
        return parts[targetIdx]?.replace(/^"|"$/g, '').trim();
      }).filter(Boolean);

      if (parsedPhones.length > 0) {
        const resolved = await resolveContactsByPhones(businessId, parsedPhones);
        contactIds = resolved.contactIds || [];
      }
    }
  } catch (_) {}

  return {
    jobId: queued.jobId,
    totalRows: finishedJob ? (finishedJob.total_rows || finishedJob.processed_rows) : queued.totalRows,
    successful: finishedJob ? finishedJob.successful_rows : 0,
    duplicates: finishedJob ? finishedJob.duplicate_rows : 0,
    failed: finishedJob ? finishedJob.failed_rows : 0,
    status: finishedJob ? finishedJob.status : 'completed',
    contactIds
  };
}

/**
 * Backward-compatible parseCsvText & previewCsv
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

  const headers = parseLine(lines[0]).map(h => h.replace(/^"|"$/g, '').trim());
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

export async function previewCsv(csvText) {
  const { headers, rows } = parseCsvText(csvText);
  const sample = rows.slice(0, 5);

  const mappingSuggestions = {};
  headers.forEach(h => {
    const lower = h.toLowerCase();
    if (!mappingSuggestions.phone && (lower.includes('phone') || lower.includes('mobile') || lower.includes('whatsapp') || lower.includes('number'))) {
      mappingSuggestions.phone = h;
    } else if (!mappingSuggestions.name && (lower.includes('name') || lower.includes('customer'))) {
      mappingSuggestions.name = h;
    } else if (!mappingSuggestions.email && lower.includes('email')) {
      mappingSuggestions.email = h;
    } else if (!mappingSuggestions.tag && lower.includes('tag')) {
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
 * Fetch a single import job by ID for tenant
 */
export async function getImportJob(businessId, jobId) {
  const numBizId = Number(businessId);
  const numJobId = Number(jobId);

  if (isUsingFallback()) {
    const store = getMemoryStore();
    return store.import_jobs?.find(j => j.business_id === numBizId && j.id === numJobId) || null;
  }

  const rows = await executeQuery(
    `SELECT id, business_id, user_id, file_name, file_type, file_size, total_rows,
            processed_rows, successful_rows, failed_rows, duplicate_rows,
            status, error_summary, retry_count, started_at, completed_at, created_at, updated_at
     FROM import_jobs
     WHERE business_id = ? AND id = ?
     LIMIT 1`,
    [numBizId, numJobId]
  );

  return rows[0] || null;
}

/**
 * List past import jobs for tenant
 */
export async function listImportJobs(businessId, { limit = 50, offset = 0, page = 1 } = {}) {
  const numBizId = Number(businessId);
  const numLimit = Number(limit) || 10;
  const numPage = Number(page) || 1;
  const calculatedOffset = offset !== undefined && offset !== 0 ? Number(offset) : (numPage - 1) * numLimit;

  if (isUsingFallback()) {
    const store = getMemoryStore();
    const all = (store.import_jobs || [])
      .filter(j => j.business_id === numBizId)
      .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
    const total = all.length;
    const paginated = all.slice(calculatedOffset, calculatedOffset + numLimit);
    return {
      jobs: paginated,
      total,
      page: numPage,
      limit: numLimit,
      totalPages: Math.max(1, Math.ceil(total / numLimit))
    };
  }

  const countRes = await executeQuery(
    `SELECT COUNT(*) as total FROM import_jobs WHERE business_id = ?`,
    [numBizId]
  );
  const total = Number(countRes[0]?.total || 0);

  const rows = await executeQuery(
    `SELECT id, business_id, user_id, file_name, file_type, file_size, total_rows,
            processed_rows, successful_rows, failed_rows, duplicate_rows,
            options, status, error_summary, retry_count, started_at, completed_at, created_at
     FROM import_jobs
     WHERE business_id = ?
     ORDER BY created_at DESC
     LIMIT ? OFFSET ?`,
    [numBizId, numLimit, calculatedOffset]
  );

  const jobs = rows.map(r => ({
    ...r,
    options: typeof r.options === 'string' ? JSON.parse(r.options) : (r.options || {})
  }));

  return {
    jobs,
    total,
    page: numPage,
    limit: numLimit,
    totalPages: Math.max(1, Math.ceil(total / numLimit))
  };
}

/**
 * Get row-level errors for an import job
 */
export async function getImportErrors(businessId, jobId, { limit = 200 } = {}) {
  const numBizId = Number(businessId);
  const numJobId = Number(jobId);

  if (isUsingFallback()) {
    const store = getMemoryStore();
    return (store.import_rows || [])
      .filter(r => r.job_id === numJobId && r.status !== 'imported')
      .slice(0, limit);
  }

  return executeQuery(
    `SELECT ir.id, ir.job_id, ir.\`row_number\`, ir.phone, ir.status, ir.error_reason, ir.created_at
     FROM import_rows ir
     JOIN import_jobs ij ON ir.job_id = ij.id
     WHERE ij.business_id = ? AND ij.id = ?
     ORDER BY ir.\`row_number\` ASC
     LIMIT ?`,
    [numBizId, numJobId, Number(limit)]
  );
}

/**
 * Generate CSV string of all errors for export
 */
export async function exportImportErrorsCsv(businessId, jobId) {
  const errors = await getImportErrors(businessId, jobId, { limit: 10000 });
  
  const csvHeaders = 'Row Number,Phone Number,Status,Reason\n';
  const csvRows = errors.map(e => {
    const safeReason = (e.error_reason || '').replace(/"/g, '""');
    return `${e.row_number},"${e.phone || ''}","${e.status}","${safeReason}"`;
  }).join('\n');

  return csvHeaders + csvRows;
}

/**
 * Retry a failed or cancelled import
 */
export async function retryImport(businessId, jobId) {
  return importQueue.retryImportJob(businessId, jobId);
}

/**
 * Cancel an active or pending import
 */
export async function cancelImport(businessId, jobId) {
  return importQueue.cancelImportJob(businessId, jobId);
}

/**
 * Delete an import job record, audit rows, uploaded file, and optionally its imported contacts
 */
export async function deleteImportJob(businessId, jobId, { deleteContacts = false } = {}) {
  const numBizId = Number(businessId);
  const numJobId = Number(jobId);

  // 1. Fetch job to find file_path and verify ownership
  const job = await getImportJob(numBizId, numJobId);
  if (!job) {
    const err = new Error('Import job not found');
    err.statusCode = 404;
    throw err;
  }

  // 2. If deleteContacts is true, find and delete contacts created by this import
  let deletedContactsCount = 0;
  if (deleteContacts) {
    if (isUsingFallback()) {
      const store = getMemoryStore();
      const consents = (store.contact_consents || []).filter(cc =>
        cc.business_id === numBizId &&
        (cc.proof_notes?.includes(`Job #${numJobId}`) || cc.proof_notes?.includes(job.file_name))
      );
      const contactIds = [...new Set(consents.map(cc => cc.contact_id))];
      if (contactIds.length > 0) {
        store.contacts = (store.contacts || []).filter(c => !(c.business_id === numBizId && contactIds.includes(c.id)));
        store.contact_consents = (store.contact_consents || []).filter(cc => !(cc.business_id === numBizId && contactIds.includes(cc.contact_id)));
        store.contact_tags = (store.contact_tags || []).filter(ct => !contactIds.includes(ct.contact_id));
        store.contact_group_members = (store.contact_group_members || []).filter(cgm => !contactIds.includes(cgm.contact_id));
        deletedContactsCount = contactIds.length;
      }
    } else {
      const rows = await executeQuery(
        `SELECT DISTINCT contact_id FROM contact_consents 
         WHERE business_id = ? AND (proof_notes LIKE ? OR proof_notes LIKE ?)`,
        [numBizId, `%Job #${numJobId}%`, `%${job.file_name}%`]
      );
      const contactIds = rows.map(r => r.contact_id);
      if (contactIds.length > 0) {
        const placeholders = contactIds.map(() => '?').join(',');
        await executeQuery(
          `DELETE FROM contacts WHERE business_id = ? AND id IN (${placeholders})`,
          [numBizId, ...contactIds]
        );
        deletedContactsCount = contactIds.length;
      }
    }
  }

  // 3. Remove temporary file if it exists
  if (job.file_path && fs.existsSync(job.file_path)) {
    try {
      fs.unlinkSync(job.file_path);
    } catch (_) {}
  }

  // 4. Delete import_rows and import_jobs
  if (isUsingFallback()) {
    const store = getMemoryStore();
    store.import_rows = (store.import_rows || []).filter(r => r.job_id !== numJobId);
    store.import_jobs = (store.import_jobs || []).filter(j => !(j.business_id === numBizId && j.id === numJobId));
  } else {
    await executeQuery('DELETE FROM import_rows WHERE job_id = ?', [numJobId]);
    await executeQuery('DELETE FROM import_jobs WHERE business_id = ? AND id = ?', [numBizId, numJobId]);
  }

  return {
    success: true,
    message: deleteContacts 
      ? `Import job #${numJobId} and ${deletedContactsCount} contact(s) deleted successfully.`
      : `Import job #${numJobId} record deleted successfully.`,
    deletedContactsCount
  };
}

/**
 * Update the tag of a past import job and all associated contacts
 */
export async function updateImportTag(businessId, jobId, { newTag, replaceOldTag = true }) {
  const numBizId = Number(businessId);
  const numJobId = Number(jobId);
  const cleanNewTag = String(newTag || '').trim();

  if (!cleanNewTag) {
    const err = new Error('New tag name is required');
    err.statusCode = 400;
    throw err;
  }

  // 1. Fetch import job
  const job = await getImportJob(numBizId, numJobId);
  if (!job) {
    const err = new Error('Import job not found');
    err.statusCode = 404;
    throw err;
  }

  const currentOptions = typeof job.options === 'string' ? JSON.parse(job.options) : (job.options || {});
  const oldTag = currentOptions.batchTag ? String(currentOptions.batchTag).trim() : null;

  let updatedContactsCount = 0;

  if (isUsingFallback()) {
    const store = getMemoryStore();

    // Ensure new tag exists in store.tags
    if (!store.tags) store.tags = [];
    let targetTag = store.tags.find(t => t.business_id === numBizId && t.name.toLowerCase() === cleanNewTag.toLowerCase());
    if (!targetTag) {
      targetTag = {
        id: store.tags.length + 1,
        business_id: numBizId,
        name: cleanNewTag,
        color: '#10b981',
        created_at: new Date()
      };
      store.tags.push(targetTag);
    }
    const newTagId = targetTag.id;

    // Find contact IDs associated with this import job
    const consents = (store.contact_consents || []).filter(cc =>
      cc.business_id === numBizId &&
      (cc.proof_notes?.includes(`Job #${numJobId}`) || cc.proof_notes?.includes(job.file_name))
    );
    const contactIds = [...new Set(consents.map(cc => cc.contact_id))];

    if (contactIds.length > 0) {
      if (!store.contact_tags) store.contact_tags = [];

      // If replacing old tag, remove old tag associations
      if (oldTag && replaceOldTag) {
        const oldTagRec = store.tags.find(t => t.business_id === numBizId && t.name.toLowerCase() === oldTag.toLowerCase());
        if (oldTagRec) {
          store.contact_tags = store.contact_tags.filter(ct => 
            !(contactIds.includes(ct.contact_id) && ct.tag_id === oldTagRec.id)
          );
        }
      }

      // Add new tag to contacts
      for (const cId of contactIds) {
        const alreadyHas = store.contact_tags.some(ct => ct.contact_id === cId && ct.tag_id === newTagId);
        if (!alreadyHas) {
          store.contact_tags.push({
            id: store.contact_tags.length + 1,
            contact_id: cId,
            tag_id: newTagId
          });
        }
      }
      updatedContactsCount = contactIds.length;
    }

    // Update job options in store
    const jobInStore = store.import_jobs?.find(j => j.business_id === numBizId && j.id === numJobId);
    if (jobInStore) {
      if (!jobInStore.options) jobInStore.options = {};
      jobInStore.options.batchTag = cleanNewTag;
    }
  } else {
    // MySQL 8 production flow
    // 1. Ensure new tag exists in tags table
    let tagRows = await executeQuery('SELECT id FROM tags WHERE business_id = ? AND name = ?', [numBizId, cleanNewTag]);
    let newTagId;
    if (tagRows.length > 0) {
      newTagId = tagRows[0].id;
    } else {
      const tagRes = await executeQuery(
        'INSERT INTO tags (business_id, name, color) VALUES (?, ?, ?)',
        [numBizId, cleanNewTag, '#10b981']
      );
      newTagId = tagRes.insertId;
    }

    // 2. Find contacts from contact_consents
    const rows = await executeQuery(
      `SELECT DISTINCT contact_id FROM contact_consents 
       WHERE business_id = ? AND (proof_notes LIKE ? OR proof_notes LIKE ?)`,
      [numBizId, `%Job #${numJobId}%`, `%${job.file_name}%`]
    );
    const contactIds = rows.map(r => r.contact_id);

    if (contactIds.length > 0) {
      const placeholders = contactIds.map(() => '?').join(',');

      // If replaceOldTag is true and oldTag exists, remove old tag
      if (oldTag && replaceOldTag) {
        const oldTagRows = await executeQuery('SELECT id FROM tags WHERE business_id = ? AND name = ?', [numBizId, oldTag]);
        if (oldTagRows.length > 0) {
          await executeQuery(
            `DELETE FROM contact_tags WHERE tag_id = ? AND contact_id IN (${placeholders})`,
            [oldTagRows[0].id, ...contactIds]
          );
        }
      }

      // Add new tag to contacts
      const tagInsertPlaceholders = contactIds.map(() => '(?, ?)').join(', ');
      const tagValues = [];
      for (const cId of contactIds) {
        tagValues.push(cId, newTagId);
      }
      await executeQuery(
        `INSERT IGNORE INTO contact_tags (contact_id, tag_id) VALUES ${tagInsertPlaceholders}`,
        tagValues
      );

      updatedContactsCount = contactIds.length;
    }

    // 3. Update import_jobs.options with new batchTag
    currentOptions.batchTag = cleanNewTag;
    await executeQuery(
      'UPDATE import_jobs SET options = ? WHERE business_id = ? AND id = ?',
      [JSON.stringify(currentOptions), numBizId, numJobId]
    );
  }

  return {
    success: true,
    jobId: numJobId,
    oldTag,
    newTag: cleanNewTag,
    updatedContactsCount,
    message: `Tag successfully changed to "${cleanNewTag}" for ${updatedContactsCount} contact(s).`
  };
}

export default {
  handleUploadPreview,
  createQueuedImportJob,
  executeImport,
  parseCsvText,
  previewCsv,
  getImportJob,
  listImportJobs,
  getImportErrors,
  exportImportErrorsCsv,
  retryImport,
  cancelImport,
  deleteImportJob,
  updateImportTag
};
