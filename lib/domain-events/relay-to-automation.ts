// --- ZAPIER & MCP INTEGRATION HOOK ---
// This file wires domain events to Zapier and MCP endpoints for automation.

import { emitZapierEvent } from "@/integrations/zapier/emit-zapier-event"
import { sendMcpEvent } from "@/integrations/mcp/agent"
import type { DomainEvent } from "./event-types"

/**
 * Call this from emit-event.ts after writing to persistence.
 * Non-blocking: errors are swallowed.
 */
export async function relayToAutomation(event: DomainEvent) {
  try {
    // Example: Only relay certain event types
    if (["job_created", "documents_generated", "application_submitted", "package_reviewed"].includes(event.event_type)) {
      await emitZapierEvent(event)
      await sendMcpEvent(event.event_type, event)
    }
  } catch {
    // Never throw
  }
}
