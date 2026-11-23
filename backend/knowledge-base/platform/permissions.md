# Workspace Permissions & Security

## Access Security Standards
- All passwords are encrypted with bcrypt (salt rounds: 10).
- All API communications use JSON Web Tokens (JWT) with 1-day expiration and 7-day refresh tokens.
- Meta access tokens are encrypted at rest using AES-256-GCM.
- Role-based route guards (`requireRole`, `requireTenant`, `requireSuperAdmin`) protect every backend endpoint.
