import http from 'http';
import app from './app.js';
import { checkConnection } from './database/db.js';
import { initSocketServer } from './socket.js';
import { startCampaignScheduler, stopCampaignScheduler } from './services/campaignScheduler.js';
import { startImportWorker } from './workers/importWorker.js';
import { startCampaignWorker } from './workers/campaignWorker.js';
import logger from './utils/logger.js';
import dotenv from 'dotenv';

dotenv.config();

const PORT = parseInt(process.env.PORT || '5000', 10);
const RUN_STANDALONE_WORKER = process.env.RUN_STANDALONE_WORKER === 'true';

async function startServer() {
  logger.info('⚡ [Server] Checking database connection...');
  await checkConnection();

  const httpServer = http.createServer(app);
  initSocketServer(httpServer);

  // Initialize automated background campaign scheduler
  startCampaignScheduler(15000);

  // Initialize automated background workers (if not running as separate worker processes)
  if (!RUN_STANDALONE_WORKER) {
    logger.info('⚙️ [Server] Starting embedded import & campaign background workers...');
    startImportWorker().catch(err => {
      logger.error('⚠️ [Server] Embedded import worker encountered error:', err.message);
    });
    startCampaignWorker().catch(err => {
      logger.error('⚠️ [Server] Embedded campaign worker encountered error:', err.message);
    });
  } else {
    logger.info('ℹ️ [Server] Running in standalone worker mode (Workers handled via dedicated PM2 processes)');
  }

  httpServer.listen(PORT, () => {
    logger.info(`✨ CampaignFlow Backend API listening on port ${PORT}`);
    logger.info(`🌐 Health check available at http://localhost:${PORT}/api/health`);
  });

  const handleShutdown = (signal) => {
    logger.info(`🛑 Received ${signal}. Shutting down gracefully...`);
    stopCampaignScheduler();
    httpServer.close(() => {
      logger.info('👋 Server closed. Exiting process.');
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => handleShutdown('SIGTERM'));
  process.on('SIGINT', () => handleShutdown('SIGINT'));
}

startServer().catch(err => {
  logger.error('❌ Failed to start CampaignFlow backend:', err);
  process.exit(1);
});
