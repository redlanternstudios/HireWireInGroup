import type { SupabaseClient } from "@supabase/supabase-js"
import type { RequirementEvidenceMatch, RequirementProofDecision } from "./types"

const RESOLVED_DECISIONS = new Set<RequirementProofDecision>([
  "auto_mapped",
  "confirmed",
  "skipped",
])

type CoverageDecision = {
  requirement_id: string
  decision: RequirementProofDecision
  created_at?: string | null
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null
}

function normalizeDecision(value: unknown): RequirementProofDecision | null {
  if (value === "auto_mapped" || value === "confirmed" || value === "skipped" || value === "needs_judgment") {
    return value
  }
  return null
}

export function getRequirementMatches(evidenceMap: unknown): RequirementEvidenceMatch[] {
  const map = asRecord(evidenceMap)
  return Array.isArray(map?.requirement_matches)
    ? map.requirement_matches.filter((match): match is RequirementEvidenceMatch =>
        Boolean(match) &&
        typeof match === "object" &&
        typeof (match as RequirementEvidenceMatch).requirement_id === "string"
      )
    : []
}

export function applyAutoMappedProofDecisions(
  matches: RequirementEvidenceMatch[]
): RequirementEvidenceMatch[] {
  return matches.map((match) => {
    const decision = normalizeDecision(match.proof_decision)
    if (decision && RESOLVED_DECISIONS.has(decision)) return match

    return match.matched_evidence_ids.length > 0
      ? { ...match, proof_decision: "auto_mapped" }
      : { ...match, proof_decision: decision ?? "needs_judgment" }
  })
}

export function isMatchingComplete(matches: RequirementEvidenceMatch[]): boolean {
  return matches.length > 0 && matches.every((match) => {
    const decision = normalizeDecision(match.proof_decision)
    return Boolean(decision && RESOLVED_DECISIONS.has(decision))
  })
}

export async function deriveMatchingComplete({
  supabase,
  userId,
  jobId,
  evidenceMap,
}: {
  supabase: SupabaseClient
  userId: string
  jobId: string
  evidenceMap: unknown
}): Promise<{ matchingComplete: boolean; requirementMatches: RequirementEvidenceMatch[] }> {
  const matches = applyAutoMappedProofDecisions(getRequirementMatches(evidenceMap))

  if (matches.length === 0) {
    return { matchingComplete: false, requirementMatches: matches }
  }

  const { data: decisions, error } = await supabase
    .from("prove_fit_decisions")
    .select("requirement_id, decision, created_at")
    .eq("user_id", userId)
    .eq("job_id", jobId)
    .order("created_at", { ascending: true })

  if (error) {
    console.error("[hirewire] prove_fit_decisions_coverage_read_failed", {
      jobId,
      userId,
      error: error.message,
    })
  }

  const decisionByRequirement = new Map(
    ((decisions ?? []) as CoverageDecision[])
      .filter((decision) => RESOLVED_DECISIONS.has(decision.decision))
      .map((decision) => [decision.requirement_id, decision.decision])
  )

  const mergedMatches = matches.map((match) => {
    const canonicalDecision = decisionByRequirement.get(match.requirement_id)
    return canonicalDecision
      ? { ...match, proof_decision: canonicalDecision }
      : match
  })

  return {
    matchingComplete: isMatchingComplete(mergedMatches),
    requirementMatches: mergedMatches,
  }
}
