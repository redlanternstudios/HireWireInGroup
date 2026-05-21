export type RequirementPriority = "required" | "preferred" | "keyword"

export type RequirementMatchStatus = "met" | "partial" | "gap" | "unknown"

export type RequirementMatchMethod =
  | "exact"
  | "synonym"
  | "fuzzy"
  | "manual"

export type RequirementConfidence = "high" | "medium" | "low"

export type EvidenceMatchStrength = "strong" | "partial" | "weak"
export type EvidenceAllowedUsage =
  | "resume_allowed"
  | "resume_allowed_with_reframe"
  | "cover_letter_allowed"
  | "interview_only"
  | "blocked"

export type RequirementEvidenceMatch = {
  requirement_id: string
  requirement_text: string
  normalized_requirement: string
  expectation_type?: string
  employer_intent?: string
  recovery_question?: string
  proof_needed?: string[]
  evidence_questions?: string[]
  related_skills?: string[]
  seniority_level?: string | null
  priority: RequirementPriority
  status: RequirementMatchStatus
  matched_evidence_ids: string[]
  matched_evidence_titles: string[]
  evidence_types: string[]
  confidence: RequirementConfidence
  match_method: RequirementMatchMethod
  reasoning: string
  riskFlags?: string[]
  updated_at?: string
  mapped_by_session_ids?: string[]
}

export type EvidenceIntelligencePacket = {
  packet_id: string
  requirement: string
  normalized: string
  priority: RequirementPriority
  matchedEvidenceIds: string[]
  matchedEvidenceTitles: string[]
  proofSnippets: string[]
  systems: string[]
  tools: string[]
  outcomes: string[]
  responsibilities: string[]
  companies: string[]
  roles: string[]
  matchStrength: EvidenceMatchStrength
  matchScore: number
  matchReason: string
  evidenceStrength: RequirementConfidence
  riskFlags: string[]
  allowedUsage: EvidenceAllowedUsage
  whyIncluded: string
}

export type EvidenceCoverageSummary = {
  required_total: number
  required_met: number
  required_partial: number
  required_gaps: number
  preferred_total: number
  preferred_met: number
  keyword_total: number
  keyword_met: number
}

export type CanonicalJobEvidenceMap = {
  matching_complete: boolean
  completed_at: string
  version?: string
  requirement_matches: RequirementEvidenceMatch[]
  capability_packets: EvidenceIntelligencePacket[]
  coverage_summary: EvidenceCoverageSummary
  gap_summary: string[]
}
