module.exports = {
  apps: [
    {
      name: 'campaignflow-api',
      script: 'src/server.js',
      cwd: './backend',
      instances: 'max',
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 5000,
        RUN_STANDALONE_WORKER: 'true'
      }
    },
    {
      name: 'campaignflow-worker',
      script: 'src/queues/campaignQueue.js',
      cwd: './backend',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production'
      }
    },
    {
      name: 'campaignflow-import-worker',
      script: 'src/workers/index.js',
      cwd: './backend',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        IMPORT_BATCH_SIZE: 500,
        IMPORT_POLL_INTERVAL_MS: 1500
      }
    }
  ]
};
