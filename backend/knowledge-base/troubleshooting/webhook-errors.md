# Webhook Configuration & Troubleshooting

## Webhook Setup
- **Callback URL**: `https://whatsapp.kalaakchar.in/api/webhooks/whatsapp`
- **Verify Token**: `campaignflow_secure_webhook_token_2026`
- **Subscribed Fields**: `messages`, `message_template_status_update`.

## Troubleshooting Verification Failures
1. Verify the exact verify token matches in Meta App Dashboard ➔ WhatsApp ➔ Configuration.
2. Ensure your server firewall allows inbound traffic on port 443 (HTTPS).
3. Check Nginx reverse proxy logs (`sudo tail -f /var/log/nginx/access.log`) to verify incoming Meta GET challenge requests.
