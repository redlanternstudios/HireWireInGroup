import type {
  RequirementConfidence,
  RequirementEvidenceMatch,
  RequirementMatchMethod,
  RequirementMatchStatus,
  RequirementPriority,
} from "./types"
import { hasSynonymOverlap } from "./evidenceSynonyms"
import { normalizeRequirement, tokenize } from "./normalizeRequirement"
import { compareSeniorityLevels } from "@/lib/seniority-levels"

type EvidenceCandidate = {
  id: string
  source_title: string
  source_type: string
  role_name?: string | null
  company_name?: string | null
  responsibilities?: string[] | null
  tools_used?: string[] | null
  outcomes?: string[] | null
  industries?: string[] | null
  proof_snippet?: string | null
  confidence_level?: "high" | "medium" | "low" | null
  is_user_approved?: boolean | null
}

function buildEvidenceText(evidence: EvidenceCandidate): string {
  return [
    evidence.source_title,
    evidence.source_type,
    evidence.role_name,
    evidence.company_name,
    evidence.proof_snippet,
    ...(evidence.responsibilities ?? []),
    ...(evidence.tools_used ?? []),
    ...(evidence.outcomes ?? []),
    ...(evidence.industries ?? []),
  ]
    .filter(Boolean)
    .join(" ")
}

function buildSeniorityRequirementText(requirement: string, seniorityLevel?: string | null): string {
  const seniority = typeof seniorityLevel === "string" ? seniorityLevel.trim() : ""
  if (!seniority) return requirement
  const normalizedRequirement = requirement.toLowerCase()
  const normalizedSeniority = seniority.toLowerCase()
  if (normalizedRequirement.includes(normalizedSeniority)) return requirement
  return `${seniority} ${requirement}`
}

function buildEvidenceSeniorityText(evidence: EvidenceCandidate): string {
  return [
    evidence.role_name,
    evidence.source_title,
  ]
    .filter(Boolean)
    .join(" ")
}

function calculateTokenOverlap(requirementTokens: string[], evidenceTokens: string[]): number {
  if (requirementTokens.length === 0) return 0
  const evidenceSet = new Set(evidenceTokens)
  const matched = requirementTokens.filter(token => evidenceSet.has(token))
  return matched.length / requirementTokens.length
}

function detectMatchMethod(
  normalizedRequirement: string,
  normalizedEvidence: string,
  requirementTokens: string[],
  evidenceTokens: string[]
): RequirementMatchMethod | null {
  if (normalizedEvidence.includes(normalizedRequirement)) return "exact"
  const overlap = calculateTokenOverlap(requirementTokens, evidenceTokens)
  if (overlap >= 0.65) return "exact"
  if (hasSynonymOverlap(requirementTokens, evidenceTokens)) return "synonym"
  if (overlap >= 0.35) return "fuzzy"
  return null
}

function statusFromMethodAndOverlap(
  method: RequirementMatchMethod | null,
  overlap: number
): RequirementMatchStatus {
  if (!method) return "gap"
  if (method === "exact") return "met"
  if (method === "synonym" && overlap >= 0.25) return "met"
  if (method === "synonym") return "partial"
  if (method === "fuzzy") return "partial"
  return "unknown"
}

function confidenceFromStatus(
  status: RequirementMatchStatus,
  evidence: EvidenceCandidate[]
): RequirementConfidence {
  if (status === "gap" || status === "unknown") return "low"
  const hasApprovedHighConfidence = evidence.some(item =>
    item.is_user_approved === true || item.confidence_level === "high"
  )
  if (status === "met" && hasApprovedHighConfidence) return "high"
  if (status === "met") return "medium"
  return "medium"
}

export function matchRequirementToEvidence(params: {
  requirement: string
  requirementId?: string
  expectationType?: string
  employerIntent?: string
  recoveryQuestion?: string
  proofNeeded?: string[]
  evidenceQuestions?: string[]
  relatedSkills?: string[]
  seniorityLevel?: string | null
  priority: RequirementPriority
  evidenceCandidates: EvidenceCandidate[]
}): RequirementEvidenceMatch {
  const normalizedRequirement = normalizeRequirement(params.requirement)
  const requirementTokens = tokenize(params.requirement)
  const seniorityRequirementText = buildSeniorityRequirementText(
    params.requirement,
    params.seniorityLevel
  )
  const scored = params.evidenceCandidates
    .map(evidence => {
      const evidenceText = buildEvidenceText(evidence)
      const normalizedEvidence = normalizeRequirement(evidenceText)
      const evidenceTokens = tokenize(evidenceText)
      const overlap = calculateTokenOverlap(requirementTokens, evidenceTokens)
      const method = detectMatchMethod(
        normalizedRequirement,
        normalizedEvidence,
        requirementTokens,
        evidenceTokens
      )
      const status = statusFromMethodAndOverlap(method, overlap)

      // Check for seniority mismatch
      const seniorityComparison = compareSeniorityLevels(
        seniorityRequirementText,
        buildEvidenceSeniorityText(evidence)
      )
      const hasSeniorityGap = seniorityComparison.gap_type === "seniority_gap_up"

      return {
        evidence,
        overlap,
        method,
        status,
        hasSeniorityGap,
        seniorityComparison,
      }
    })
    .filter(item => item.status === "met" || item.status === "partial")
    .sort((a, b) => b.overlap - a.overlap)

  const bestStatus: RequirementMatchStatus =
    scored.some(item => item.status === "met")
      ? "met"
      : scored.some(item => item.status === "partial")
        ? "partial"
        : "gap"
  const matchedEvidence = scored.slice(0, 5).map(item => item.evidence)
  const bestMethod: RequirementMatchMethod =
    scored.find(item => item.status === "met")?.method ??
    scored[0]?.method ??
    "fuzzy"
  const confidence = confidenceFromStatus(bestStatus, matchedEvidence)

  // Detect risk flags
  const riskFlags: string[] = []
  if (scored.some(item => item.hasSeniorityGap)) {
    riskFlags.push("seniority_mismatch")
  }

  return {
    requirement_id: params.requirementId ?? normalizedRequirement.slice(0, 80).replace(/\s+/g, "_"),
    requirement_text: params.requirement,
    normalized_requirement: normalizedRequirement,
    expectation_type: params.expectationType,
    employer_intent: params.employerIntent,
    recovery_question: params.recoveryQuestion ?? params.evidenceQuestions?.[0],
    proof_needed: params.proofNeeded,
    evidence_questions: params.evidenceQuestions,
    related_skills: params.relatedSkills,
    seniority_level: params.seniorityLevel,
    priority: params.priority,
    status: bestStatus,
    matched_evidence_ids: matchedEvidence.map(item => item.id),
    matched_evidence_titles: matchedEvidence.map(item => item.source_title),
    evidence_types: Array.from(new Set(matchedEvidence.map(item => item.source_type))),
    confidence,
    match_method: bestStatus === "gap" ? "fuzzy" : bestMethod,
    reasoning:
      bestStatus === "gap"
        ? "No evidence met the normalized requirement with enough confidence."
        : `Matched through ${bestMethod} logic using ${matchedEvidence.length} evidence item(s).`,
    riskFlags: riskFlags.length > 0 ? riskFlags : undefined,
    updated_at: new Date().toISOString(),
  }
}
