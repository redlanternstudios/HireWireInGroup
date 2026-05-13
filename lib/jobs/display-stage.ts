/**
 * Display Stage Derivation
 *
 * Derives a user-facing pipeline stage label from persisted job fields.
 * This is for UI organization ONLY.
 * It consumes lib/readiness/evaluator.ts for readiness authority.
 * It must not set readiness.
 * It must not write job status.
 */

import { evaluateReadiness } from "@/lib/readiness/evaluator"

export type DisplayStage =
  | "inbox"
  | "analyzed"
  | "needs_evidence"
  | "ready_to_generate"
  | "package_drafted"
  | "needs_review"
  | "ready_to_apply"
  | "applied"
  | "follow_up_due"
  | "interviewing"
  | "offered"
  | "rejected"
  | "archived"
  | "stale"

export const DISPLAY_STAGE_LABEL: Record<DisplayStage, string> = {
  inbox:             "Inbox",
  analyzed:          "Analyzed",
  needs_evidence:    "Needs Evidence",
  ready_to_generate: "Ready to Generate",
  package_drafted:   "Package Drafted",
  needs_review:      "Needs Review",
  ready_to_apply:    "Ready to Apply",
  applied:           "Applied",
  follow_up_due:     "Follow Up Due",
  interviewing:      "Interviewing",
  offered:           "Offered",
  rejected:          "Rejected",
  archived:          "Archived",
  stale:             "Stale",
}

export const DISPLAY_STAGE_COLOR: Record<DisplayStage, string> = {
  inbox:             "bg-stone-100 text-stone-600 border-stone-200",
  analyzed:          "bg-amber-50 text-amber-700 border-amber-200",
  needs_evidence:    "bg-orange-50 text-orange-700 border-orange-200",
  ready_to_generate: "bg-sky-50 text-sky-700 border-sky-200",
  package_drafted:   "bg-violet-50 text-violet-700 border-violet-200",
  needs_review:      "bg-yellow-50 text-yellow-700 border-yellow-200",
  ready_to_apply:    "bg-emerald-50 text-emerald-700 border-emerald-200",
  applied:           "bg-blue-50 text-blue-700 border-blue-200",
  follow_up_due:     "bg-red-50 text-red-700 border-red-200",
  interviewing:      "bg-indigo-50 text-indigo-700 border-indigo-200",
  offered:           "bg-emerald-50 text-emerald-700 border-emerald-200",
  rejected:          "bg-rose-50 text-rose-600 border-rose-200",
  archived:          "bg-stone-100 text-stone-500 border-stone-200",
  stale:             "bg-amber-50 text-amber-600 border-amber-200",
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
 * Derive a display stage from job fields.
 * Uses evidence of persisted artifacts, not computed readiness.
 */
export function deriveDisplayStage(job: JobFields, isStale: boolean): DisplayStage {
  const readiness = evaluateReadiness(job)

  if (readiness.outcome === "archived") return "archived"
  if (readiness.outcome === "offered") return "offered"
  if (readiness.outcome === "rejected") return "rejected"
  if (readiness.outcome === "interviewing") return "interviewing"
  if (readiness.outcome === "applied") return "applied"

  const hasResume = !!job.generated_resume
  const hasCoverLetter = !!job.generated_cover_letter
  const hasScore = job.score !== null && job.score !== undefined
  const evidenceMap = job.evidence_map
  const matchingComplete = evidenceMap?.matching_complete === true
  const status = job.status ?? ""
  const hasAnalysis = ["analyzed", "generating", "ready", "needs_review"].includes(status) || hasScore || !!evidenceMap

  if (readiness.stage === "ready") return "ready_to_apply"
  if (readiness.stage === "quality_review") return "needs_review"
  if (readiness.stage === "evidence_blocked" && hasResume && hasCoverLetter) return "needs_evidence"
  if (hasResume || hasCoverLetter) return "package_drafted"

  if (hasAnalysis && matchingComplete) return "ready_to_generate"
  if (hasAnalysis && !matchingComplete) return "needs_evidence"
  if (status === "analyzed" || hasScore) return "analyzed"

  if (isStale) return "stale"

  return "inbox"
}

/**
 * View buckets — maps each display stage to its view tab
 */
export type ViewTab = "active" | "needs_action" | "ready" | "applied" | "closed" | "archived" | "all"

export const STAGE_TO_VIEW: Record<DisplayStage, ViewTab> = {
  inbox:             "active",
  analyzed:          "active",
  needs_evidence:    "needs_action",
  ready_to_generate: "active",
  package_drafted:   "active",
  needs_review:      "needs_action",
  ready_to_apply:    "ready",
  applied:           "applied",
  follow_up_due:     "applied",
  interviewing:      "applied",
  offered:           "closed",
  rejected:          "closed",
  archived:          "archived",
  stale:             "needs_action",
}
