import { executeQuery, isUsingFallback, getMemoryStore, getPool } from '../database/db.js';
import logger from '../utils/logger.js';

/**
 * Enqueue a new import job into MySQL
 */
export async function enqueueImportJob(businessId, userId, {
  fileName,
  filePath,
  fileType = 'csv',
  fileSize = 0,
  totalRows = 0,
  columnMapping = {},
  options = {}
}) {
  const numBizId = Number(businessId);
  const numUserId = Number(userId);

  if (isUsingFallback()) {
    const store = getMemoryStore();
    if (!store.import_jobs) store.import_jobs = [];
    const newId = store.import_jobs.length > 0 ? Math.max(...store.import_jobs.map(j => j.id || 0)) + 1 : 1;
    const newJob = {
      id: newId,
      business_id: numBizId,
      user_id: numUserId,
      file_name: fileName,
      file_path: filePath,
      file_type: fileType,
      file_size: fileSize,
      total_rows: totalRows,
      processed_rows: 0,
      successful_rows: 0,
      failed_rows: 0,
      duplicate_rows: 0,
      column_mapping: columnMapping,
      options: options,
      status: 'pending',
      retry_count: 0,
      created_at: new Date(),
      updated_at: new Date()
    };
    store.import_jobs.unshift(newJob);
    return newId;
  }

  const query = `
    INSERT INTO import_jobs (
      business_id, user_id, file_name, file_path, file_type, file_size,
      total_rows, column_mapping, options, status, retry_count, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', 0, NOW())
  `;

  const res = await executeQuery(query, [
    numBizId,
    numUserId,
    fileName,
    filePath,
    fileType,
    fileSize,
    totalRows,
    JSON.stringify(columnMapping),
    JSON.stringify(options)
  ]);

  return res.insertId;
}

/**
 * Atomically claim next pending import job using MySQL 8 FOR UPDATE SKIP LOCKED
 */
export async function claimNextJob(workerId = 'worker-1') {
  if (isUsingFallback()) {
    const store = getMemoryStore();
    if (!store.import_jobs) return null;
    const pendingJob = store.import_jobs.find(j => j.status === 'pending');
    if (pendingJob) {
      pendingJob.status = 'processing';
      pendingJob.started_at = new Date();
      pendingJob.heartbeat_at = new Date();
      return { ...pendingJob };
    }
    return null;
  }

  const pool = getPool();
  let conn;
  try {
    conn = await pool.getConnection();
    await conn.beginTransaction();

    const [rows] = await conn.execute(`
      SELECT id, business_id, user_id, file_name, file_path, file_type, file_size,
             total_rows, column_mapping, options, retry_count
      FROM import_jobs
      WHERE status = 'pending'
      ORDER BY created_at ASC
      LIMIT 1
      FOR UPDATE SKIP LOCKED
    `);

    if (!rows || rows.length === 0) {
      await conn.commit();
      return null;
    }

    const job = rows[0];

    // Mark as processing with heartbeat
    await conn.execute(`
      UPDATE import_jobs
      SET status = 'processing', started_at = NOW(), heartbeat_at = NOW()
      WHERE id = ?
    `, [job.id]);

    await conn.commit();

    // Parse JSON columns if returned as string
    if (typeof job.column_mapping === 'string') {
      try { job.column_mapping = JSON.parse(job.column_mapping); } catch (_) { job.column_mapping = {}; }
    }
    if (typeof job.options === 'string') {
      try { job.options = JSON.parse(job.options); } catch (_) { job.options = {}; }
    }

    return job;
  } catch (err) {
    if (conn) await conn.rollback();
    logger.error(`[ImportQueue] Error claiming next job: ${err.message}`);
    return null;
  } finally {
    if (conn) conn.release();
  }
}

/**
 * Periodic recovery for abandoned or crashed worker jobs
 * Detects jobs stuck in 'processing' whose heartbeat has expired
 */
export async function recoverAbandonedJobs(timeoutMinutes = 5) {
  if (isUsingFallback()) {
    const store = getMemoryStore();
    if (!store.import_jobs) return 0;
    const now = Date.now();
    let recovered = 0;
    for (const j of store.import_jobs) {
      if (j.status === 'processing' && j.heartbeat_at) {
        const diffMinutes = (now - new Date(j.heartbeat_at).getTime()) / 60000;
        if (diffMinutes > timeoutMinutes && (j.retry_count || 0) < 3) {
          j.status = 'pending';
          j.retry_count = (j.retry_count || 0) + 1;
          j.error_summary = `Auto-recovered after worker heartbeat timeout (${Math.round(diffMinutes)}m)`;
          recovered++;
        }
      }
    }
    return recovered;
  }

  try {
    const res = await executeQuery(`
      UPDATE import_jobs
      SET status = 'pending',
          retry_count = retry_count + 1,
          error_summary = CONCAT('Auto-recovered after worker timeout at ', NOW())
      WHERE status = 'processing'
        AND (heartbeat_at IS NULL OR heartbeat_at < NOW() - INTERVAL ? MINUTE)
        AND retry_count < 3
    `, [timeoutMinutes]);

    return res.affectedRows || 0;
  } catch (err) {
    logger.error(`[ImportQueue] Failed to recover abandoned jobs: ${err.message}`);
    return 0;
  }
}

/**
 * Update worker heartbeat timestamp
 */
export async function updateHeartbeat(jobId) {
  if (isUsingFallback()) {
    const store = getMemoryStore();
    const job = store.import_jobs?.find(j => j.id === Number(jobId));
    if (job) job.heartbeat_at = new Date();
    return;
  }

  await executeQuery('UPDATE import_jobs SET heartbeat_at = NOW() WHERE id = ?', [jobId]).catch(() => {});
}

/**
 * Update import progress periodically (every batch)
 */
export async function updateJobProgress(jobId, { processedRows, successfulRows, failedRows, duplicateRows }) {
  if (isUsingFallback()) {
    const store = getMemoryStore();
    const job = store.import_jobs?.find(j => j.id === Number(jobId));
    if (job) {
      job.processed_rows = processedRows;
      job.successful_rows = successfulRows;
      job.failed_rows = failedRows;
      job.duplicate_rows = duplicateRows;
      job.heartbeat_at = new Date();
    }
    return;
  }

  await executeQuery(`
    UPDATE import_jobs
    SET processed_rows = ?,
        successful_rows = ?,
        failed_rows = ?,
        duplicate_rows = ?,
        heartbeat_at = NOW()
    WHERE id = ?
  `, [processedRows, successfulRows, failedRows, duplicateRows, jobId]).catch(err => {
    logger.warn(`[ImportQueue] Progress update warning for Job #${jobId}: ${err.message}`);
  });
}

/**
 * Mark job as successfully completed
 */
export async function markJobCompleted(jobId, { totalRows, successfulRows, failedRows, duplicateRows, errorSummary = null }) {
  const summary = errorSummary || `${successfulRows} contacts imported/updated, ${duplicateRows} duplicates skipped, ${failedRows} failed`;

  if (isUsingFallback()) {
    const store = getMemoryStore();
    const job = store.import_jobs?.find(j => j.id === Number(jobId));
    if (job) {
      job.total_rows = totalRows;
      job.processed_rows = totalRows;
      job.successful_rows = successfulRows;
      job.failed_rows = failedRows;
      job.duplicate_rows = duplicateRows;
      job.status = 'completed';
      job.completed_at = new Date();
      job.error_summary = summary;
    }
    return;
  }

  await executeQuery(`
    UPDATE import_jobs
    SET total_rows = ?,
        processed_rows = ?,
        successful_rows = ?,
        failed_rows = ?,
        duplicate_rows = ?,
        status = 'completed',
        completed_at = NOW(),
        heartbeat_at = NOW(),
        error_summary = ?
    WHERE id = ?
  `, [totalRows, totalRows, successfulRows, failedRows, duplicateRows, summary, jobId]);
}

/**
 * Mark job as failed
 */
export async function markJobFailed(jobId, errorMessage) {
  if (isUsingFallback()) {
    const store = getMemoryStore();
    const job = store.import_jobs?.find(j => j.id === Number(jobId));
    if (job) {
      job.status = 'failed';
      job.completed_at = new Date();
      job.error_summary = errorMessage;
    }
    return;
  }

  await executeQuery(`
    UPDATE import_jobs
    SET status = 'failed',
        completed_at = NOW(),
        heartbeat_at = NOW(),
        error_summary = ?
    WHERE id = ?
  `, [errorMessage, jobId]).catch(() => {});
}

/**
 * Retry a failed or cancelled job
 */
export async function retryImportJob(businessId, jobId) {
  const numBizId = Number(businessId);
  const numJobId = Number(jobId);

  if (isUsingFallback()) {
    const store = getMemoryStore();
    const job = store.import_jobs?.find(j => j.id === numJobId && j.business_id === numBizId);
    if (!job) {
      const err = new Error('Import job not found');
      err.statusCode = 404;
      throw err;
    }
    job.status = 'pending';
    job.processed_rows = 0;
    job.successful_rows = 0;
    job.failed_rows = 0;
    job.duplicate_rows = 0;
    job.retry_count = (job.retry_count || 0) + 1;
    job.error_summary = 'Retrying job';
    return job;
  }

  const rows = await executeQuery(
    'SELECT * FROM import_jobs WHERE id = ? AND business_id = ? LIMIT 1',
    [numJobId, numBizId]
  );

  if (!rows || rows.length === 0) {
    const err = new Error('Import job not found');
    err.statusCode = 404;
    throw err;
  }

  await executeQuery(`
    UPDATE import_jobs
    SET status = 'pending',
        processed_rows = 0,
        successful_rows = 0,
        failed_rows = 0,
        duplicate_rows = 0,
        retry_count = retry_count + 1,
        started_at = NULL,
        completed_at = NULL,
        heartbeat_at = NOW(),
        error_summary = CONCAT('Retry requested at ', NOW())
    WHERE id = ? AND business_id = ?
  `, [numJobId, numBizId]);

  // Clean prior error reports for clean retry
  await executeQuery('DELETE FROM import_rows WHERE job_id = ?', [numJobId]);

  return { id: numJobId, status: 'pending', message: 'Job re-queued for processing' };
}

/**
 * Cancel an active or pending job
 */
export async function cancelImportJob(businessId, jobId) {
  const numBizId = Number(businessId);
  const numJobId = Number(jobId);

  if (isUsingFallback()) {
    const store = getMemoryStore();
    const job = store.import_jobs?.find(j => j.id === numJobId && j.business_id === numBizId);
    if (job) {
      job.status = 'cancelled';
      job.error_summary = 'Cancelled by user';
    }
    return job;
  }

  await executeQuery(`
    UPDATE import_jobs
    SET status = 'cancelled', completed_at = NOW(), error_summary = 'Cancelled by user'
    WHERE id = ? AND business_id = ? AND status IN ('pending', 'processing')
  `, [numJobId, numBizId]);

  return { id: numJobId, status: 'cancelled' };
}

export default {
  enqueueImportJob,
  claimNextJob,
  recoverAbandonedJobs,
  updateHeartbeat,
  updateJobProgress,
  markJobCompleted,
  markJobFailed,
  retryImportJob,
  cancelImportJob
};

