/**
 * Display Stage Derivation
 *
 * Derives a user-facing pipeline stage label from persisted job fields.
 * This is for UI organization ONLY.
 * It consumes lib/readiness/evaluator.ts for readiness authority.
 * It must not set readiness.
 * It must not write job status.
 */

import {
  evaluateReadiness,
  READINESS_DISPLAY_CLASS,
  READINESS_DISPLAY_LABEL,
  type ReadinessDisplayState,
} from "@/lib/readiness/evaluator"

export type DisplayStage = ReadinessDisplayState

export const DISPLAY_STAGE_LABEL: Record<DisplayStage, string> = {
  ...READINESS_DISPLAY_LABEL,
}

export const DISPLAY_STAGE_COLOR: Record<DisplayStage, string> = {
  ...READINESS_DISPLAY_CLASS,
}

export interface JobFields {
  status: string | null
  generation_status?: string | null
  generated_resume?: string | null
  generated_cover_letter?: string | null
  quality_passed?: boolean | null
  applied_at?: string | null
  evidence_map?: Record<string, unknown> | null
  score?: number | null
  // TODO: add follow_up_at and interviewing_at when column is added
}

/**
 * Derive a display stage from the canonical readiness display state.
 */
export function deriveDisplayStage(job: JobFields, _isStale: boolean): DisplayStage {
  const readiness = evaluateReadiness(job)
  return readiness.displayState
}

/**
 * View buckets — maps each display stage to its view tab
 */
export type ViewTab = "active" | "needs_action" | "ready" | "applied" | "closed" | "archived" | "all"

export const STAGE_TO_VIEW: Record<DisplayStage, ViewTab> = {
  analyze_needed:    "active",
  evidence_needed:   "needs_action",
  coach_needed:      "needs_action",
  ready_to_generate: "active",
  package_review:    "needs_action",
  ready_to_apply:    "ready",
  applied:           "applied",
  interviewing:      "applied",
  offered:           "closed",
  rejected:          "closed",
  archived:          "archived",
}
