# Meta Graph API Error Codes Reference

## Frequently Encountered Meta Error Codes
- **Error 131047 (Re-engagement Message)**: More than 24 hours have passed since the customer last replied. You must use a pre-approved Message Template.
- **Error 131026 (Message Undeliverable)**: The destination phone number is not registered on WhatsApp or has blocked the sender.
- **Error 130429 (Rate Limit Hit)**: Too many messages sent in a short window. Our job queue automatically throttles and retries with backoff.
- **Error 131051 (Unsupported Message Type)**: Template format mismatch or invalid media header format.
- **Error 132000 (Template Param Count Mismatch)**: Number of variable mappings (`{{1}}`, `{{2}}`) does not match the approved template definition.
- **Error 190 (Invalid Access Token)**: Meta System User token has expired or permissions were modified. Reconnect your account in WhatsApp Accounts.
