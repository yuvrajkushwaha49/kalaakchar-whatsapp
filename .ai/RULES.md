# AI Coding Guidelines & Operational Rules

> Established for the CampaignFlow platform based on its multi-tenant architecture, compliance requirements, and existing patterns.

---

## 1. General Engineering Principles

1. **Inspect Before Modifying**:
   - Always read the target file, its callers, its database schema, and existing tests before proposing or making edits.
   - Do not guess parameter names, table columns, or route patterns.

2. **Reuse Existing Implementations**:
   - Phone formatting: Reuse `normalizePhone` (`backend/src/utils/phone.js`) and `normalizePhoneNumber` in frontend.
   - Database queries: Reuse `executeQuery` (`backend/src/database/db.js`) or `query` (`connection.js`).
   - Token encryption: Reuse `encryptToken` / `decryptToken` (`backend/src/utils/crypto.js`).
   - HTTP requests: Reuse `api.js` (`frontend/src/services/api.js`).
   - Sockets: Reuse `socket.js` (`backend/src/socket.js` and `frontend/src/services/socket.js`).

3. **Avoid Duplicate Functionality**:
   - Do not create parallel route handlers, separate database pools, or redundant normalizers.

4. **Follow Established Conventions**:
   - Backend uses Node.js ES Modules (`import ... from '...'` with explicit `.js` extensions).
   - Frontend uses React functional components with Bootstrap 5 utility classes and standard hooks.
   - File extensions: `.jsx` for React components; `.js` for backend modules; `.cjs` for CommonJS scripts.

5. **Avoid Unnecessary Dependencies**:
   - Do not install new npm libraries unless strictly required, justified, and confirmed.
   - Prefer Node.js standard library (`fs`, `path`, `crypto`, `http`, `node:test`).

6. **Avoid Unnecessary Refactoring**:
   - Keep diffs small, surgical, and localized to the problem being solved.
   - Never reformat entire files or change variable naming conventions without reason.

7. **Do Not Delete Functionality Without Approval**:
   - Maintain backward-compatible endpoints (e.g. `/imports/execute`, fallback endpoints).
   - Never drop database tables or columns in production migrations.

8. **Never Expose Secrets**:
   - Never write plain passwords, API keys, Meta App Secrets, or JWT secrets to code, logs, or documentation.
   - Sensitive tokens must be encrypted using `encryptToken` before saving into `whatsapp_accounts` or `platform_meta_configs`.

---

## 2. Project-Specific Architectural Rules

### 2.1. Multi-Tenant Isolation
- **Mandatory `business_id` Scope**:
  - Every single query that accesses tenant data (`contacts`, `campaigns`, `templates`, `messages`, `groups`) **MUST** include `business_id = ?`.
  - Never allow queries of the form `SELECT * FROM contacts WHERE id = ?` without also checking `business_id = ?`.
  - In Socket.io, always emit events to `tenant_<businessId>` using `emitToTenant(businessId, event, data)`.

### 2.2. Dual Database Engine Support (MySQL + Fallback Store)
- In `backend/src/database/db.js`, the system supports a dual operational mode:
  1. MySQL 8 production database.
  2. In-memory dev/testing fallback store (`.dev_store.json`).
- When modifying database logic or adding new queries, **always ensure both MySQL queries and fallback memory store handlers are kept in parity**, so that `npm test` continues to pass cleanly without requiring a live local MySQL daemon.

### 2.3. Asynchronous Queue & Worker Pattern
- **Never perform bulk sending or large file parsing inside HTTP request loops**:
  - High-volume file imports MUST be queued into `import_jobs` and handled by `importWorker.js`.
  - Campaign broadcasts MUST be queued into `campaigns` (status `'queued'`) and claimed by `campaignWorker.js`.
- **Atomic Concurrency Locks**:
  - When claiming jobs, use `FOR UPDATE SKIP LOCKED` (or timestamp lock check in fallback) to prevent duplicate processing by concurrent worker instances.
  - Workers must maintain a heartbeat (`locked_at = NOW()`) every 30 seconds.

### 2.4. Meta WhatsApp Cloud API Compliance
- **Opt-Out Compliance**:
  - Only contacts with `is_opted_in = 1` and `status = 'active'` may receive broadcasts.
  - Contacts marked `unsubscribed`, `inactive`, or `is_opted_in = 0` must be marked as `skipped` in `campaign_recipients`.
- **Approved Templates Only**:
  - Only templates with `status = 'APPROVED'` in the database may be dispatched.
- **Rate Pacing**:
  - Outbound dispatch must maintain deliberate rate pacing (`CAMPAIGN_PACING_MS`, default 25ms = ~40 msg/sec) to avoid hitting Meta Cloud API throughput restrictions or triggering spam blocks.

### 2.5. PM2 Daemon Compatibility
- Workers executed via PM2 in fork mode (`campaignflow-worker`, `campaignflow-import-worker`) run inside PM2 containers.
- Entry-point scripts must check PM2 environment (`process.env.pm_id`, `process.env.name`, `CAMPAIGN_WORKER_STANDALONE`) to ensure they stay continuously running and do not exit prematurely with code 0.
