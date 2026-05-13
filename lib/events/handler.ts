/**
 * Domain Event Handler
 *
 * handleDomainEvent() is the single entry point for all domain events.
 * It:
 *   1. Persists the event to audit_events (best-effort, never throws)
 *   2. Derives the invalidation targets from the invalidation map
 *   3. Calls revalidatePath for each target (server-side only)
 *
 * Usage (in a Server Action or Route Handler):
 *
 *   await handleDomainEvent(supabase, {
 *     type: "job.analyzed",
 *     jobId,
 *     userId,
 *     payload: { analysisId, score, fit, qualificationsCount, responsibilitiesCount },
 *   })
 *
 * Rules:
 *   - Never call handleDomainEvent from client components.
 *   - Never await the result in a hot path — it is best-effort.
 *   - Always pass the authenticated supabase server client.
 */

import { revalidatePath } from "next/cache"
import type { SupabaseClient } from "@supabase/supabase-js"
import type { DomainEvent } from "./types"
import { getInvalidationTargets } from "./invalidation-map"

export async function handleDomainEvent(
  supabase: SupabaseClient,
  event: DomainEvent
): Promise<void> {
  const occurredAt = event.occurredAt ?? new Date().toISOString()

  // 1. Persist to audit_events — best effort, never block the caller
  try {
    await supabase.from("audit_events").insert({
      user_id: event.userId,
      job_id: event.jobId,
      event_type: event.type,
      outcome: "success",
      reason: event.type,
      metadata: {
        ...event.payload,
        occurred_at: occurredAt,
      },
      correlation_id: event.correlationId ?? null,
      created_at: occurredAt,
    })
  } catch {
    // Audit persistence failure must never break the caller's flow.
    // Errors are silently swallowed here — the event handler is not a gate.
  }

  // 2. Derive and apply cache invalidation targets
  const targets = getInvalidationTargets(event.type, event.jobId, event.userId)

  for (const target of targets) {
    try {
      if (target.kind === "path") {
        revalidatePath(target.path)
      }
      // tag-based revalidation would use revalidateTag(target.tag) here
    } catch {
      // revalidatePath throws if called outside a server context — swallow.
    }
  }
}
