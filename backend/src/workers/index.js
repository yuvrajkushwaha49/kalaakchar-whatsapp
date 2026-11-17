import { startImportWorker } from './importWorker.js';

startImportWorker().catch(err => {
  console.error('Fatal worker error:', err);
  process.exit(1);
});

