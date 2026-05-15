# Zapier Integration Guide

This folder contains example integration points for wiring your Next.js/Supabase stack to Zapier.

## Outgoing Webhook
- integrations/zapier/outgoing-webhook.ts
- Sends events from your app to a Zapier webhook URL (set `ZAPIER_WEBHOOK_URL` in your environment).
- Usage: Import and call from your API routes or server actions when you want to notify Zapier of an event.

## Incoming Webhook
- integrations/zapier/incoming-webhook.ts
- Example endpoint for Zapier to call into your app.
- Usage: Expose this as an API route (e.g., `/api/zapier/incoming`) and route incoming events to your app logic.

## Setup Steps
1. Add your Zapier webhook URL to your `.env` file:
   ```env
   ZAPIER_WEBHOOK_URL=https://hooks.zapier.com/hooks/catch/your-hook-id/
   ```
2. Wire outgoing events by calling the outgoing webhook handler.
3. Expose the incoming handler as an API route for Zapier to call.
4. (Optional) Add Supabase triggers to call outgoing webhook for DB events.

## Security
- Always validate incoming requests from Zapier (e.g., with a secret or signature).
- Do not expose sensitive data in webhooks.

---

For advanced automation, see Zapier Platform CLI and SDK docs.
