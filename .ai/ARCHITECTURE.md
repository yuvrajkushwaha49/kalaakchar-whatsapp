# Architecture Overview: CampaignFlow

> Discovered and documented from the actual codebase implementation.

---

## 1. System Architecture Diagram

```text
                               +----------------------------------------+
                               |     Client Browser (React 18 SPA)      |
                               |  - React Router DOM v6                 |
                               |  - Axios API Client (/api/*)           |
                               |  - Socket.io Client (/socket.io/*)     |
                               +-------------------+--------------------+
                                                   |
                                                   | HTTP / HTTPS & WSS
                                                   v
                               +----------------------------------------+
                               |            Nginx Reverse Proxy         |
                               |  - Static files -> frontend/dist       |
                               |  - /api/*        -> Proxy :5000        |
                               |  - /socket.io/*  -> WSS Proxy :5000    |
                               +-------------------+--------------------+
                                                   |
                                                   | Local TCP
                                                   v
              +------------------------------------+------------------------------------+
              |                                                                        |
              v                                                                        v
+-----------------------------+                                          +-----------------------------+
|    PM2 Process: API Cluster |                                          |  PM2 Process: Fork Workers  |
|  name: campaignflow-api     |                                          |                             |
|  - Express 4 HTTP App       |                                          |  1. campaignflow-worker     |
|  - JWT & RBAC Middleware    |                                          |     (Campaign Dispatcher)   |
|  - REST API Routers         |                                          |                             |
|  - Socket.IO Server Engine  |                                          |  2. campaignflow-import-    |
|  - Campaign Scheduler (15s) |                                          |     worker (Import Queue)   |
+--------------+--------------+                                          +--------------+--------------+
               |                                                                        |
               |                                                                        |
               +-----------------------------------+------------------------------------+
                                                   |
                                                   | Parameterized SQL / Memory Store
                                                   v
                        +-------------------------------------------------------+
                        |                 Persistence Layer                     |
                        |  1. Primary: MySQL 8.0+ Connection Pool (mysql2)      |
                        |     - utf8mb4 encoding, strict foreign keys, indexes  |
                        |  2. Fallback: In-Memory Adapter (.dev_store.json)      |
                        |     - Automatically engaged if MySQL ECONNREFUSED     |
                        |  3. Local Disk: backend/uploads/imports/ (Multer)     |
                        +---------------------------+---------------------------+
                                                    |
                                                    | External Outbound HTTPS
                                                    v
                        +-------------------------------------------------------+
                        |             External Cloud Integrations               |
                        |  - Meta WhatsApp Business Cloud API (Graph v21.0)     |
                        |  - OpenAI / Gemini API (Copy generation - optional)   |
                        |  - SMTP Server (Nodemailer - password resets)         |
                        +-------------------------------------------------------+
```

---

## 2. Application Layers

### 2.1. Frontend Layer (`frontend/`)
- **Single Page Application (SPA)**: Built using React 18, bundled with Vite 6.
- **Routing**: `frontend/src/App.jsx` using `react-router-dom` v6 with layout nesting:
  - `AuthLayout`: Login, Register, Forgot Password.
  - `AppLayout`: Standard SaaS tenant layout with left navigation sidebar, top header, floating real-time progress monitor widget, and workspace switcher.
  - `AdminLayout`: Dedicated Super Admin platform management suite for cross-tenant oversight.
- **State Management**:
  - Global Authentication: React Context (`useAuth.jsx`) managing authenticated user profile, tenant ID (`x-tenant-id`), JWT access token, and login/logout state.
  - Real-Time Events: Singleton Socket.io connection (`frontend/src/services/socket.js`) dispatching WebSocket events (`campaign_progress`, `import_progress`, `inbox_message`).
  - Local Component State: React standard hooks (`useState`, `useEffect`, `useMemo`, `useCallback`).
- **HTTP Communication**: Centralized Axios instance (`frontend/src/services/api.js`) configured with:
  - Base URL: `VITE_API_URL` (defaults to `/api` or `http://localhost:5000/api`).
  - Request Interceptors: Automatically injects `Authorization: Bearer <token>` and `x-tenant-id: <businessId>`.
  - Response Interceptors: Gracefully handles 401 token expiration and error formatting.

### 2.2. Backend API Layer (`backend/src/`)
- **Web Server**: Express 4 running on Node.js 20+ ES Modules.
- **Middleware Pipeline**:
  1. `helmet()`: HTTP security headers.
  2. `cors()`: Cross-Origin Resource Sharing with origin verification helper.
  3. `morgan('dev')`: HTTP request logging (disabled in `test` environment).
  4. `express.json({ limit: '50mb' })`: Body parsing with raw buffer capture for Meta webhook HMAC-SHA256 signature verification.
  5. `authenticate`: Verifies JWT Bearer token, decodes user ID, validates active database status, and binds `req.user` and `req.businessId`.
  6. `requireTenant`: Enforces tenant boundary, binds `x-tenant-id` header override for superadmins, and prevents cross-tenant access.
  7. `requireRole`: Role-Based Access Control (`superadmin`, `owner`, `admin`, `marketer`, `agent`).
  8. `validate`: Zod request body/query schema validation.
  9. Centralized Error Handlers: `notFoundHandler` (404) and `errorHandler` (formatting operational errors into consistent JSON `{ success: false, error: { message, code } }`).

### 2.3. Asynchronous Workers & Queues
To eliminate server hangs during high-volume operations, two background workers run alongside the API:

```text
[HTTP POST /campaigns/:id/launch] ──> [Atomic Enqueue] (status='queued')
                                             │
                                             v
                           [Campaign Worker Loop (every 1.5s)]
                                             │
                    Claims next campaign via FOR UPDATE SKIP LOCKED
                                             │
                                             v
                         [processCampaignBatch(campaign)]
                   Streamed chunk slices (50 recipients per chunk)
                             Rate Pacing: 25ms (~40 msg/sec)
                                             │
                   ┌─────────────────────────┴─────────────────────────┐
                   │                                                   │
                   v                                                   v
         [Eligible Recipient]                                [Opted-Out Recipient]
                   │                                                   │
        Meta Cloud API Dispatch                                  Status: 'skipped'
                   │                                                   │
     Update: status='sent', wamid...                                   │
                   │                                                   │
                   └─────────────────────────┬─────────────────────────┘
                                             │
                                             v
                              Socket.IO emitToTenant(progress)
                                             │
                                             v
                        All chunks done -> status='completed'
```

1. **Campaign Dispatch Queue Worker (`campaignWorker.js`)**:
   - Polls `campaignQueue.claimNextCampaign` every 1500ms.
   - Claims pending campaigns atomically, updates heartbeat every 30s, and processes recipients in chunked batches (default 50 recipients).
   - Rate paces message delivery (default 25ms between messages = ~40 messages/second) to stay within Meta rate limits without CPU spikes.
   - Suppresses opted-out/unsubscribed contacts (`status: 'skipped'`).
   - Automatically recovers crashed/abandoned campaigns after 5 minutes of worker silence.
2. **Contact Import Queue Worker (`importWorker.js`)**:
   - Polls `importQueue.claimNextJob` every 1500ms.
   - Streams CSV/Excel files using low-memory chunked line parsing.
   - Cleans and formats phone numbers to E.164 (`+91...`).
   - Filters whitespace ghost rows, flags duplicates, records audit consents, and links contacts to tags and groups.
   - Emits real-time progress percentages over Socket.IO.

---

## 3. Data Persistence & Multi-Tenancy

- **Database Engine**: MySQL 8.0+ with `utf8mb4` character set.
- **Tenant Isolation**: Every tenant entity table (`contacts`, `contact_groups`, `tags`, `templates`, `campaigns`, `campaign_recipients`, `messages`, `whatsapp_accounts`, `subscriptions`) enforces `business_id BIGINT UNSIGNED NOT NULL` with foreign key cascade deletion to `businesses(id)`.
- **Hybrid Resilience Pattern**:
  - In production and local development with MySQL active: Uses `mysql2/promise` connection pool.
  - In development/testing when MySQL server is unreachable (`ECONNREFUSED`): Automatically activates an in-memory mock store backed by `backend/.dev_store.json`, allowing the entire API and automated test suite to run without database dependencies.

---

## 4. Real-Time Communication Layer (`socket.js`)

- Built on top of Express HTTP server via `socket.io`.
- Implements authenticated tenant room partitioning:
  - When a frontend client connects, it provides JWT authentication.
  - The socket joins room `tenant_<businessId>`.
  - Backend background workers emit real-time events (`campaign_progress`, `import_progress`, `inbox_message`) directly to `tenant_<businessId>`, ensuring zero cross-tenant event leakage.
