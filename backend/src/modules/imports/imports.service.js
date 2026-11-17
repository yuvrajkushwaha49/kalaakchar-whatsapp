import fs from 'fs';
import path from 'path';
import { executeQuery, isUsingFallback, getMemoryStore } from '../../database/db.js';
import { normalizePhone } from '../../utils/phone.js';
import { previewFile } from '../../utils/streamingFileParser.js';
import importQueue from '../../queues/importQueue.js';
import { processImportJob } from '../../services/importBatchProcessor.js';
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
  strictConsent = false
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
      strictConsent: Boolean(strictConsent)
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
  strictConsent = true
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
    strictConsent
  });

  // For direct executeImport invocation (synchronous/tests), claim and process immediately
  const claimed = await importQueue.claimNextJob();
  if (claimed && claimed.id === queued.jobId) {
    await processImportJob(claimed);
  }

  const finishedJob = await getImportJob(businessId, queued.jobId);
  return {
    jobId: queued.jobId,
    totalRows: finishedJob ? (finishedJob.total_rows || finishedJob.processed_rows) : queued.totalRows,
    successful: finishedJob ? finishedJob.successful_rows : 0,
    duplicates: finishedJob ? finishedJob.duplicate_rows : 0,
    failed: finishedJob ? finishedJob.failed_rows : 0,
    status: finishedJob ? finishedJob.status : 'completed'
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
export async function listImportJobs(businessId, { limit = 50, offset = 0 } = {}) {
  const numBizId = Number(businessId);

  if (isUsingFallback()) {
    const store = getMemoryStore();
    return (store.import_jobs || [])
      .filter(j => j.business_id === numBizId)
      .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0))
      .slice(offset, offset + limit);
  }

  return executeQuery(
    `SELECT id, business_id, user_id, file_name, file_type, file_size, total_rows,
            processed_rows, successful_rows, failed_rows, duplicate_rows,
            status, error_summary, retry_count, started_at, completed_at, created_at
     FROM import_jobs
     WHERE business_id = ?
     ORDER BY created_at DESC
     LIMIT ? OFFSET ?`,
    [numBizId, Number(limit), Number(offset)]
  );
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
  cancelImport
};
