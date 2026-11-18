# Project Overview: CampaignFlow

> Discovered and compiled from actual project configuration, source files, and dependencies.

---

## 1. Project Identity

- **Project Name**: CampaignFlow (root package: `campaignflow-root`, backend: `campaignflow-backend`, frontend: `campaignflow-frontend`)
- **Project Purpose**: Multi-tenant WhatsApp Marketing Automation SaaS platform (similar to AiSensy / Wati). Enables businesses to connect official Meta WhatsApp Business Accounts (WABAs), manage contact audiences & groups, import bulk contacts via CSV/Excel, build and launch approved template broadcast campaigns, handle two-way live customer chat in a unified inbox, assign team members, and monitor compliance and message metrics.
- **Project Type**: Full-Stack Monorepo Application (React SPA frontend + Node.js/Express REST API backend + asynchronous background queue workers).

---

## 2. Technology Stack & Runtimes

- **Languages**:
  - JavaScript (Node.js ES Modules on backend; React JSX on frontend)
  - SQL (MySQL 8 DDL & DML migrations)
  - HTML5 & CSS3
- **Runtimes & Engines**:
  - Backend Runtime: Node.js (ES Module format `"type": "module"`)
  - Frontend Runtime: Modern Evergreen Browsers (Vite bundle output)
  - Database: MySQL 8.0+ (`utf8mb4` charset)
  - In-Memory Fallback: `.dev_store.json` local file-backed adapter for development when MySQL is offline
  - Message Queue Engine: Database-backed atomic lock queues with heartbeat recovery (`campaignQueue.js`, `importQueue.js`) + optional Redis/BullMQ dependencies (`ioredis`, `bullmq`)
- **Frameworks & Libraries**:
  - Frontend Framework: React 18.3 (`react`, `react-dom`)
  - Frontend Router: React Router DOM v6 (`react-router-dom`)
  - Frontend UI Toolkit: Bootstrap 5.3 (`bootstrap`) + Bootstrap Icons (`bootstrap-icons`)
  - Frontend Charts: Recharts 2.15 (`recharts`)
  - Frontend Forms: React Hook Form 7.54 (`react-hook-form`)
  - Backend Framework: Express 4.21 (`express`)
  - Backend Security: Helmet (`helmet`), CORS (`cors`)
  - Backend Validation: Zod (`zod`)
  - Real-Time Communication: Socket.IO Server 4.8 (`socket.io`) & Client (`socket.io-client`)
  - Cryptography: Native Node.js `crypto` (AES-256-CBC token encryption) + Bcrypt (`bcryptjs`)
  - Token Management: JSON Web Tokens (`jsonwebtoken`)
  - File Parsing: Multer (`multer`), ExcelJS (`exceljs`), CSV-Parser (`csv-parser`), custom streaming reader
  - Testing: Node.js Native Test Runner (`node:test`, `node:assert/strict`)
- **Build Tools**:
  - Frontend Bundler: Vite 6 (`vite`, `@vitejs/plugin-react`)
  - Backend Bundler: None (direct Node.js ES Modules execution)

---

## 3. Main Features & Capabilities

1. **Multi-Tenant SaaS Architecture**: Complete tenant isolation by `business_id` across contacts, tags, groups, templates, campaigns, messages, and analytics.
2. **Meta WhatsApp Cloud API Integration**:
   - Official WABA onboarding via Meta Embedded Signup (AiSensy-style platform-managed app model or custom client app).
   - Phone number registration, 2FA PIN verification, and automated webhook subscriptions.
   - Encrypted token storage (`AES-256-CBC`) with automated health checks.
3. **Audience & Contact Management**:
   - Direct manual contact creation and editing with opt-in status.
   - Dynamic Segment Tags with contact association.
   - Contact Groups with member management and deduplication.
   - Large-scale streaming CSV and Excel (`.xlsx`, `.xls`) import with phone number E.164 normalization, consent tracking, duplicate detection, and ghost row suppression.
4. **Campaign Broadcast Engine**:
   - 5-step visual Campaign Builder wizard (Campaign details -> Audience filtering -> Approved Template & Variable mapping -> Compliance preflight -> Scheduling & Launch).
   - Asynchronous queueing with worker claiming via database atomic locks (`FOR UPDATE SKIP LOCKED`).
   - Rate-paced streaming dispatch (configurable ~25-40 messages/second per worker) to prevent Meta Cloud API rate limits.
   - Floating real-time progress monitor widget with WebSocket progress streaming.
   - Opt-out suppression (unsubscribed/inactive contacts are safely skipped).
5. **WhatsApp Template Management**:
   - Synchronizes approved templates directly from Meta Graph API.
   - Supports Marketing, Utility, and Authentication templates with header, body, footer, and quick reply/URL buttons.
   - Parameter mapping (`NAMED` or `POSITIONAL`).
6. **Two-Way Live WhatsApp Inbox**:
   - Real-time two-way customer messaging via Socket.IO.
   - 24-hour customer service window countdown tracking.
   - Conversation assignment to agents and resolution state management.
7. **Team & Role-Based Access Control (RBAC)**:
   - User roles: `superadmin`, `owner`, `admin`, `marketer`, `agent`.
   - SuperAdmin platform suite for managing cross-tenant businesses, global Meta configuration, system numbers, and audit logs.
8. **AI Promotional Copy Generator**:
   - Generates multilingual marketing copy (Hindi, Hinglish, English) with compliance notes and variable placeholders (supports OpenAI API or resilient mock generator).

---

## 4. User Roles & Permissions

- `superadmin`: Full platform access across all tenants; configures platform Meta App, inspects all businesses, numbers, billing plans, and server logs.
- `owner`: Business tenant creator with full control over business settings, team members, WABAs, billing, campaigns, and contacts.
- `admin`: Business administrator; manages campaigns, templates, contacts, groups, and team members.
- `marketer`: Creates and launches campaigns, imports contacts, manages tags, and configures templates.
- `agent`: Reads contacts, views templates, and handles customer conversations in the two-way live Inbox.

---

## 5. External Services & Integrations

- **Meta WhatsApp Cloud API**:
  - Graph API version: `v21.0`
  - Endpoints: Embedded Signup OAuth exchange, WABA registration, template sync, template message dispatch, media upload, webhooks.
- **OpenAI / Gemini API**:
  - Configurable via `AI_PROVIDER` and `OPENAI_API_KEY` / `GEMINI_API_KEY` in `backend/src/modules/ai/ai.service.js` for promotional copy generation. Defaults to built-in mock generator when keys are absent.
- **SMTP Server**:
  - Configurable via `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` in `backend/src/services/emailService.js` for password reset OTP emails. Uses mock fallback when unconfigured.
- **Payment Gateway**:
  - Not detected. (Internal subscription tiers and usage tracking exist in `billing.service.js`, but no external payment processor like Stripe or Razorpay is integrated).
- **Cloud Object Storage (e.g. AWS S3)**:
  - Not detected in active code. (Environment variables exist in `.env.example`, but uploads are stored on local disk via `multer.diskStorage`).

---

## 6. Storage Implementation

- **Database Storage**: MySQL 8 database storing all structured operational data.
- **File Upload Storage**: Local filesystem directory at `backend/uploads/imports/` managed by Multer for temporary CSV and Excel batch files.

---

## 7. Deployment Configuration

- **Process Manager**: PM2 (`ecosystem.config.cjs`):
  - `campaignflow-api`: Cluster mode for API server (`src/server.js`) on port 5000.
  - `campaignflow-worker`: Fork mode for campaign dispatch queue worker (`src/workers/campaignWorker.js`).
  - `campaignflow-import-worker`: Fork mode for contact import queue worker (`src/workers/index.js`).
- **Web Server / Reverse Proxy**: Nginx (`nginx-campaignflow.conf`):
  - Serves compiled frontend static files from `/var/www/campaignflow/frontend/dist`.
  - Proxies `/api/` to backend at `http://127.0.0.1:5000`.
  - Upgrades WebSocket connections for `/socket.io/` to backend.
- **Containerization**: Docker Compose (`docker-compose.yml`) for local/staging MySQL 8.0 and Redis 7.
- **Cloud Infrastructure**: Ubuntu 22.04+ EC2 deployment script (`deploy-ubuntu-ec2.sh`).

