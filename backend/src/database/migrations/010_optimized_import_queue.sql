-- Migration 010: High-Performance Asynchronous Import Queue Schema
-- Enhances import_jobs and import_rows for streaming, chunked batching, recovery and retries

-- 1. Ensure contact_groups & contact_group_members exist if not created earlier
CREATE TABLE IF NOT EXISTS contact_groups (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  business_id BIGINT UNSIGNED NOT NULL,
  name VARCHAR(128) NOT NULL,
  description TEXT NULL,
  color VARCHAR(32) NOT NULL DEFAULT '#0d6efd',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE,
  INDEX idx_groups_business (business_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS contact_group_members (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  business_id BIGINT UNSIGNED NOT NULL,
  group_id BIGINT UNSIGNED NOT NULL,
  contact_id BIGINT UNSIGNED NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE,
  FOREIGN KEY (group_id) REFERENCES contact_groups(id) ON DELETE CASCADE,
  FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE,
  UNIQUE KEY uq_group_contact (group_id, contact_id),
  INDEX idx_group_members_biz (business_id, group_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Add columns to import_jobs for queue processing and recovery
ALTER TABLE import_jobs
  ADD COLUMN file_path VARCHAR(500) NULL AFTER file_name,
  ADD COLUMN file_type VARCHAR(16) NOT NULL DEFAULT 'csv' AFTER file_path,
  ADD COLUMN column_mapping JSON NULL AFTER file_size,
  ADD COLUMN options JSON NULL AFTER column_mapping,
  ADD COLUMN heartbeat_at TIMESTAMP NULL AFTER error_summary,
  ADD COLUMN started_at TIMESTAMP NULL AFTER heartbeat_at,
  ADD COLUMN completed_at TIMESTAMP NULL AFTER started_at,
  ADD COLUMN retry_count INT UNSIGNED NOT NULL DEFAULT 0 AFTER completed_at;

-- 3. Modify status ENUM to include 'retrying'
ALTER TABLE import_jobs 
  MODIFY COLUMN status ENUM('pending', 'processing', 'completed', 'failed', 'cancelled', 'retrying') NOT NULL DEFAULT 'pending';

-- 4. Add index for fast queue claiming with FOR UPDATE SKIP LOCKED
CREATE INDEX idx_import_queue_claim ON import_jobs (status, created_at);
CREATE INDEX idx_import_jobs_heartbeat ON import_jobs (status, heartbeat_at);

