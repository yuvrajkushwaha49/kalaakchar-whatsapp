import importQueue from '../queues/importQueue.js';
import { processImportJob } from '../services/importBatchProcessor.js';
import logger from '../utils/logger.js';
import dotenv from 'dotenv';

dotenv.config();

const WORKER_ID = process.env.IMPORT_WORKER_ID || `worker-${process.pid}`;
const CONCURRENCY = parseInt(process.env.IMPORT_WORKER_CONCURRENCY || '1', 10);
const POLL_INTERVAL_MS = parseInt(process.env.IMPORT_POLL_INTERVAL_MS || '2000', 10);

let isRunning = true;
let activeJobsCount = 0;

/**
 * Start the standalone import worker
 */
export async function startImportWorker() {
  logger.info(`🚀 [ImportWorker] ${WORKER_ID} initialized (Concurrency: ${CONCURRENCY}, Poll Interval: ${POLL_INTERVAL_MS}ms)`);

  // Initial recovery check
  try {
    const recovered = await importQueue.recoverAbandonedJobs();
    if (recovered > 0) {
      logger.info(`🔄 [ImportWorker] Auto-recovered ${recovered} abandoned/crashed import jobs.`);
    }
  } catch (err) {
    logger.warn(`[ImportWorker] Recovery warning: ${err.message}`);
  }

  // Periodic recovery check every 2 minutes
  setInterval(async () => {
    try {
      await importQueue.recoverAbandonedJobs();
    } catch (_) {}
  }, 120000);

  // Main polling loop
  while (isRunning) {
    try {
      if (activeJobsCount < CONCURRENCY) {
        const job = await importQueue.claimNextJob(WORKER_ID);

        if (job) {
          activeJobsCount++;
          // Process job in parallel without blocking main loop
          executeJobWithHeartbeat(job).finally(() => {
            activeJobsCount--;
          });
        }
      }
    } catch (loopErr) {
      logger.error(`[ImportWorker] Polling loop error: ${loopErr.message}`);
    }

    // Wait before next poll
    await new Promise(resolve => setTimeout(resolve, POLL_INTERVAL_MS));
  }

  logger.info(`🛑 [ImportWorker] ${WORKER_ID} stopped.`);
}

/**
 * Run a single job with ongoing heartbeat to prevent abandonment detection
 */
async function executeJobWithHeartbeat(job) {
  const jobId = job.id;
  logger.info(`▶️ [ImportWorker] Processing Import Job #${jobId} (File: ${job.file_name}, Total: ${job.total_rows})`);

  // Heartbeat timer every 30 seconds
  const heartbeatTimer = setInterval(async () => {
    try {
      await importQueue.updateHeartbeat(jobId);
    } catch (_) {}
  }, 30000);

  try {
    await processImportJob(job);
    logger.info(`✅ [ImportWorker] Finished Import Job #${jobId} successfully.`);
  } catch (err) {
    logger.error(`❌ [ImportWorker] Job #${jobId} failed: ${err.message}`);
    await importQueue.markJobFailed(jobId, err.message);
  } finally {
    clearInterval(heartbeatTimer);
  }
}

/**
 * Graceful shutdown handler
 */
function handleShutdown(signal) {
  logger.info(`⚠️ [ImportWorker] Received ${signal}. Initiating graceful shutdown...`);
  isRunning = false;

  const waitInterval = setInterval(() => {
    if (activeJobsCount === 0) {
      clearInterval(waitInterval);
      logger.info(`👋 [ImportWorker] All active jobs finished. Exiting process.`);
      process.exit(0);
    } else {
      logger.info(`⏳ [ImportWorker] Waiting for ${activeJobsCount} active job(s) to finish before exit...`);
    }
  }, 1000);

  // Hard exit fallback after 30 seconds
  setTimeout(() => {
    logger.warn(`⚠️ [ImportWorker] Forcefully shutting down after timeout.`);
    process.exit(1);
  }, 30000);
}

process.on('SIGINT', () => handleShutdown('SIGINT'));
process.on('SIGTERM', () => handleShutdown('SIGTERM'));

// If executed directly as CLI script
if (process.argv[1] && process.argv[1].endsWith('importWorker.js')) {
  startImportWorker().catch(err => {
    logger.error(`[ImportWorker] Fatal error: ${err.message}`);
    process.exit(1);
  });
}

export default {
  startImportWorker
};

