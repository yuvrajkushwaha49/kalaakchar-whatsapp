# AI Assistant Entry Point — CampaignFlow

Welcome to the **CampaignFlow** codebase.

This project is a multi-tenant WhatsApp Marketing Automation & Cloud API SaaS platform.
Before performing any action, code modification, debugging, or feature addition, **you MUST follow the directives below.**

---

## ⚠️ Core Directives for AI Assistants

1. **Read `AI.md` First**: Always start here to orient yourself on conventions, rules, and system layout.
2. **Read Only Relevant `.ai/` Documentation**: Consult targeted documentation files within the `.ai/` directory based on the specific subsystem you are touching.
3. **Inspect Actual Source Code Before Making Changes**: Never assume functions, variables, database columns, or endpoints exist. Verify them in the actual implementation files.
4. **Never Assume Technologies or Architecture**: Rely strictly on detected technologies and patterns. If something is missing or not detected, treat it as "Not detected."
5. **Reuse Existing Code Whenever Possible**: Do not reinvent existing utilities (e.g. `normalizePhoneNumber`, `executeQuery`, `verifyAccessToken`, `api.js`, `socket.js`). Check existing services, helpers, and components before writing new logic.
6. **Make Minimal, Safe Changes**: Keep modifications focused, minimal, and surgical. Do not touch unrelated code.
7. **Avoid Unnecessary Dependencies & Refactoring**: Do not install new npm packages unless explicitly required and approved. Do not perform gratuitous style or architectural refactors.
8. **Do Not Break Existing Functionality**: Maintain backward compatibility, test suites, and existing contracts.
9. **Never Expose Secrets**: Never commit, output, or copy credentials from `.env`, private keys, Meta app secrets, tokens, or hashes.
10. **Keep Documentation Synchronized**: When adding new routes, database columns, or architectural components, update the corresponding `.ai/` documentation and run `npm run ai:context`.

---

## 📚 Guide to `.ai/` Documentation

Use this index to quickly locate relevant knowledge:

| File | Purpose | When to Consult |
| :--- | :--- | :--- |
| **[.ai/PROJECT.md](file:///d:/Yuvi/React_App/Deleted/aisency/.ai/PROJECT.md)** | Project identity, purpose, technology stack, features, user roles, external services, deployment. | When needing a high-level system overview, onboarding, or understanding business domain. |
| **[.ai/ARCHITECTURE.md](file:///d:/Yuvi/React_App/Deleted/aisency/.ai/ARCHITECTURE.md)** | End-to-end architectural layers, data flow, queue mechanisms, multi-tenancy, and ASCII diagrams. | When designing new features, modifying background workers, or understanding request lifecycles. |
| **[.ai/FILE_STRUCTURE.md](file:///d:/Yuvi/React_App/Deleted/aisency/.ai/FILE_STRUCTURE.md)** | Complete file and folder tree generated automatically by `scripts/generate-ai-context.cjs`. | When locating source files, components, migrations, or scripts across backend and frontend. |
| **[.ai/API.md](file:///d:/Yuvi/React_App/Deleted/aisency/.ai/API.md)** | Comprehensive catalog of backend REST API routes, controllers, middleware, methods, and payloads. | When consuming, modifying, or creating API endpoints or verifying request/response contracts. |
| **[.ai/DATABASE.md](file:///d:/Yuvi/React_App/Deleted/aisency/.ai/DATABASE.md)** | Database engine, schema tables, columns, indexes, foreign keys, and in-memory fallback store details. | When writing database queries, creating migrations, modifying models, or debugging data persistence. |
| **[.ai/RULES.md](file:///d:/Yuvi/React_App/Deleted/aisency/.ai/RULES.md)** | Concrete coding guidelines, security constraints, multi-tenant rules, rate limits, and patterns. | Before writing, editing, or testing any code in the frontend, backend, or database. |
| **[.ai/CHANGELOG.md](file:///d:/Yuvi/React_App/Deleted/aisency/.ai/CHANGELOG.md)** | Chronological log of major architectural, database, and structural changes. | When tracking project evolution or documenting significant structural changes. |

---

## 🛠️ File Structure Regeneration

To refresh the project file tree after adding or removing files:
```bash
npm run ai:context
```
This runs `node scripts/generate-ai-context.cjs` which safely updates `.ai/FILE_STRUCTURE.md` using only Node.js built-in modules.

