import campaignQueue from '../queues/campaignQueue.js';
import { processCampaignBatch } from '../services/campaignBatchDispatcher.js';
import logger from '../utils/logger.js';
import dotenv from 'dotenv';

dotenv.config();

const WORKER_ID = process.env.CAMPAIGN_WORKER_ID || `camp-worker-${process.pid}`;
const CONCURRENCY = parseInt(process.env.CAMPAIGN_WORKER_CONCURRENCY || '1', 10);
const POLL_INTERVAL_MS = parseInt(process.env.CAMPAIGN_POLL_INTERVAL_MS || '1500', 10);

let isRunning = true;
let activeCampaignsCount = 0;

/**
 * Start the standalone campaign background worker
 */
export async function startCampaignWorker() {
  logger.info(`🚀 [CampaignWorker] ${WORKER_ID} initialized (Concurrency: ${CONCURRENCY}, Poll Interval: ${POLL_INTERVAL_MS}ms)`);

  // Initial recovery check for crashed or orphaned campaigns
  try {
    const recovered = await campaignQueue.recoverAbandonedCampaigns();
    if (recovered > 0) {
      logger.info(`🔄 [CampaignWorker] Auto-recovered ${recovered} abandoned/crashed campaign(s).`);
    }
  } catch (err) {
    logger.warn(`[CampaignWorker] Recovery warning: ${err.message}`);
  }

  // Periodic recovery check every 2 minutes
  setInterval(async () => {
    try {
      await campaignQueue.recoverAbandonedCampaigns();
    } catch (_) {}
  }, 120000);

  // Main polling loop
  while (isRunning) {
    try {
      if (activeCampaignsCount < CONCURRENCY) {
        const campaign = await campaignQueue.claimNextCampaign(WORKER_ID);

        if (campaign) {
          activeCampaignsCount++;
          // Process campaign asynchronously without blocking the loop
          executeCampaignWithHeartbeat(campaign).finally(() => {
            activeCampaignsCount--;
          });
        }
      }
    } catch (loopErr) {
      logger.error(`[CampaignWorker] Polling loop error: ${loopErr.message}`);
    }

    // Wait before next poll
    await new Promise(resolve => setTimeout(resolve, POLL_INTERVAL_MS));
  }

  logger.info(`🛑 [CampaignWorker] ${WORKER_ID} stopped.`);
}

/**
 * Run a single campaign with heartbeat timer to prevent abandonment timeout
 */
async function executeCampaignWithHeartbeat(campaign) {
  const campaignId = campaign.id;
  logger.info(`▶️ [CampaignWorker] Claimed Campaign #${campaignId} "${campaign.name}" (Total Recipients: ${campaign.total_recipients || 0})`);

  // Heartbeat every 30 seconds
  const heartbeatTimer = setInterval(async () => {
    try {
      await campaignQueue.updateCampaignHeartbeat(campaignId);
    } catch (_) {}
  }, 30000);

  try {
    await processCampaignBatch(campaign);
    logger.info(`✅ [CampaignWorker] Finished processing Campaign #${campaignId}.`);
  } catch (err) {
    logger.error(`❌ [CampaignWorker] Campaign #${campaignId} error: ${err.message}`);
    await campaignQueue.releaseCampaignLock(campaignId).catch(() => {});
  } finally {
    clearInterval(heartbeatTimer);
  }
}

/**
 * Graceful shutdown handler
 */
function handleShutdown(signal) {
  logger.info(`⚠️ [CampaignWorker] Received ${signal}. Initiating graceful shutdown...`);
  isRunning = false;

  const waitInterval = setInterval(() => {
    if (activeCampaignsCount === 0) {
      clearInterval(waitInterval);
      logger.info(`👋 [CampaignWorker] All active campaigns finished or released. Exiting process.`);
      process.exit(0);
    } else {
      logger.info(`⏳ [CampaignWorker] Waiting for ${activeCampaignsCount} active campaign(s) to finish chunk...`);
    }
  }, 1000);

  // Force exit after 30 seconds if still hanging
  setTimeout(() => {
    logger.warn(`⚠️ [CampaignWorker] Force exiting after shutdown timeout.`);
    process.exit(1);
  }, 30000);
}

process.on('SIGTERM', () => handleShutdown('SIGTERM'));
process.on('SIGINT', () => handleShutdown('SIGINT'));

// Auto-start if invoked directly via CLI or executed via PM2 worker process
const isDirectExecution = 
  process.env.pm_id !== undefined || // PM2 managed worker
  process.env.CAMPAIGN_WORKER_STANDALONE === 'true' ||
  (process.argv[1] && (
    process.argv[1].replace(/\\/g, '/').includes('campaignWorker') ||
    process.argv[1].replace(/\\/g, '/').includes('campaignRunner') ||
    process.argv[1].replace(/\\/g, '/').includes('campaignQueue')
  ));

// But NEVER auto-start if imported inside the main HTTP server process or running unit test suite
const isMainServer = 
  process.env.name === 'campaignflow-api' ||
  (process.argv[1] && process.argv[1].replace(/\\/g, '/').includes('server.js'));

if (isDirectExecution && !isMainServer && process.env.NODE_ENV !== 'test') {
  startCampaignWorker().catch(err => {
    logger.error('Fatal campaign worker error:', err);
    process.exit(1);
  });
}

export default {
  startCampaignWorker
};

