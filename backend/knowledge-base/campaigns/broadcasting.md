# Broadcasting & High-Throughput Delivery

## How Broadcasting Works
- Campaigns are streamed through our asynchronous job queue (concurrency throttled at up to 20 messages per second per phone number) to ensure 100% adherence to Meta rate limits.
- Each recipient message is uniquely personalized with custom parameters.
- Contacts who have opted out via the `STOP` keyword are automatically skipped by the dispatcher to protect your sender phone quality rating.

## Throttling and Batching
- Outbound messages are dispatched in batches of 50 recipients.
- If Meta returns a temporary rate-limiting error code (`130429`), the queue automatically backs off with exponential jitter before retrying.
