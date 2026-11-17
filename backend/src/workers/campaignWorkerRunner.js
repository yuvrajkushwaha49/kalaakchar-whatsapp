import { startCampaignWorker } from './campaignWorker.js';
import logger from '../utils/logger.js';

startCampaignWorker().catch(err => {
  logger.error('Fatal campaign worker error:', err);
  process.exit(1);
});

