/**
 * lib/coach/signals/emit-signals.ts
 *
 * Persists detected CoachSignals to the domain_events table so they appear
 * in the activity log and can be consumed by analytics and future automations.
 *
 * Deduplicates within a 24-hour window per signal type per user to prevent
 * flooding the event log when the coach is called repeatedly.
 */

import { handleDomainEvent } from "@/lib/domain-events"
import type { createClient } from "@/lib/supabase/server"
import type { CoachSignal } from "./index"

type ServerSupabase = Awaited<ReturnType<typeof createClient>>

const DEDUP_HOURS = 24

export async function emitCoachSignals(
  supabase: ServerSupabase,
  signals: CoachSignal[],
  userId: string,
  jobId: string | null
): Promise<void> {
  if (signals.length === 0) return

  const since = new Date(Date.now() - DEDUP_HOURS * 60 * 60 * 1000).toISOString()

  const { data: recentEvents } = await supabase
    .from("domain_events")
    .select("payload")
    .eq("user_id", userId)
    .eq("event_type", "coach_action_taken")
    .gte("created_at", since)

  const recentSignalTypes = new Set(
    (recentEvents ?? []).map(e => {
      const p = e.payload
      return typeof p === "object" && p !== null ? (p as Record<string, unknown>).signal_type : null
    }).filter(Boolean)
  )

  for (const signal of signals) {
    if (recentSignalTypes.has(signal.type)) continue

    void handleDomainEvent({
      supabase,
      event_type: "coach_action_taken",
      job_id: jobId,
      user_id: userId,
      source: "coach_route",
      payload: {
        signal_type: signal.type,
        detected_at: signal.timestamp,
        ...signal.payload,
      },
    })
  }
}
