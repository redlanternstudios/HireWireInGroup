/**
 * lib/domain-events/handle-event.ts
 *
 * Orchestrates the downstream effects of a domain event:
 *   1. Resolves propagation rules from the invalidation map
 *   2. Emits the event (persists + revalidates routes)
 *   3. Triggers recomputation (readiness) if required
 *
 * This is the single call site for "something mutated — propagate it."
 * Server actions should call handleDomainEvent() rather than calling
 * emitDomainEvent() and recompute functions separately.
 */

import { createClient } from "@/lib/supabase/server"
import { emitDomainEventWithClient } from "./emit-event"
import { getPropagationRule, resolveRoutes } from "./invalidation-map"
import { recomputeReadiness } from "./recompute-readiness"
import type { DomainEventType, DomainEventSource } from "./event-types"

type ServerSupabase = Awaited<ReturnType<typeof createClient>>

export interface HandleEventInput {
  supabase: ServerSupabase
  event_type: DomainEventType
  job_id: string | null
  user_id: string
  source: DomainEventSource
  payload?: Record<string, unknown>
  metadata?: Record<string, unknown>
}

/**
 * Emit a domain event and trigger all downstream effects (revalidation,
 * recomputation). Call this from every server action that mutates state.
 *
 * Non-blocking: errors are swallowed to protect the mutation path.
 */
export async function handleDomainEvent(input: HandleEventInput): Promise<void> {
  try {
    const rule = getPropagationRule(input.event_type)
    const resolvedRoutes = resolveRoutes(rule.routeTemplates, input.job_id)

    // Emit the event (persists + triggers route revalidation)
    await emitDomainEventWithClient(input.supabase, {
      event_type: input.event_type,
      job_id: input.job_id,
      user_id: input.user_id,
      source: input.source,
      payload: input.payload ?? {},
      invalidates: rule.invalidates,
      recomputes: rule.recomputes,
      affected_routes: resolvedRoutes,
      severity: rule.severity,
      metadata: input.metadata ?? {},
    })

    // Trigger readiness recomputation if required
    if (rule.recomputes.includes("readiness") && input.job_id) {
      void recomputeReadiness({
        supabase: input.supabase,
        jobId: input.job_id,
        userId: input.user_id,
        triggeredBy: input.event_type,
        emitEvent: (eventInput) =>
          emitDomainEventWithClient(input.supabase, eventInput),
      })
    }
  } catch {
    // Domain event handling must never throw into the mutation path
  }
}
