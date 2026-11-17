process.env.NODE_ENV = 'test';
import { describe, test, before } from 'node:test';
import assert from 'node:assert/strict';
import { getMemoryStore, checkConnection } from '../src/database/db.js';
import campaignQueue from '../src/queues/campaignQueue.js';
import { processCampaignBatch } from '../src/services/campaignBatchDispatcher.js';
import * as campaignsService from '../src/modules/campaigns/campaigns.service.js';

describe('🎯 300 Leads Scale & Zero-Message-Loss Verification Test', () => {
  let store;
  const testBizId = 1;
  const testWabaId = 1;
  const testTplId = 1;
  const TOTAL_LEADS = 300;
  const SUPPRESSED_LEADS = 10;
  const EXPECTED_SENT = TOTAL_LEADS - SUPPRESSED_LEADS; // 290

  let testCampaignId = null;
  let testContactIds = [];

  before(async () => {
    await checkConnection();
    store = getMemoryStore();

    // Ensure template exists and is APPROVED
    let tpl = store.templates.find(t => t.id === testTplId);
    if (!tpl) {
      tpl = {
        id: testTplId,
        business_id: testBizId,
        name: 'welcome_msg',
        status: 'APPROVED',
        language: 'en',
        components: [{ type: 'BODY', text: 'Hello {{customer_name}}, here is your exclusive offer!' }]
      };
      store.templates.push(tpl);
    } else {
      tpl.status = 'APPROVED';
    }
  });

  test(`1. Generate & Insert ${TOTAL_LEADS} unique leads into contacts table`, async () => {
    testContactIds = [];
    const basePhone = 9800000000;

    for (let i = 1; i <= TOTAL_LEADS; i++) {
      const contactId = 800000 + i;

      // All 300 created as initially active & opted-in so they link to campaign
      const contact = {
        id: contactId,
        business_id: testBizId,
        name: `Lead Customer ${i}`,
        phone: `+91${basePhone + i}`,
        is_opted_in: 1,
        status: 'active'
      };

      // Remove any existing duplicate in memory
      store.contacts = store.contacts.filter(c => c.id !== contactId);
      store.contacts.push(contact);
      testContactIds.push(contactId);
    }

    assert.equal(testContactIds.length, TOTAL_LEADS, `Generated ${TOTAL_LEADS} unique lead contact IDs`);
  });

  test(`2. Create Campaign with all ${TOTAL_LEADS} leads and verify recipient batch creation`, async () => {
    const campResult = await campaignsService.createCampaign(testBizId, {
      name: `Scale 300 Leads Audit Campaign ${Date.now()}`,
      whatsappAccountId: testWabaId,
      templateId: testTplId,
      contactIds: testContactIds
    });

    assert.ok(campResult.id, 'Campaign successfully created with ID');
    testCampaignId = campResult.id;

    // Check recipients table
    const recipients = store.campaign_recipients.filter(r => r.campaign_id === testCampaignId);
    assert.equal(recipients.length, TOTAL_LEADS, `Exactly ${TOTAL_LEADS} recipient rows linked to campaign`);
    assert.ok(recipients.every(r => r.status === 'pending'), 'All 300 recipients initialized as pending');

    // Now simulate 10 contacts revoking consent / unsubscribing right before dispatch
    for (let i = 1; i <= SUPPRESSED_LEADS; i++) {
      const c = store.contacts.find(contact => contact.id === testContactIds[i - 1]);
      if (c) {
        c.is_opted_in = 0;
        c.status = 'unsubscribed';
      }
    }
  });

  test('3. Enqueue Campaign and verify atomic lock state', async () => {
    // Complete other running campaigns in test memory so this test campaign is isolated
    store.campaigns.forEach(c => {
      if (c.id !== testCampaignId) c.status = 'completed';
    });

    await campaignQueue.enqueueCampaign(testCampaignId, testBizId);

    const queued = store.campaigns.find(c => c.id === testCampaignId);
    assert.equal(queued.status, 'queued', 'Status updated to queued');
    assert.equal(queued.worker_id, null, 'Worker ID is initially null');
    assert.equal(queued.locked_at, null, 'Locked timestamp is initially null');
  });

  test(`4. Worker claims campaign and executes 6 chunks (50 leads per chunk) with zero loss`, async () => {
    // Set chunk batch size = 50, pacing = 1ms for test speed
    process.env.CAMPAIGN_BATCH_SIZE = '50';
    process.env.CAMPAIGN_PACING_MS = '1';

    const workerId = 'test-worker-300-scale';
    const claimedCampaign = await campaignQueue.claimNextCampaign(workerId);

    assert.ok(claimedCampaign, 'Worker successfully claimed campaign');
    assert.equal(claimedCampaign.id, testCampaignId);
    assert.equal(claimedCampaign.worker_id, workerId);
    assert.equal(claimedCampaign.status, 'running');

    // Execute chunked dispatcher
    const result = await processCampaignBatch(claimedCampaign);
    assert.equal(result.status, 'completed', 'Campaign finished with completed status');

    // Release worker lock upon completion
    await campaignQueue.releaseCampaignLock(testCampaignId);
  });

  test('5. Verify audit results: Exactly 290 sent, 10 suppressed, 0 failed, 0 missed', async () => {
    const finalCamp = store.campaigns.find(c => c.id === testCampaignId);
    assert.equal(finalCamp.status, 'completed', 'Campaign status is completed');
    assert.equal(finalCamp.sent_count, EXPECTED_SENT, `Sent count is exactly ${EXPECTED_SENT}`);
    assert.equal(finalCamp.failed_count, 0, 'Zero failed messages');
    assert.equal(finalCamp.worker_id, null, 'Worker lock properly released');

    const allRecipients = store.campaign_recipients.filter(r => r.campaign_id === testCampaignId);
    assert.equal(allRecipients.length, TOTAL_LEADS, `Total recipients remained exactly ${TOTAL_LEADS}`);

    // Verify 290 Sent
    const sentRecipients = allRecipients.filter(r => r.status === 'sent');
    assert.equal(sentRecipients.length, EXPECTED_SENT, `Exactly ${EXPECTED_SENT} recipients marked sent`);
    assert.ok(sentRecipients.every(r => r.provider_message_id && (r.provider_message_id.startsWith('wamid.') || r.provider_message_id.startsWith('wam_'))), 'Every sent recipient has valid Meta provider_message_id');

    // Verify 10 Suppressed / Skipped
    const skippedRecipients = allRecipients.filter(r => r.status === 'skipped');
    assert.equal(skippedRecipients.length, SUPPRESSED_LEADS, `Exactly ${SUPPRESSED_LEADS} unsubscribed leads safely skipped`);

    // Verify 0 Pending (zero missed messages)
    const pendingRecipients = allRecipients.filter(r => r.status === 'pending');
    assert.equal(pendingRecipients.length, 0, 'Zero pending recipients - 100% of leads processed without drops');

    // Verify messages table has all 290 outbound records
    const outboundMessages = store.messages.filter(m => m.campaign_id === testCampaignId);
    assert.equal(outboundMessages.length, EXPECTED_SENT, `All ${EXPECTED_SENT} outbound messages recorded in database`);
  });
});
