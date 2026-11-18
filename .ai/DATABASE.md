# Database Architecture & Schema Specification

> Discovered and compiled from MySQL migrations in `backend/src/database/migrations/001-011` and connection pool in `backend/src/database/connection.js`.

---

## 1. Database Technology

- **RDBMS Engine**: MySQL 8.0+
- **Default Character Set**: `utf8mb4`
- **Default Collation**: `utf8mb4_unicode_ci`
- **Storage Engine**: `InnoDB`
- **Connection Driver**: `mysql2/promise` with connection pooling
- **Resilient Fallback Mode**: If MySQL server is unreachable during local development or unit testing (`ECONNREFUSED`), the system seamlessly switches to an in-memory mock store backed by `backend/.dev_store.json`.

---

## 2. Entity Relationship Overview

```text
businesses (1) ──< users (N) ──< user_sessions (N)
     │
     ├──< whatsapp_accounts (N) ──< templates (N)
     │         │
     │         ├──< campaigns (N) ──< campaign_recipients (N) >── contacts
     │         │
     │         └──< whatsapp_conversations (N) ──< whatsapp_messages (N)
     │
     ├──< contacts (N) ──< contact_tags (N) >── tags (N)
     │         │
     │         ├──< contact_group_members (N) >── contact_groups (N)
     │         │
     │         └──< contact_consents (N)
     │
     ├──< import_jobs (N) ──< import_rows (N)
     │
     ├──< subscriptions (1) >── subscription_plans (1)
     │
     └──< audit_logs (N) & notifications (N)
```

---

## 3. Detailed Table Specifications

### 3.1. `businesses` (Tenants)
Primary table representing isolated client tenants.
- `id`: BIGINT UNSIGNED AUTO_INCREMENT, PRIMARY KEY
- `name`: VARCHAR(255) NOT NULL
- `slug`: VARCHAR(255) NOT NULL UNIQUE
- `timezone`: VARCHAR(64) NOT NULL DEFAULT 'UTC'
- `status`: ENUM('active', 'suspended', 'pending') NOT NULL DEFAULT 'active'
- `created_at`, `updated_at`: TIMESTAMP
- Indexes: `idx_business_status(status)`

### 3.2. `users` (User Accounts)
- `id`: BIGINT UNSIGNED AUTO_INCREMENT, PRIMARY KEY
- `business_id`: BIGINT UNSIGNED NULL, FOREIGN KEY -> `businesses(id)` ON DELETE CASCADE
- `name`: VARCHAR(255) NOT NULL
- `email`: VARCHAR(255) NOT NULL UNIQUE
- `password_hash`: VARCHAR(255) NOT NULL (Bcrypt)
- `role`: ENUM('superadmin', 'owner', 'admin', 'marketer', 'agent') NOT NULL DEFAULT 'agent'
- `is_email_verified`: BOOLEAN NOT NULL DEFAULT FALSE
- `status`: ENUM('active', 'suspended') NOT NULL DEFAULT 'active'
- `created_at`, `updated_at`: TIMESTAMP
- Indexes: `idx_users_business_role(business_id, role)`

### 3.3. `user_sessions` (Refresh Tokens)
- `id`: BIGINT UNSIGNED AUTO_INCREMENT, PRIMARY KEY
- `user_id`: BIGINT UNSIGNED NOT NULL, FOREIGN KEY -> `users(id)` ON DELETE CASCADE
- `refresh_token_hash`: VARCHAR(255) NOT NULL
- `user_agent`: VARCHAR(512) NULL
- `ip_address`: VARCHAR(45) NULL
- `expires_at`: TIMESTAMP NOT NULL
- `created_at`: TIMESTAMP

### 3.4. `whatsapp_accounts` (Connected Numbers & WABAs)
- `id`: BIGINT UNSIGNED AUTO_INCREMENT, PRIMARY KEY
- `business_id`: BIGINT UNSIGNED NOT NULL, FOREIGN KEY -> `businesses(id)` ON DELETE CASCADE
- `meta_business_id`: VARCHAR(128) NULL
- `waba_id`: VARCHAR(128) NOT NULL
- `phone_number_id`: VARCHAR(128) NOT NULL
- `phone_number`: VARCHAR(32) NOT NULL
- `display_name`: VARCHAR(255) NOT NULL
- `verified_name`: VARCHAR(255) NULL
- `quality_rating`: VARCHAR(32) DEFAULT 'UNKNOWN'
- `messaging_limit_tier`: VARCHAR(64) DEFAULT 'TIER_250'
- `status`: ENUM('connected', 'disconnected', 'restricted') NOT NULL DEFAULT 'connected'
- `is_primary`: BOOLEAN NOT NULL DEFAULT FALSE
- `connection_status`: VARCHAR(64) DEFAULT 'CONNECTED'
- `access_token_encrypted`: TEXT NULL (AES-256-CBC encrypted)
- `token_type`: VARCHAR(64) DEFAULT 'BEARER'
- `token_expires_at`: TIMESTAMP NULL
- `last_error_message`: TEXT NULL
- `last_error_at`: TIMESTAMP NULL
- Indexes & Constraints:
  - UNIQUE KEY `uq_business_waba_phone(business_id, phone_number_id)`
  - `idx_whatsapp_primary(business_id, is_primary)`
  - `idx_whatsapp_status_health(connection_status, last_error_at)`

### 3.5. `contacts` (Audience Master)
- `id`: BIGINT UNSIGNED AUTO_INCREMENT, PRIMARY KEY
- `business_id`: BIGINT UNSIGNED NOT NULL, FOREIGN KEY -> `businesses(id)` ON DELETE CASCADE
- `phone`: VARCHAR(32) NOT NULL (E.164 normalized)
- `country_code`: VARCHAR(8) NOT NULL DEFAULT '91'
- `name`: VARCHAR(255) NULL
- `first_name`: VARCHAR(128) NULL
- `last_name`: VARCHAR(128) NULL
- `email`: VARCHAR(255) NULL
- `is_opted_in`: BOOLEAN NOT NULL DEFAULT TRUE
- `status`: ENUM('active', 'unsubscribed', 'invalid') NOT NULL DEFAULT 'active'
- `tags`: JSON NULL
- `custom_fields`: JSON NULL
- `last_contacted_at`: TIMESTAMP NULL
- `created_at`, `updated_at`: TIMESTAMP
- Indexes & Constraints:
  - UNIQUE KEY `uq_business_contact_phone(business_id, phone)`
  - `idx_contacts_lookup(business_id, status, is_opted_in)`

### 3.6. `contact_consents` (Compliance & Opt-In Proof)
- `id`: BIGINT UNSIGNED AUTO_INCREMENT, PRIMARY KEY
- `business_id`: BIGINT UNSIGNED NOT NULL, FOREIGN KEY -> `businesses(id)` ON DELETE CASCADE
- `contact_id`: BIGINT UNSIGNED NOT NULL, FOREIGN KEY -> `contacts(id)` ON DELETE CASCADE
- `consent_status`: ENUM('opted_in', 'opted_out') NOT NULL
- `consent_source`: VARCHAR(128) NOT NULL DEFAULT 'csv_import'
- `consent_category`: VARCHAR(128) NOT NULL DEFAULT 'promotional'
- `proof_notes`: TEXT NULL
- `ip_address`: VARCHAR(45) NULL
- `withdrawn_at`: TIMESTAMP NULL

### 3.7. `tags` & `contact_tags`
- `tags`: `id, business_id, name, color, created_at` (UNIQUE `uq_business_tag_name(business_id, name)`)
- `contact_tags`: `id, business_id, contact_id, tag_id, created_at` (UNIQUE `uq_contact_tag(contact_id, tag_id)`)

### 3.8. `contact_groups` & `contact_group_members`
- `contact_groups`: `id, business_id, name, description, color, created_at, updated_at`
- `contact_group_members`: `id, business_id, group_id, contact_id, created_at` (UNIQUE `uq_group_contact(group_id, contact_id)`)

### 3.9. `import_jobs` & `import_rows`
- `import_jobs`:
  - `id, business_id, user_id, file_name, file_size, total_rows, processed_rows, successful_rows, failed_rows, duplicate_rows`
  - `status`: ENUM('pending', 'processing', 'completed', 'failed', 'cancelled')
  - `error_summary`: TEXT
  - `worker_id`: VARCHAR(64) NULL
  - `locked_at`: TIMESTAMP NULL
- `import_rows`:
  - `id, job_id, row_number, phone, raw_data JSON, status ENUM('imported', 'failed', 'skipped'), error_reason, created_at`

### 3.10. `templates` (WhatsApp Approved Templates)
- `id`: BIGINT UNSIGNED AUTO_INCREMENT, PRIMARY KEY
- `business_id`: BIGINT UNSIGNED NOT NULL, FOREIGN KEY -> `businesses(id)` ON DELETE CASCADE
- `whatsapp_account_id`: BIGINT UNSIGNED NOT NULL, FOREIGN KEY -> `whatsapp_accounts(id)` ON DELETE CASCADE
- `meta_template_id`: VARCHAR(128) NOT NULL
- `name`: VARCHAR(255) NOT NULL
- `language`: VARCHAR(32) NOT NULL DEFAULT 'en_US'
- `category`: ENUM('MARKETING', 'UTILITY', 'AUTHENTICATION') NOT NULL
- `status`: ENUM('APPROVED', 'PENDING', 'REJECTED', 'PAUSED', 'DISABLED') NOT NULL DEFAULT 'PENDING'
- `parameter_format`: ENUM('POSITIONAL', 'NAMED') NOT NULL DEFAULT 'POSITIONAL'
- `components`: JSON NOT NULL (Header, Body, Footer, Buttons)
- Indexes & Constraints:
  - UNIQUE KEY `uq_template_meta(whatsapp_account_id, meta_template_id)`
  - `idx_template_status_lang(business_id, status, language)`

### 3.11. `campaigns` & `campaign_recipients`
- `campaigns`:
  - `id, business_id, whatsapp_account_id, template_id, name, purpose`
  - `status`: ENUM('draft', 'scheduled', 'queued', 'running', 'paused', 'completed', 'cancelled', 'failed')
  - `worker_id`: VARCHAR(64) NULL (claimed by background worker)
  - `locked_at`: TIMESTAMP NULL (worker heartbeat timestamp)
  - `batch_cursor`: BIGINT UNSIGNED NOT NULL DEFAULT 0 (streaming progress cursor)
  - `total_recipients, sent_count, delivered_count, read_count, failed_count`
  - `scheduled_at, started_at, completed_at, variable_mappings JSON`
  - Indexes: `idx_campaigns_worker_claim(status, scheduled_at, locked_at)`
- `campaign_recipients`:
  - `id, business_id, campaign_id, contact_id, phone`
  - `status`: ENUM('pending', 'queued', 'sent', 'delivered', 'read', 'failed', 'skipped')
  - `skip_reason, error_message, sent_at, delivered_at, read_at, provider_message_id, retry_count`
  - Indexes: `idx_recipients_cursor(campaign_id, status, id)`

### 3.12. `messages` (Unified Message Log)
- `id, business_id, campaign_id, contact_id, whatsapp_account_id, direction ENUM('outbound', 'inbound')`
- `provider_message_id`: VARCHAR(128) NULL UNIQUE (Meta `wamid...`)
- `phone`: VARCHAR(32) NOT NULL
- `message_type`: VARCHAR(64) NOT NULL DEFAULT 'template'
- `content`: JSON NULL
- `status`: ENUM('queued', 'sent', 'delivered', 'read', 'failed')
- `error_code, error_message, raw_payload JSON, created_at, updated_at`

### 3.13. `whatsapp_conversations` (Two-Way Live Inbox)
- `id, business_id, whatsapp_account_id, contact_id, customer_phone, assigned_user_id`
- `status`: ENUM('open', 'closed', 'pending')
- `unread_count`: INT UNSIGNED NOT NULL DEFAULT 0
- `last_message_text, last_message_at, last_incoming_message_at`
- `service_window_expires_at`: TIMESTAMP NULL (Meta 24-hour window tracker)

### 3.14. `subscription_plans` & `subscriptions`
- `subscription_plans`: `id, name, slug, monthly_price, max_contacts, max_campaigns_per_month, max_messages_per_month, max_team_members, features JSON, is_active`
- `subscriptions`: `id, business_id UNIQUE, plan_id, status, current_period_start, current_period_end`

### 3.15. `platform_meta_configs` (SuperAdmin SaaS Meta Config)
- `id, meta_app_id, encrypted_meta_app_secret, embedded_signup_config_id, graph_api_version, webhook_verify_token, encrypted_webhook_app_secret, is_enabled, readiness_status`

---

## 4. Key Atomic Query Patterns

1. **Atomic Campaign Claiming with Concurrency Locks**:
   ```sql
   SELECT * FROM campaigns
   WHERE status IN ('queued', 'running')
     AND (locked_at IS NULL OR locked_at < DATE_SUB(NOW(), INTERVAL 5 MINUTE))
   ORDER BY id ASC
   LIMIT 1
   FOR UPDATE SKIP LOCKED;
   ```

2. **Cursor-Based Streaming Recipient Fetching**:
   ```sql
   SELECT r.id, r.contact_id, r.phone, c.name as contact_name, c.is_opted_in, c.status as contact_status
   FROM campaign_recipients r
   LEFT JOIN contacts c ON r.contact_id = c.id
   WHERE r.campaign_id = ?
     AND r.business_id = ?
     AND r.status = 'pending'
     AND r.id > ?
   ORDER BY r.id ASC
   LIMIT ?;
   ```

