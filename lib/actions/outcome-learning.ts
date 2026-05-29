"use server"

import type { SupabaseClient } from "@supabase/supabase-js"

type OutcomeValue =
  | "callback"
  | "rejection"
  | "ghosted"
  | "interview_scheduled"
  | "interview_completed"
  | "offer_received"
  | "offer_accepted"
  | "offer_declined"
  | "application_withdrawn"

interface OutcomeLearningContext {
  role_archetype?: string | null
  narrative_mode?: string | null
  fit_score?: number | null
  days_to_response?: number | null
}

const NEGATIVE_OUTCOMES = new Set<OutcomeValue>(["rejection", "ghosted"])
const POSITIVE_OUTCOMES = new Set<OutcomeValue>([
  "callback",
  "interview_scheduled",
  "interview_completed",
  "offer_received",
  "offer_accepted",
])

function asRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {}
  return value as Record<string, unknown>
}

function uniqueAppend(value: unknown, item: string): string[] {
  const existing = Array.isArray(value) ? value.filter((entry): entry is string => typeof entry === "string") : []
  return existing.includes(item) ? existing : [...existing, item]
}

export async function writeOutcomeLearning(
  supabase: SupabaseClient,
  userId: string,
  outcome: OutcomeValue,
  context: OutcomeLearningContext,
): Promise<void> {
  const archetype = context.role_archetype?.trim()
  if (!archetype) return

  const { data: profile, error } = await supabase
    .from("user_profile")
    .select("career_context")
    .eq("user_id", userId)
    .maybeSingle()

  if (error || !profile) return

  const careerContext = asRecord(profile.career_context)
  const outcomeLearning = asRecord(careerContext.outcome_learning)

  let nextOutcomeLearning = outcomeLearning
  if (NEGATIVE_OUTCOMES.has(outcome)) {
    nextOutcomeLearning = {
      ...outcomeLearning,
      weak_archetypes: uniqueAppend(outcomeLearning.weak_archetypes, archetype),
    }
  } else if (POSITIVE_OUTCOMES.has(outcome)) {
    nextOutcomeLearning = {
      ...outcomeLearning,
      strong_archetypes: uniqueAppend(outcomeLearning.strong_archetypes, archetype),
    }
  } else {
    return
  }

  const observations = Array.isArray(outcomeLearning.observations)
    ? outcomeLearning.observations.filter((entry) => entry && typeof entry === "object")
    : []

  const nextCareerContext = {
    ...careerContext,
    outcome_learning: {
      ...nextOutcomeLearning,
      observations: [
        ...observations,
        {
          outcome,
          role_archetype: archetype,
          narrative_mode: context.narrative_mode ?? null,
          fit_score: context.fit_score ?? null,
          days_to_response: context.days_to_response ?? null,
          observed_at: new Date().toISOString(),
        },
      ].slice(-50),
    },
  }

  await supabase
    .from("user_profile")
    .update({
      career_context: nextCareerContext,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", userId)
}
