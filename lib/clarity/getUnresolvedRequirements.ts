import type { SupabaseClient } from "@supabase/supabase-js"
import { deriveMatchingComplete } from "@/lib/evidence/proofCoverage"
import {
  listUnresolvedRequirements,
  type UnresolvedRequirement,
} from "@/lib/evidence/unresolved-requirements"

/**
 * Clarity drawer read shape.
 *
 * Build Day 25 reconciliation: the canonical unresolved-requirements helper now
 * lives in lib/evidence/unresolved-requirements.ts and is the single source of
 * truth (also consumed by GET /api/jobs/[id]/evidence-map). The Phase 3 UI
 * consumes that exact type, re-exported here under its original name so the
 * launcher/drawer imports do not need to change.
 */
export type ClarityRequirement = UnresolvedRequirement

/**
 * Server-side derivation of unresolved requirements for the /jobs/[id] page.
 *
 * Mirrors the GET /api/jobs/[id]/evidence-map read contract exactly, but runs
 * in-process inside the server component (no client fetch, no new API route,
 * the protected POST evidence-map route is untouched):
 *   1. deriveMatchingComplete() reads the CANONICAL prove_fit_decisions source
 *      and returns fresh requirement matches + confirmed decision authority.
 *   2. listUnresolvedRequirements() applies the canonical resolution logic
 *      (skip / auto-map / confirmed+authority / usable packet) and ordering.
 * jobs.evidence_map is only the requirement-set cache; coverage truth always
 * comes from prove_fit_decisions.
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
  const { requirementMatches, confirmedDecisionRequirementIds } =
    await deriveMatchingComplete({
      supabase,
      userId,
      jobId,
      evidenceMap,
      evidenceRows,
    })

  const carrier = {
    ...(evidenceMap && typeof evidenceMap === "object" && !Array.isArray(evidenceMap)
      ? (evidenceMap as Record<string, unknown>)
      : {}),
    requirement_matches: requirementMatches,
  }

  return listUnresolvedRequirements({
    evidence_map: carrier,
    prove_fit_decision_requirement_ids: confirmedDecisionRequirementIds,
  })
}
