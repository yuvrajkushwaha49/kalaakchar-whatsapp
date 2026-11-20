-- ==============================================================================
-- Migration 012: Add use_env_fallback toggle to platform_meta_configs
-- Allows SuperAdmin to choose whether to fallback to server .env credentials
-- or strictly enforce database-only Meta Developer App configuration.
-- ==============================================================================

ALTER TABLE platform_meta_configs 
  ADD COLUMN use_env_fallback TINYINT(1) DEFAULT 1 AFTER is_enabled;
