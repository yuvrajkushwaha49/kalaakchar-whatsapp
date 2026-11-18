# Backend REST API Specification

> Compiled directly from actual Express routes, controllers, and services in `backend/src/modules/`.

Base URL: `/api`  
Standard Response Format:
- Success: `{ "success": true, "data": ... }` or `{ "success": true, ... }`
- Error: `{ "success": false, "error": { "message": "...", "code": "..." } }`

---

## 1. System & Health

| Method | Endpoint | Purpose | Auth | Controller / Service |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/health` | Service uptime, database mode check | Public | Inline in `app.js` |

---

## 2. Authentication Module (`/api/auth`)

Router: `backend/src/modules/auth/auth.routes.js`  
Controller: `backend/src/modules/auth/auth.controller.js`  
Service: `backend/src/modules/auth/auth.service.js`  
Validation: `auth.schema.js` (Zod schemas)

| Method | Endpoint | Purpose | Auth / Middleware | Request Body | Response |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Register new tenant & owner account | Public | `{ businessName, name, email, password, phone? }` | `{ success: true, user, business, tokens }` |
| `POST` | `/api/auth/login` | Authenticate user with credentials | Public | `{ email, password }` | `{ success: true, user, business, tokens }` |
| `POST` | `/api/auth/refresh` | Refresh expired access token | Public | `{ refreshToken }` | `{ success: true, accessToken, user }` |
| `POST` | `/api/auth/logout` | Invalidate current user session | Bearer JWT | `{ refreshToken? }` | `{ success: true, message }` |
| `GET` | `/api/auth/me` | Fetch authenticated user profile | Bearer JWT | None | `{ success: true, user, business }` |
| `POST` | `/api/auth/forgot-password` | Request password reset code via email | Public | `{ email }` | `{ success: true, message, devOtp? }` |
| `POST` | `/api/auth/reset-password` | Reset password using OTP code | Public | `{ email, otp, newPassword }` | `{ success: true, message }` |

---

## 3. Contacts & Audiences (`/api/contacts`)

Router: `backend/src/modules/contacts/contacts.routes.js`  
Controller: `backend/src/modules/contacts/contacts.controller.js`  
Service: `backend/src/modules/contacts/contacts.service.js`  
Middleware: `authenticate`, `requireTenant`

| Method | Endpoint | Purpose | Roles | Request Query / Body | Response |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/contacts` | Paginated list of contacts with filters | Any authenticated | Query: `page, limit, search, status, tag` | `{ success: true, contacts, pagination }` |
| `GET` | `/api/contacts/tags` | List all segment tags in tenant | Any authenticated | None | `{ success: true, data: [tags] }` |
| `POST` | `/api/contacts/resolve-by-phones` | Batch lookup contact IDs by phone numbers | Any authenticated | Body: `{ phones: ['+9198...'] }` | `{ success: true, contactIds, count }` |
| `GET` | `/api/contacts/:id` | Get contact details, history & tags | Any authenticated | Param: `id` | `{ success: true, data: contactDetails }` |
| `POST` | `/api/contacts` | Create a new contact manually | `owner`, `admin`, `marketer` | Body: `{ phone, name, email, tags, customFields }` | `{ success: true, data: newContact }` |
| `PUT` | `/api/contacts/:id` | Update contact attributes & tags | `owner`, `admin`, `marketer` | Param: `id`, Body: `{ name, email, tags, ... }` | `{ success: true, data: updatedContact }` |
| `PATCH` | `/api/contacts/:id/consent` | Update opt-in / opt-out compliance | `owner`, `admin`, `marketer` | Param: `id`, Body: `{ optedIn: boolean, reason }` | `{ success: true, data: consentStatus }` |
| `DELETE` | `/api/contacts/:id` | Delete contact record | `owner`, `admin` | Param: `id` | `{ success: true, message }` |

---

## 4. Contact Groups (`/api/contact-groups`)

Router: `backend/src/modules/contact_groups/contactGroups.routes.js`  
Controller: `backend/src/modules/contact_groups/contactGroups.controller.js`  
Service: `backend/src/modules/contact_groups/contactGroups.service.js`

| Method | Endpoint | Purpose | Roles | Request Body | Response |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/contact-groups` | List all contact groups with member counts | Any authenticated | None | `{ success: true, data: [groups] }` |
| `POST` | `/api/contact-groups` | Create new contact group | `owner`, `admin`, `marketer` | `{ name, description, color }` | `{ success: true, data: newGroup }` |
| `GET` | `/api/contact-groups/:id` | Get group details & members list | Any authenticated | None | `{ success: true, data: groupDetails }` |
| `PUT` | `/api/contact-groups/:id` | Update group name & color | `owner`, `admin`, `marketer` | `{ name, description, color }` | `{ success: true, data: updatedGroup }` |
| `DELETE` | `/api/contact-groups/:id` | Delete group | `owner`, `admin` | None | `{ success: true, message }` |
| `POST` | `/api/contact-groups/:id/members` | Add contacts to group in bulk | `owner`, `admin`, `marketer` | `{ contactIds: [1, 2, 3] }` | `{ success: true, addedCount }` |
| `DELETE` | `/api/contact-groups/:id/members` | Remove contacts from group | `owner`, `admin`, `marketer` | `{ contactIds: [1, 2, 3] }` | `{ success: true, removedCount }` |

---

## 5. Bulk File Imports (`/api/imports`)

Router: `backend/src/modules/imports/imports.routes.js`  
Controller: `backend/src/modules/imports/imports.controller.js`  
Service: `backend/src/modules/imports/imports.service.js`  
Worker: `backend/src/workers/importWorker.js` via `backend/src/queues/importQueue.js`

| Method | Endpoint | Purpose | Roles | Request / Payload | Response |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `POST` | `/api/imports/upload` | Upload `.csv` or `.xlsx` file for preview | `owner`, `admin`, `marketer` | Multipart form (`file`) | `{ success: true, fileKey, headers, previewRows, totalEstimatedRows }` |
| `POST` | `/api/imports/start` | Queue background import job | `owner`, `admin`, `marketer` | `{ fileKey, columnMapping, batchTag, groupId, ... }` | `{ success: true, message: 'Import queued', data: { jobId } }` |
| `GET` | `/api/imports/jobs` | Paginated list of import jobs & history | Any authenticated | Query: `page, limit` | `{ success: true, data: [jobs], pagination }` |
| `GET` | `/api/imports/jobs/:jobId` | Get live status & metrics of import job | Any authenticated | Param: `jobId` | `{ success: true, data: jobStatus }` |
| `POST` | `/api/imports/jobs/:jobId/cancel`| Cancel queued or in-progress import | `owner`, `admin` | Param: `jobId` | `{ success: true, message }` |
| `DELETE`| `/api/imports/jobs/:jobId`| Delete an import record & its rows | `owner`, `admin` | Param: `jobId` | `{ success: true, message }` |
| `PATCH` | `/api/imports/jobs/:jobId/tag` | Update batch tag on imported contacts | `owner`, `admin`, `marketer` | `{ batchTag: 'NewTag' }` | `{ success: true, updatedContactsCount }` |
| `POST` | `/api/imports/execute` | Backward-compatible raw CSV execution | `owner`, `admin`, `marketer` | `{ csvText, columnMapping, ... }` | `{ success: true, data: { jobId, totalRows, successful, duplicates, contactIds } }` |

---

## 6. WhatsApp Accounts & Numbers (`/api/whatsapp`)

Router: `backend/src/modules/whatsapp/whatsapp.routes.js`  
Controller: `backend/src/modules/whatsapp/whatsapp.controller.js`  
Service: `backend/src/modules/whatsapp/whatsapp.service.js`  
Client: `backend/src/modules/whatsapp/metaClient.js`

| Method | Endpoint | Purpose | Roles | Request / Payload | Response |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/whatsapp/accounts` | List connected WhatsApp numbers for tenant | Any authenticated | None | `{ success: true, data: [accounts] }` |
| `POST` | `/api/whatsapp/accounts` | Register or update WhatsApp credentials | `owner`, `admin` | `{ wabaId, phoneNumberId, phoneNumber, accessToken }` | `{ success: true, data: account }` |
| `GET` | `/api/whatsapp/accounts/:id` | Get account details & quality tier | Any authenticated | Param: `id` | `{ success: true, data: accountDetails }` |
| `POST` | `/api/whatsapp/accounts/:id/test`| Send test WhatsApp template message | `owner`, `admin` | `{ recipientPhone, templateName? }` | `{ success: true, messageId }` |
| `POST` | `/api/whatsapp/accounts/:id/primary` | Set number as default/primary | `owner`, `admin` | Param: `id` | `{ success: true, message }` |
| `DELETE`| `/api/whatsapp/accounts/:id` | Disconnect WhatsApp number | `owner`, `admin` | Param: `id` | `{ success: true, message }` |
| `GET` | `/api/whatsapp/templates` | Fetch approved templates for account | Any authenticated | Query: `accountId` | `{ success: true, data: [templates] }` |
| `POST` | `/api/whatsapp/templates/sync` | Force sync templates from Meta Graph API | `owner`, `admin`, `marketer` | `{ accountId }` | `{ success: true, syncedCount }` |
| `GET` | `/api/whatsapp/inbox/conversations` | List active two-way inbox conversations | Any authenticated | Query: `status, search, page` | `{ success: true, data: [conversations] }` |
| `GET` | `/api/whatsapp/inbox/conversations/:id/messages` | Message thread history for conversation | Any authenticated | Param: `id` | `{ success: true, data: [messages] }` |
| `POST` | `/api/whatsapp/inbox/conversations/:id/messages` | Send live two-way reply message | Any authenticated | `{ messageText }` | `{ success: true, message: outboundMsg }` |
| `PATCH`| `/api/whatsapp/inbox/conversations/:id/status` | Mark conversation resolved / open | Any authenticated | `{ status: 'closed' \| 'open' }` | `{ success: true, data }` |

---

## 7. Meta Guided Setup & OAuth (`/api/meta`)

Router: `backend/src/modules/whatsapp/metaSetup.routes.js`  
Controller: `backend/src/modules/whatsapp/metaSetup.controller.js`  
Service: `backend/src/modules/whatsapp/metaSetup.service.js`

| Method | Endpoint | Purpose | Roles |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/meta/status` | Check tenant Meta integration readiness | Any authenticated |
| `POST` | `/api/meta/embedded/session` | Initialize Meta Embedded Signup session | `owner`, `admin` |
| `POST` | `/api/meta/embedded/exchange` | Exchange OAuth code for WABA & permanent access token | `owner`, `admin` |
| `POST` | `/api/meta/register-phone` | Register phone number on Cloud API with 2FA PIN | `owner`, `admin` |
| `POST` | `/api/meta/subscribe-webhooks` | Subscribe WABA to WhatsApp webhooks | `owner`, `admin` |

---

## 8. Campaigns & Broadcasts (`/api/campaigns`)

Router: `backend/src/modules/campaigns/campaigns.routes.js`  
Controller: `backend/src/modules/campaigns/campaigns.controller.js`  
Service: `backend/src/modules/campaigns/campaigns.service.js`  
Worker: `backend/src/workers/campaignWorker.js` via `backend/src/queues/campaignQueue.js`

| Method | Endpoint | Purpose | Roles | Request Body | Response |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/campaigns` | List all campaigns with delivery metrics | Any authenticated | Query: `page, limit, status, search` | `{ success: true, data: [campaigns], pagination }` |
| `POST` | `/api/campaigns` | Create campaign with audience & schedule | `owner`, `admin`, `marketer` | `{ name, whatsappAccountId, templateId, contactIds, tagIds, groupIds, variableMappings, scheduledAt }` | `{ success: true, data: { id, name, status, totalRecipients } }` |
| `POST` | `/api/campaigns/preview` | Estimate audience recipient count | `owner`, `admin`, `marketer` | `{ tagIds, contactIds, groupIds }` | `{ success: true, data: { estimatedCount, sampleContacts } }` |
| `GET` | `/api/campaigns/:id` | Get campaign details & live counters | Any authenticated | Param: `id` | `{ success: true, data: campaign }` |
| `GET` | `/api/campaigns/:id/report` | Detailed delivery report & recipient logs | Any authenticated | Param: `id`, Query: `status, page, limit` | `{ success: true, data: { campaign, metrics, recipients } }` |
| `POST` | `/api/campaigns/:id/launch` | Enqueue campaign for background worker | `owner`, `admin`, `marketer` | Param: `id` | `{ success: true, message: 'Campaign queued for dispatch' }` |
| `POST` | `/api/campaigns/:id/pause` | Pause active campaign between batches | `owner`, `admin`, `marketer` | Param: `id` | `{ success: true, message: 'Campaign paused' }` |
| `POST` | `/api/campaigns/:id/resume`| Resume paused campaign from cursor | `owner`, `admin`, `marketer` | Param: `id` | `{ success: true, message: 'Campaign resumed' }` |
| `POST` | `/api/campaigns/:id/cancel`| Cancel queued or running campaign | `owner`, `admin` | Param: `id` | `{ success: true, message: 'Campaign cancelled' }` |
| `POST` | `/api/campaigns/:id/resend`| Resend campaign to failed or unread | `owner`, `admin`, `marketer` | `{ targetCondition: 'failed' \| 'unread' \| 'all' }` | `{ success: true, newCampaignId }` |

---

## 9. Meta Inbound Webhooks (`/api/webhooks`)

Router: `backend/src/modules/webhooks/webhooks.routes.js`  
Controller: `backend/src/modules/webhooks/webhooks.controller.js`  
Service: `backend/src/modules/webhooks/webhooks.service.js`

| Method | Endpoint | Purpose | Auth | Payload |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/webhooks` | Meta Webhook challenge verification | `hub.verify_token` | Query: `hub.mode, hub.challenge, hub.verify_token` |
| `POST` | `/api/webhooks` | Process real-time delivery receipts (`sent`, `delivered`, `read`, `failed`) and inbound customer replies | HMAC-SHA256 signature (`x-hub-signature-256`) | Meta Cloud API Webhook payload |

---

## 10. Platform Administration Suite (`/api/admin`)

Router: `backend/src/modules/admin/admin.routes.js`  
Service: `backend/src/modules/admin/admin.service.js`  
Middleware: `authenticate`, `requireSuperAdmin`

| Method | Endpoint | Purpose |
| :--- | :--- | :--- |
| `GET` | `/api/admin/overview` | Platform-wide KPIs (tenants, WABAs, total messages, revenue) |
| `GET` | `/api/admin/tenants` | List all tenant businesses with user and number counts |
| `GET` | `/api/admin/tenants/:id` | Full tenant audit details (numbers, campaigns, members) |
| `PATCH` | `/api/admin/tenants/:id/status` | Suspend or activate tenant business |
| `GET` | `/api/admin/meta-config` | View global platform Meta Developer App configuration |
| `POST` | `/api/admin/meta-config` | Update global platform Meta App ID & App Secret |
| `POST` | `/api/admin/meta-config/test` | Test platform Meta App credentials against Graph API |
| `GET` | `/api/admin/numbers` | List all connected WhatsApp numbers across all tenants |
| `GET` | `/api/admin/logs` | Query global security and audit logs across all tenants |

---

## 11. Additional Modules

- **AI Copy Generator (`/api/ai/copy`)**: `POST /api/ai/copy` (`businessDescription, productOrService, offerDetails, language, tone`) -> Multilingual WhatsApp marketing copy suggestions.
- **Billing & Subscriptions (`/api/billing`)**: `GET /api/billing/plans`, `GET /api/billing/subscription`, `GET /api/billing/usage`.
- **Analytics (`/api/analytics`)**: `GET /api/analytics/dashboard` -> Aggregate broadcast stats, delivery rates, read rates.
- **Team Management (`/api/users`)**: `GET /api/users`, `POST /api/users` (invite member), `PATCH /api/users/:id/role`, `DELETE /api/users/:id`.
- **Activity Logs (`/api/activity-logs`)**: `GET /api/activity-logs` -> Tenant-scoped audit logs with pagination and search.
- **Notifications (`/api/notifications`)**: `GET /api/notifications`, `PATCH /api/notifications/:id/read`, `PATCH /api/notifications/read-all`.

