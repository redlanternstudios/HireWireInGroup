# HireWire Automation Status

_Last updated: 2026-05-15_

## Outgoing Automation
- **Zapier Outgoing Webhook:**
  - **Status:** Live
  - **Config:** Requires `ZAPIER_WEBHOOK_URL` to be set
  - **Events:** Fires on `job_created`, `documents_generated`, `application_submitted`, `package_reviewed`, and all resume export events
  - **Observability:** All events land in `domain_events` and are visible in the Coach activity feed

## Incoming Automation
- **Zapier Incoming Webhook (`/api/zapier/incoming`):**
  - **Status:** Scaffolded only
  - **Behavior:** Receives payload, echoes it, does nothing with it
  - **Not live** — will be wired when a real automation is needed

## MCP Integration
- **MCP Agent (`integrations/mcp/agent.ts`):**
  - **Status:** Scaffolded only
  - **Behavior:** Console logs only, does not relay anywhere
  - **Not live** — will be implemented when downstream relay is needed

## Integration Helpers
- **Dead Code:**
  - `integrations/zapier/incoming-webhook.ts` and `outgoing-webhook.ts` are legacy (Pages Router era), never called, safe to remove or archive

---

**Summary:**
- Outgoing automation is real and config-gated
- Incoming/MCP are honest stubs, not bugs
- Dead helpers are non-blocking cleanup debt
