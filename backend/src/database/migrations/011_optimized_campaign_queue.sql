-- Migration 011: High-Performance Asynchronous Campaign Dispatch Queue Schema
-- Upgrades campaigns table for background worker claiming, chunked batch dispatching, recovery and cursor indexing

-- 1. Modify status ENUM to include 'queued'
ALTER TABLE campaigns 
  MODIFY COLUMN status ENUM('draft', 'scheduled', 'queued', 'running', 'paused', 'completed', 'cancelled', 'failed') NOT NULL DEFAULT 'draft';

-- 2. Add worker_id, locked_at and batch_cursor for zero-loss chunked processing
ALTER TABLE campaigns
  ADD COLUMN worker_id VARCHAR(64) NULL AFTER status,
  ADD COLUMN locked_at TIMESTAMP NULL AFTER worker_id,
  ADD COLUMN batch_cursor BIGINT UNSIGNED NOT NULL DEFAULT 0 AFTER locked_at;

-- 3. Indexes for fast queue claiming with FOR UPDATE SKIP LOCKED and cursor-based recipient querying
CREATE INDEX idx_campaigns_worker_claim ON campaigns (status, scheduled_at, locked_at);
CREATE INDEX idx_recipients_cursor ON campaign_recipients (campaign_id, status, id);
