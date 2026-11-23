# WhatsApp Number Connection & Management

## Managing Connected Numbers
- Customers on the **Starter Growth** plan can connect 1 active WhatsApp sender number.
- Customers on the **Pro Automation** plan can connect up to 3 numbers.
- Customers on the **Enterprise Scale** plan can connect up to 10 numbers.

## Primary Number Routing
When multiple numbers are connected within a tenant workspace:
- One number is designated as the **Primary Sender** (`is_primary: 1`).
- Broadcast campaigns default to the primary sender number unless an alternate connected number is explicitly selected in Campaign Builder.
- Customers can switch their primary number anytime from the **WhatsApp Accounts** page by clicking **Set Primary**.

## Number Disconnection
- To disconnect a number, go to **WhatsApp Accounts**, select the number card, and click **Disconnect**.
- Disconnecting revokes local tokens and unsubscribes webhooks while leaving Meta WABA assets safely preserved in your Meta Business Suite.
