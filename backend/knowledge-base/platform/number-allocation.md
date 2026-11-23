# Number Allocation & Multi-Tenant Isolation

## Strict Tenant Isolation
- Every WhatsApp account, contact list, template, campaign, and conversation is strictly isolated by `business_id` (tenant ID).
- No tenant can view, access, or send broadcasts through another tenant's connected WhatsApp number.
- Super Administrators can allocate or monitor connected numbers across tenants without ever exposing private customer contact data.
