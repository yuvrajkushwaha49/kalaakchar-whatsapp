import logger from '../utils/logger.js';
import { executeQuery, isUsingFallback, getMemoryStore, saveMemoryStore } from '../database/db.js';
import { processCampaignBatch } from '../services/campaignBatchDispatcher.js';
import { emitToTenant } from '../socket.js';

/**
 * Enqueue a campaign for background dispatch
 */
export async function enqueueCampaign(campaignId, businessId) {
  const numCampId = Number(campaignId);
  const numBizId = Number(businessId);

  logger.info(`📋 [CampaignQueue] Enqueueing Campaign #${numCampId} for Business #${numBizId}`);

  if (isUsingFallback()) {
    const store = getMemoryStore();
    const camp = store.campaigns?.find(c => c.id === numCampId && c.business_id === numBizId);
    if (camp) {
      camp.status = 'queued';
      camp.started_at = camp.started_at || new Date();
      camp.locked_at = null;
      camp.worker_id = null;
      saveMemoryStore();
    }
  } else {
    await executeQuery(
      `UPDATE campaigns 
       SET status = 'queued', locked_at = NULL, worker_id = NULL, started_at = COALESCE(started_at, NOW())
       WHERE id = ? AND business_id = ?`,
      [numCampId, numBizId]
    );
  }

  emitToTenant(numBizId, 'campaign:status_update', {
    campaignId: numCampId,
    status: 'queued'
  });

  return { enqueued: true, campaignId: numCampId, status: 'queued' };
}

/**
 * Claim the next available campaign for worker processing (MySQL 8 FOR UPDATE SKIP LOCKED)
 */
export async function claimNextCampaign(workerId = 'worker-1') {
  if (isUsingFallback()) {
    const store = getMemoryStore();
    const now = Date.now();
    const ready = (store.campaigns || []).find(c => {
      const isQueuedOrRunning = c.status === 'queued' || c.status === 'running';
      if (!isQueuedOrRunning) return false;
      if (!c.locked_at) return true;
      // Stale lock recovery (> 5 min)
      return (now - new Date(c.locked_at).getTime()) > 300000;
    });

    if (!ready) return null;

    ready.status = 'running';
    ready.locked_at = new Date();
    ready.worker_id = workerId;
    saveMemoryStore();
    return { ...ready };
  }

  // MySQL 8 Atomic Claim with FOR UPDATE SKIP LOCKED
  const rows = await executeQuery(
    `SELECT id, business_id, name, whatsapp_account_id, template_id, variable_mappings, 
            total_recipients, sent_count, failed_count, batch_cursor, status
     FROM campaigns
     WHERE status IN ('queued', 'running')
       AND (locked_at IS NULL OR locked_at < DATE_SUB(NOW(), INTERVAL 5 MINUTE))
     ORDER BY id ASC
     LIMIT 1
     FOR UPDATE SKIP LOCKED`
  );

  if (!rows || rows.length === 0) {
    return null;
  }

  const campaign = rows[0];

  // Lock campaign for this worker
  await executeQuery(
    `UPDATE campaigns 
     SET worker_id = ?, locked_at = NOW(), status = 'running' 
     WHERE id = ?`,
    [workerId, campaign.id]
  );

  return campaign;
}

/**
 * Refresh worker heartbeat on campaign
 */
export async function updateCampaignHeartbeat(campaignId) {
  if (isUsingFallback()) {
    const store = getMemoryStore();
    const camp = store.campaigns?.find(c => c.id === Number(campaignId));
    if (camp) {
      camp.locked_at = new Date();
    }
    return;
  }

  await executeQuery('UPDATE campaigns SET locked_at = NOW() WHERE id = ?', [campaignId]);
}

/**
 * Release campaign lock (e.g. if worker is shutting down or paused)
 */
export async function releaseCampaignLock(campaignId) {
  if (isUsingFallback()) {
    const store = getMemoryStore();
    const camp = store.campaigns?.find(c => c.id === Number(campaignId));
    if (camp) {
      camp.locked_at = null;
      camp.worker_id = null;
    }
    return;
  }

  await executeQuery('UPDATE campaigns SET locked_at = NULL, worker_id = NULL WHERE id = ?', [campaignId]);
}

/**
 * Auto-recover abandoned/crashed campaigns (heartbeat older than 5 minutes)
 */
export async function recoverAbandonedCampaigns() {
  if (isUsingFallback()) {
    const store = getMemoryStore();
    const now = Date.now();
    let recovered = 0;
    (store.campaigns || []).forEach(c => {
      if (c.status === 'running' && c.locked_at && (now - new Date(c.locked_at).getTime()) > 300000) {
        c.locked_at = null;
        c.worker_id = null;
        c.status = 'queued';
        recovered++;
      }
    });
    return recovered;
  }

  const result = await executeQuery(
    `UPDATE campaigns 
     SET status = 'queued', locked_at = NULL, worker_id = NULL 
     WHERE status = 'running' 
       AND locked_at IS NOT NULL 
       AND locked_at < DATE_SUB(NOW(), INTERVAL 5 MINUTE)`
  );

  return result?.affectedRows || 0;
}

/**
 * Backward-compatible dispatch runner
 */
export async function executeCampaignDispatch(campaignId, businessId) {
  let campaign;
  if (isUsingFallback()) {
    const store = getMemoryStore();
    campaign = store.campaigns?.find(c => c.id === Number(campaignId));
  } else {
    const rows = await executeQuery('SELECT * FROM campaigns WHERE id = ? AND business_id = ? LIMIT 1', [campaignId, businessId]);
    campaign = rows[0];
  }

  if (!campaign) {
    logger.warn(`[CampaignQueue] Campaign #${campaignId} not found for dispatch`);
    return;
  }

  return processCampaignBatch(campaign);
}

// Auto-start worker if executed directly as script (e.g. by PM2 or node)
if (process.argv[1] && process.argv[1].replace(/\\/g, '/').endsWith('src/queues/campaignQueue.js')) {
  import('../workers/campaignWorker.js').then(m => {
    m.startCampaignWorker().catch(err => {
      logger.error('Fatal campaign worker error:', err);
      process.exit(1);
    });
  });
}

export default {
  enqueueCampaign,
  claimNextCampaign,
  updateCampaignHeartbeat,
  releaseCampaignLock,
  recoverAbandonedCampaigns,
  executeCampaignDispatch
};
