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
  evidence_id?: string | null
  claim_text?: string | null
  skip_reason?: string | null
  session_id?: string | null
  updated_at?: string | null
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
    if (decision === "auto_mapped") return match

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

function getEvidenceTitle(evidence: Record<string, unknown> | undefined): string | null {
  return typeof evidence?.source_title === "string" ? evidence.source_title : null
}

function getEvidenceType(evidence: Record<string, unknown> | undefined): string | null {
  return typeof evidence?.source_type === "string" ? evidence.source_type : null
}

export function applyProofDecisionsToMatches(
  matches: RequirementEvidenceMatch[],
  decisions: CoverageDecision[],
  evidenceRows: Record<string, unknown>[] = []
): RequirementEvidenceMatch[] {
  const evidenceById = new Map(evidenceRows.map((row) => [String(row.id), row]))
  const decisionByRequirement = new Map<string, CoverageDecision>()

  for (const decision of decisions) {
    if (RESOLVED_DECISIONS.has(decision.decision)) {
      decisionByRequirement.set(decision.requirement_id, decision)
    }
  }

  return matches.map((match) => {
    const decision = decisionByRequirement.get(match.requirement_id)
    if (!decision) return match

    if (decision.decision === "skipped") {
      return {
        ...match,
        proof_decision: "skipped",
        skip_reason: decision.skip_reason ?? match.skip_reason ?? null,
        skipped_at: decision.updated_at ?? decision.created_at ?? match.skipped_at,
        riskFlags: Array.from(new Set([...(match.riskFlags ?? []), "user_skipped"])),
      }
    }

    if (decision.decision === "confirmed") {
      const evidenceId = decision.evidence_id ? String(decision.evidence_id) : null
      const evidence = evidenceId ? evidenceById.get(evidenceId) : undefined
      const evidenceTitle = getEvidenceTitle(evidence)
      const evidenceType = getEvidenceType(evidence)

      return {
        ...match,
        status: evidenceId ? "met" : match.status,
        matched_evidence_ids: evidenceId
          ? Array.from(new Set([...match.matched_evidence_ids, evidenceId]))
          : match.matched_evidence_ids,
        matched_evidence_titles: evidenceTitle
          ? Array.from(new Set([...match.matched_evidence_titles, evidenceTitle]))
          : match.matched_evidence_titles,
        evidence_types: evidenceType
          ? Array.from(new Set([...match.evidence_types, evidenceType]))
          : match.evidence_types,
        confidence: evidenceId ? "high" : match.confidence,
        match_method: evidenceId ? "manual" : match.match_method,
        proof_decision: "confirmed",
        user_claim: decision.claim_text ?? match.user_claim ?? null,
        skip_reason: null,
        confirmed_at: decision.updated_at ?? decision.created_at ?? match.confirmed_at,
        skipped_at: null,
        mapped_by_session_ids: decision.session_id
          ? Array.from(new Set([...(match.mapped_by_session_ids ?? []), decision.session_id]))
          : match.mapped_by_session_ids,
        riskFlags: (match.riskFlags ?? []).filter((flag) =>
          !["missing_evidence", "no_packet_evidence", "partial_match", "user_skipped"].includes(flag)
        ),
      }
    }

    return { ...match, proof_decision: "auto_mapped" }
  })
}

export async function deriveMatchingComplete({
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
}): Promise<{ matchingComplete: boolean; requirementMatches: RequirementEvidenceMatch[] }> {
  const matches = applyAutoMappedProofDecisions(getRequirementMatches(evidenceMap))

  if (matches.length === 0) {
    return { matchingComplete: false, requirementMatches: matches }
  }

  const { data: decisions, error } = await supabase
    .from("prove_fit_decisions")
    .select("requirement_id, decision, evidence_id, claim_text, skip_reason, session_id, created_at, updated_at")
    .eq("user_id", userId)
    .eq("job_id", jobId)
    .order("updated_at", { ascending: true })

  if (error) {
    console.error("[hirewire] prove_fit_decisions_coverage_read_failed", {
      jobId,
      userId,
      error: error.message,
    })
  }

  const mergedMatches = applyProofDecisionsToMatches(
    matches,
    (decisions ?? []) as CoverageDecision[],
    evidenceRows
  )

  return {
    matchingComplete: isMatchingComplete(mergedMatches),
    requirementMatches: mergedMatches,
  }
}
