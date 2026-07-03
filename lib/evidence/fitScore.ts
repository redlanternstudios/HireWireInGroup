import type { RequirementEvidenceMatch } from "./types"

/**
 * Canonical Fit Score — SINGLE SOURCE OF TRUTH.
 *
 * The Prove Fit page, the Generate gate, and the /api/generate-documents
 * server route must all derive "fit" from THIS function. Do not read
 * `job.score` for fit anymore — that value is written by multiple legacy
 * pipelines (token-overlap context engine + generate route) and drifts.
 *
 * Model (locked 2026-07-03): coverage-based.
 *   fit% = resolved REQUIRED requirements / total REQUIRED requirements.
 *   "Resolved" = proof_decision is auto_mapped or confirmed (real evidence).
 *   Skipped and unresolved (needs_judgment / gap) do NOT count as fit.
 *
 * Gate: green "all-go" AND resume generation require fit >= FIT_THRESHOLD.
 */

export const FIT_THRESHOLD = 70

const RESOLVED_DECISIONS = new Set(["auto_mapped", "confirmed"])

export type FitScoreResult = {
  /** false when there is nothing to score yet (no requirement matches). */
  hasSignal: boolean
  /** 0-100 coverage percentage, or null when hasSignal is false. */
  fitScore: number | null
  requiredTotal: number
  requiredResolved: number
  requiredSkipped: number
  requiredGaps: number
  /** true only when fitScore !== null && fitScore >= FIT_THRESHOLD. */
  meetsThreshold: boolean
}

function isResolved(match: RequirementEvidenceMatch): boolean {
  return RESOLVED_DECISIONS.has(String(match.proof_decision))
}

export function computeFitScore(
  requirementMatches: RequirementEvidenceMatch[] | null | undefined,
): FitScoreResult {
  const matches = Array.isArray(requirementMatches) ? requirementMatches : []
  const required = matches.filter((m) => m.priority === "required")

  const requiredTotal = required.length
  const requiredResolved = required.filter(isResolved).length
  const requiredSkipped = required.filter((m) => m.proof_decision === "skipped").length
  const requiredGaps = Math.max(0, requiredTotal - requiredResolved - requiredSkipped)

  // Denominator: required-only when required requirements exist; otherwise
  // fall back to all actionable matches so roles with no "required" tier
  // still produce an honest number instead of a false 100%.
  const denom = requiredTotal > 0 ? requiredTotal : matches.length
  const resolved = requiredTotal > 0 ? requiredResolved : matches.filter(isResolved).length

  const hasSignal = denom > 0
  const fitScore = hasSignal ? Math.round((resolved / denom) * 100) : null
  const meetsThreshold = fitScore !== null && fitScore >= FIT_THRESHOLD

  return {
    hasSignal,
    fitScore,
    requiredTotal,
    requiredResolved,
    requiredSkipped,
    requiredGaps,
    meetsThreshold,
  }
}
