import { executeQuery, isUsingFallback, getMemoryStore, saveMemoryStore } from '../src/database/db.js';
import { syncDatabaseToLocalBackup } from '../src/database/syncBackup.js';

async function main() {
  console.log('--- Checking current table row counts ---');

  const targetTables = [
    'campaign_recipients',
    'campaigns',
    'whatsapp_message_media',
    'whatsapp_messages',
    'messages',
    'whatsapp_conversation_assignments',
    'whatsapp_conversation_events',
    'whatsapp_conversation_notes',
    'whatsapp_conversations',
    'inbound_conversations',
    'templates',
    'contact_group_members',
    'contact_groups',
    'contact_tags',
    'tags',
    'contact_consents',
    'import_rows',
    'import_jobs',
    'contacts',
    'meta_onboarding_sessions',
    'whatsapp_accounts',
    'tenant_meta_integrations'
  ];

  if (!isUsingFallback()) {
    // Disable foreign key checks for safe cascading clean
    await executeQuery('SET FOREIGN_KEY_CHECKS = 0');
    try {
      for (const table of targetTables) {
        const countRes = await executeQuery(`SELECT COUNT(*) as count FROM ${table}`);
        const before = countRes[0].count;
        await executeQuery(`TRUNCATE TABLE ${table}`);
        console.log(`[MySQL] Cleared ${table} (deleted ${before} rows)`);
      }
    } finally {
      await executeQuery('SET FOREIGN_KEY_CHECKS = 1');
    }
  }

  // Also clean the local fallback store (.dev_store.json)
  const store = getMemoryStore();
  let devStoreCleaned = 0;
  for (const table of targetTables) {
    if (Array.isArray(store[table]) && store[table].length > 0) {
      devStoreCleaned += store[table].length;
      store[table] = [];
    }
  }
  saveMemoryStore();
  console.log(`[MemoryStore/.dev_store.json] Cleaned ${devStoreCleaned} items`);

  // Sync to local backup so backup is in sync
  try {
    await syncDatabaseToLocalBackup();
    console.log('[Backup] Local backup synced');
  } catch (err) {
    console.warn('[Backup] Sync warning:', err.message);
  }

  console.log('✅ All requested tables have been successfully emptied!');
  process.exit(0);
}

main().catch(err => {
  console.error('Error during cleanup:', err);
  process.exit(1);
});
