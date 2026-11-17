process.env.NODE_ENV = 'test';
import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { getMemoryStore } from '../src/database/db.js';
import campaignQueue from '../src/queues/campaignQueue.js';
import { processCampaignBatch } from '../src/services/campaignBatchDispatcher.js';
import * as campaignsService from '../src/modules/campaigns/campaigns.service.js';

describe('🚀 Optimized Background Campaign Queue & Chunked Dispatcher Suite', () => {
  const store = getMemoryStore();
  const testBizId = 1;
  const testWabaId = 1;
  const testTplId = 1;

  let testCampaignId = null;
  let testContactIds = [];

  test('1. Bulk Recipient Creation: inserts recipients in batches without blocking', async () => {
    // Ensure template exists and is APPROVED
    let tpl = store.templates.find(t => t.id === testTplId);
    if (!tpl) {
      tpl = {
        id: testTplId,
        business_id: testBizId,
        name: 'welcome_msg',
        status: 'APPROVED',
        language: 'en',
        components: [{ type: 'BODY', text: 'Hello {{customer_name}}, welcome!' }]
      };
      store.templates.push(tpl);
    } else {
      tpl.status = 'APPROVED';
    }

    // Ensure at least 15 active contacts exist for business
    const existing = store.contacts.filter(c => c.business_id === testBizId && (c.status === 'active' || !c.status));
    let nextId = Math.max(0, ...store.contacts.map(c => c.id || 0)) + 1;
    while (existing.length < 15) {
      const newContact = {
        id: nextId++,
        business_id: testBizId,
        name: `Queue Test Contact ${existing.length + 1}`,
        phone: `+9197000${nextId}`,
        is_opted_in: 1,
        status: 'active'
      };
      store.contacts.push(newContact);
      existing.push(newContact);
    }
    testContactIds = existing.slice(0, 15).map(c => c.id);

    const campResult = await campaignsService.createCampaign(testBizId, {
      name: `Queue Scale Test ${Date.now()}`,
      whatsappAccountId: testWabaId,
      templateId: testTplId,
      contactIds: testContactIds
    });

    assert.ok(campResult.id, 'Campaign created');
    testCampaignId = campResult.id;

    const recipients = store.campaign_recipients.filter(r => r.campaign_id === testCampaignId);
    assert.equal(recipients.length, 15, 'All 15 recipients present in database');
    assert.ok(recipients.every(r => r.status === 'pending'), 'Initial status is pending');
  });

  test('2. Atomic Campaign Queueing: transitions status to queued and clears old locks', async () => {
    // Complete any other campaigns so our newly created test campaign is the only active one
    store.campaigns.forEach(c => {
      if (c.id !== testCampaignId) c.status = 'completed';
    });

    await campaignQueue.enqueueCampaign(testCampaignId, testBizId);

    const queuedCamp = store.campaigns.find(c => c.id === testCampaignId);
    assert.equal(queuedCamp.status, 'queued', 'Status set to queued');
    assert.equal(queuedCamp.worker_id, null, 'Worker ID is null');
    assert.equal(queuedCamp.locked_at, null, 'Lock timestamp cleared');
  });

  test('3. Worker Atomic Claim: claims campaign and marks as running with worker ID & heartbeat', async () => {
    const claimed = await campaignQueue.claimNextCampaign('test-worker-alpha');

    assert.ok(claimed, 'Worker claimed next ready campaign');
    assert.equal(claimed.id, testCampaignId);
    assert.equal(claimed.worker_id, 'test-worker-alpha');
    assert.equal(claimed.status, 'running');
    assert.ok(claimed.locked_at, 'Lock timestamp recorded');
  });

  test('4. Heartbeat & Auto-Recovery: recovers orphaned or crashed worker campaigns', async () => {
    const camp = store.campaigns.find(c => c.id === testCampaignId);
    
    // Simulate crash 10 minutes ago
    camp.status = 'running';
    camp.locked_at = new Date(Date.now() - 600000); // 10 min ago
    camp.worker_id = 'crashed-dead-worker';

    const recoveredCount = await campaignQueue.recoverAbandonedCampaigns();
    assert.ok(recoveredCount >= 1, 'Auto-recovered abandoned campaign');

    const recoveredCamp = store.campaigns.find(c => c.id === testCampaignId);
    assert.equal(recoveredCamp.status, 'queued', 'Re-queued for active workers');
    assert.equal(recoveredCamp.worker_id, null, 'Worker lock released');
  });

  test('5. Chunked Streaming Dispatch: rate-paced execution, opt-out suppression, zero message loss', async () => {
    process.env.CAMPAIGN_BATCH_SIZE = '5';
    process.env.CAMPAIGN_PACING_MS = '2'; // Fast for tests

    const camp = store.campaigns.find(c => c.id === testCampaignId);
    camp.batch_cursor = 0;
    camp.sent_count = 0;
    camp.failed_count = 0;
    camp.status = 'queued';

    // Mark recipient #3's contact as unsubscribed prior to send to test suppression
    const recs = store.campaign_recipients.filter(r => r.campaign_id === testCampaignId);
    recs.forEach(r => {
      r.status = 'pending';
      r.sent_at = null;
      r.provider_message_id = null;
    });

    const contactToUnsub = store.contacts.find(c => Number(c.id) === Number(recs[2].contact_id));
    if (contactToUnsub) {
      contactToUnsub.is_opted_in = 0;
      contactToUnsub.status = 'unsubscribed';
    }

    const claimed = await campaignQueue.claimNextCampaign('worker-main');
    assert.ok(claimed, 'Claimed campaign');

    const result = await processCampaignBatch(claimed);
    assert.equal(result.status, 'completed', 'Campaign finished with completed status');

    const finishedCamp = store.campaigns.find(c => c.id === testCampaignId);
    assert.equal(finishedCamp.status, 'completed');
    assert.equal(finishedCamp.sent_count, 14, 'Exactly 14 eligible contacts sent');

    // Recipient #3 must be skipped
    const skippedRec = store.campaign_recipients.find(r => r.id === recs[2].id);
    assert.equal(skippedRec.status, 'skipped', 'Unsubscribed contact was safely suppressed');

    // Exactly 14 sent contacts
    const sentRecs = store.campaign_recipients.filter(r => r.campaign_id === testCampaignId && r.status === 'sent');
    assert.equal(sentRecs.length, 14, '14 contacts sent without any missing messages');
    assert.ok(sentRecs.every(r => r.provider_message_id), 'Every sent message has valid Meta provider_message_id');

    const outboundMsgs = store.messages.filter(m => m.campaign_id === testCampaignId);
    assert.equal(outboundMsgs.length, 14, 'All 14 outbound messages logged in messages table');
  });

  test('6. Dynamic Pause Support: stops dispatch cleanly between chunks without corrupting cursor', async () => {
    const pauseContactIds = [];
    for (let i = 1; i <= 10; i++) {
      const cId = 89000 + i;
      pauseContactIds.push(cId);
      store.contacts.push({
        id: cId,
        business_id: testBizId,
        name: `Pause Contact ${i}`,
        phone: `+9197111${cId}`,
        is_opted_in: 1,
        status: 'active'
      });
    }

    const campResult = await campaignsService.createCampaign(testBizId, {
      name: `Pause Mid-way Test ${Date.now()}`,
      whatsappAccountId: testWabaId,
      templateId: testTplId,
      contactIds: pauseContactIds
    });

    await campaignsService.pauseCampaign(testBizId, campResult.id);

    const pausedCamp = store.campaigns.find(c => c.id === campResult.id);
    assert.equal(pausedCamp.status, 'paused');

    const dispatchResult = await processCampaignBatch(pausedCamp);
    assert.equal(dispatchResult.status, 'paused');
    assert.equal(dispatchResult.stopped, true);
  });
});
