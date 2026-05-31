import type { SupabaseClient } from "@supabase/supabase-js"
import { deriveMatchingComplete } from "@/lib/evidence/proofCoverage"
import type { RequirementProofDecision } from "@/lib/evidence/types"

/**
 * Clarity drawer read shape.
 *
 * This is the stable contract the Phase 3 UI consumes. The fields here are a
 * deliberate subset of RequirementEvidenceMatch — enough to render the drawer
 * header and to start/resume a coach session for the requirement.
 */
export interface ClarityRequirement {
  requirement_id: string
  requirement_text: string
  priority?: string
  status?: string
  proof_needed?: string[]
}

/** A decision is "resolved" once it is auto-mapped, confirmed, or skipped. */
function isUnresolved(decision: RequirementProofDecision | undefined): boolean {
  return decision == null || decision === "needs_judgment"
}

/**
 * THIN ADAPTER — Phase 3 boundary.
 *
 * Derives the list of still-unresolved requirements for a job from the
 * CANONICAL source of truth: prove_fit_decisions (read inside
 * deriveMatchingComplete). jobs.evidence_map is used as a cache for the
 * requirement set only; coverage truth always comes from prove_fit_decisions.
 *
 * When Codex publishes the canonical shared "unresolved requirements" helper,
 * swap the body of this function to delegate to it. The ClarityRequirement
 * return shape is the stable contract the UI depends on, so callers/components
 * do NOT need to change.
 */
export async function getUnresolvedRequirements({
  supabase,
  userId,
  jobId,
  evidenceMap,
  evidenceRows = [],
}: {
  supabase: SupabaseClient
  userId: string
  jobId: string
  evidenceMap: unknown
  evidenceRows?: Record<string, unknown>[]
}): Promise<ClarityRequirement[]> {
  const { requirementMatches } = await deriveMatchingComplete({
    supabase,
    userId,
    jobId,
    evidenceMap,
    evidenceRows,
  })

  return requirementMatches
    .filter((match) => isUnresolved(match.proof_decision))
    .map((match) => ({
      requirement_id: match.requirement_id,
      requirement_text: match.requirement_text,
      priority: match.priority,
      status: match.status,
      proof_needed: match.proof_needed,
    }))
}
