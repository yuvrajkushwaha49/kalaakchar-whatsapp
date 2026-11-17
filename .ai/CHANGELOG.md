# Project Changelog: CampaignFlow

All notable architectural, system-level, and operational changes to the CampaignFlow codebase are documented here.

Format:
### YYYY-MM-DD
- **Change**: Description of what was changed
- **Reason**: The problem or requirement driving the change
- **Affected areas**: Modules, directories, or services impacted
- **Migration/API impact**: Database migration, schema update, or API contract change

---

### 2026-11-17
- **Change**: Initialized the AI Context & Architecture System (`AI.md`, `.ai/`, and `scripts/generate-ai-context.cjs`).
- **Reason**: Standardize codebase discovery, prevent AI hallucination, enforce strict multi-tenant and Meta compliance rules, and provide a single source of truth for future AI coding assistants.
- **Affected areas**:
  - Root directory (`AI.md`, `package.json`)
  - Documentation directory (`.ai/*`)
  - Tooling scripts (`scripts/generate-ai-context.cjs`)
- **Migration/API impact**: None. Added `"ai:context"` npm script to root `package.json`.

---

### 2026-11-17
- **Change**: Fixed PM2 fork worker auto-start lifecycle and verified 300 leads scale test suite.
- **Reason**: When running under PM2 fork mode, `campaignflow-worker` was exiting with code 0 due to PM2 wrapper container script paths bypassing CLI argv checks.
- **Affected areas**:
  - `backend/src/workers/campaignWorker.js`
  - `backend/src/workers/campaignWorkerRunner.js`
  - `ecosystem.config.cjs`
  - `backend/tests/test_campaign_300_leads.js`
- **Migration/API impact**: Added `CAMPAIGN_WORKER_STANDALONE` environment flag to ecosystem config.

---

### 2026-11-17
- **Change**: Enhanced CampaignBuilder Step 2 Audience Selection UI & CSV Audience Resolution.
- **Reason**: Replaced legacy card layout with clean modern layout matching user specifications, and resolved `selectedContactIds` binding bug when uploading CSV audiences.
- **Affected areas**:
  - `frontend/src/pages/CampaignBuilder.jsx`
  - `backend/src/modules/contacts/contacts.routes.js`
  - `backend/src/modules/contacts/contacts.controller.js`
  - `backend/src/modules/contacts/contacts.service.js`
  - `backend/src/modules/imports/imports.service.js`
- **Migration/API impact**: Added `POST /api/contacts/resolve-by-phones` endpoint; updated `/api/imports/execute` response to include `contactIds`.

---

### 2026-11-16
- **Change**: Implemented Asynchronous Queueing for Bulk Imports and Campaign Dispatches (Migrations 010 & 011).
- **Reason**: Direct synchronous processing of large contact files (up to 10,000+ rows) and high-volume broadcasts was causing HTTP request timeouts and CPU spikes.
- **Affected areas**:
  - `backend/src/queues/importQueue.js` & `backend/src/queues/campaignQueue.js`
  - `backend/src/services/importBatchProcessor.js` & `backend/src/services/campaignBatchDispatcher.js`
  - `backend/src/workers/importWorker.js` & `backend/src/workers/campaignWorker.js`
  - Frontend floating live progress widget (`FloatingLiveProgress.jsx`)
- **Migration/API impact**: Executed migrations `010_optimized_import_queue.sql` and `011_optimized_campaign_queue.sql`. Added status `queued` to campaigns and import jobs.
