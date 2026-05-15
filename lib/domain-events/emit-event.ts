/**
 * lib/domain-events/emit-event.ts
 *
 * Central domain event emitter.
 *
 * All mutations should call emitDomainEvent() after persisting their change.
 * This is fire-and-forget — events must never block the mutation path.
 *
 * Storage strategy:
 *   Primary: domain_events table (rich schema, queryable)
 *   Fallback: audit_events table (always exists)
 *
 * The emitter also triggers route revalidation via the invalidation map.
 */

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import type { DomainEventInput, DomainEvent } from "./event-types"
import { relayToAutomation } from "./relay-to-automation"

type ServerSupabase = Awaited<ReturnType<typeof createClient>>

let _idCounter = 0
function generateEventId(): string {
  _idCounter = (_idCounter + 1) % 1_000_000
  return `evt_${Date.now()}_${_idCounter.toString().padStart(6, "0")}`
}

export async function emitDomainEvent(input: DomainEventInput): Promise<void> {
  const event: DomainEvent = {
    ...input,
    event_id: generateEventId(),
    timestamp: new Date().toISOString(),
  }

  // Revalidate affected routes synchronously — these are cheap Next.js cache tags
  for (const route of event.affected_routes) {
    try {
      revalidatePath(route)
    } catch {
      // revalidatePath is a no-op outside request context — safe to ignore
    }
  }

  // Write to domain_events (primary) or audit_events (fallback) — non-blocking
  void writeToPersistence(event)
}

async function writeToPersistence(event: DomainEvent): Promise<void> {
  try {
    const supabase = await createClient()
    void writeEvent(supabase, event)
  } catch {
    // Never throw — audit logging is non-blocking
  }
}

/**
 * Convenience: emit an event using a pre-built supabase client.
 * Used in server actions that already hold a client, avoiding an extra
 * cookie-jar round-trip.
 */
export async function emitDomainEventWithClient(
  supabase: ServerSupabase,
  input: DomainEventInput
): Promise<void> {
  const event: DomainEvent = {
    ...input,
    event_id: generateEventId(),
    timestamp: new Date().toISOString(),
  }

  for (const route of event.affected_routes) {
    try {
      revalidatePath(route)
    } catch {
      // safe
    }
  }

  void writeEvent(supabase, event)
}

async function writeEvent(supabase: ServerSupabase, event: DomainEvent): Promise<void> {
  try {
    const { error: domainError } = await supabase.from("domain_events").insert({
      event_id: event.event_id,
      event_type: event.event_type,
      job_id: event.job_id,
      user_id: event.user_id,
      source: event.source,
      payload: event.payload,
      invalidates: event.invalidates,
      recomputes: event.recomputes,
      affected_routes: event.affected_routes,
      severity: event.severity,
      metadata: event.metadata,
      created_at: event.timestamp,
    })

    if (!domainError) {
      void relayToAutomation(event)
      return
    }

    // Fallback: audit_events (always exists)
    await supabase.from("audit_events").insert({
      user_id: event.user_id,
      job_id: event.job_id,
      event_type: event.event_type,
      outcome: event.severity === "error" ? "error" : "success",
      reason: JSON.stringify({ invalidates: event.invalidates, source: event.source }),
      metadata: {
        event_id: event.event_id,
        payload: event.payload,
        invalidates: event.invalidates,
        recomputes: event.recomputes,
        severity: event.severity,
        ...event.metadata,
      },
      created_at: event.timestamp,
    })

    // Relay to Zapier/MCP automation after fallback persistence too (non-blocking)
    void relayToAutomation(event)
  } catch {
    // Audit logging must never throw into the mutation path
  }
}
