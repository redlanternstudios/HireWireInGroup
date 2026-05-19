export type ContextSourceType =
  | "resume"
  | "linkedin"
  | "portfolio"
  | "github"
  | "website"
  | "certification"
  | "education"
  | "project"
  | "prior_generated_doc"
  | "coach_memory"
  | "application_outcome"
  | "job_post"
  | "evidence_library"
  | "user_profile"

export type ExtractionMethod = "regex" | "section_parser" | "existing_structured_data" | "user_confirmed" | "ai_structured"
export type Confidence = "low" | "medium" | "high"
export type RiskLevel = "low" | "medium" | "high" | "blocked"
export type AllowedUsage =
  | "resume_allowed"
  | "resume_allowed_with_reframe"
  | "cover_letter_allowed"
  | "interview_only"
  | "coach_only"
  | "blocked"

export type EvidenceType =
  | "name"
  | "email"
  | "phone"
  | "location"
  | "link"
  | "work_experience"
  | "company"
  | "title"
  | "date"
  | "education"
  | "degree"
  | "school"
  | "certification"
  | "project"
  | "tool"
  | "skill"
  | "industry"
  | "achievement"
  | "metric"
  | "keyword"
  | "raw_snippet"

export type NormalizedCategory =
  | "role"
  | "skill"
  | "tool"
  | "domain"
  | "education"
  | "certification"
  | "achievement"
  | "metric"
  | "company"
  | "other"

export type CapabilityType =
  | "domain"
  | "execution"
  | "leadership"
  | "technical"
  | "product"
  | "operations"
  | "communication"
  | "governance"

export type RequirementCategory =
  | "hard_requirement"
  | "soft_requirement"
  | "tool"
  | "technology"
  | "seniority"
  | "domain"
  | "keyword"
  | "knockout"
  | "negotiable"
  | "interview_theme"

export type RequirementImportance = "low" | "medium" | "high" | "critical"
export type GapMatchType =
  | "direct_match"
  | "adjacent_match"
  | "inferred_match"
  | "terminology_mismatch"
  | "true_gap"
  | "unsupported"

export type ClaimVerdict = "supported" | "supported_with_reframe" | "weak_support" | "unsupported" | "blocked"

export interface ContextSource {
  id: string
  user_id?: string
  source_type: ContextSourceType
  source_label: string
  source_url?: string | null
  raw_text: string
  parsed_at?: string | null
  created_at: string
  trust_level?: Confidence
}

export interface ContextEvidenceItem {
  id: string
  user_id?: string
  source_id: string
  evidence_type: EvidenceType
  source_type: ContextSourceType
  source_label: string
  raw_text: string
  normalized_value: string
  confidence: Confidence
  extraction_method: ExtractionMethod
  metadata: Record<string, unknown>
  created_at: string
}

export interface ContextNormalizedEntity {
  id: string
  user_id?: string
  entity_type: EvidenceType | "capability" | "requirement"
  canonical_name: string
  aliases: string[]
  category: NormalizedCategory
  confidence: Confidence
  ambiguity_flags: string[]
  evidence_ids: string[]
  created_at: string
}

export interface ContextCapability {
  id: string
  user_id?: string
  capability_name: string
  capability_type: CapabilityType
  inferred_from_evidence_ids: string[]
  reasoning_summary: string
  confidence: Confidence
  risk_level: RiskLevel
  allowed_usage: AllowedUsage
  created_at: string
}

export interface JobRequirementModel {
  id: string
  job_id?: string
  requirement_text: string
  normalized_requirement: string
  category: RequirementCategory
  importance: RequirementImportance
  confidence: Confidence
  evidence_from_job_post: string
  created_at: string
}

export interface ContextGapMatch {
  id: string
  user_id?: string
  job_id?: string
  requirement_id: string
  match_type: GapMatchType
  match_score: number
  evidence_ids: string[]
  capability_ids: string[]
  explanation: string
  resume_permission: AllowedUsage
  cover_letter_permission: AllowedUsage
  interview_permission: AllowedUsage
  risk_level: RiskLevel
  created_at: string
}

export interface EvidenceGraphNode {
  id: string
  type: "source" | "evidence" | "entity" | "capability" | "requirement" | "claim"
  label: string
  metadata?: Record<string, unknown>
}

export interface EvidenceGraphEdge {
  from: string
  to: string
  relationship:
    | "extracted_from"
    | "normalizes_to"
    | "infers"
    | "matches"
    | "supports"
    | "generates"
    | "validates"
  confidence: Confidence
}

export interface EvidenceGraph {
  nodes: EvidenceGraphNode[]
  edges: EvidenceGraphEdge[]
}

export interface ContextGeneratedClaim {
  id: string
  claim_text: string
  evidence_ids: string[]
  capability_ids?: string[]
  requirement_ids?: string[]
  document_type?: "resume" | "cover_letter" | "interview_prep" | "coach"
}

export interface ContextClaimVerdict {
  id: string
  user_id?: string
  job_id?: string
  generated_document_id?: string | null
  claim_text: string
  verdict: ClaimVerdict
  evidence_ids: string[]
  drift_score: number
  risk_flags: string[]
  suggested_rewrite: string | null
  allowed_usage: AllowedUsage
  created_at: string
}

export interface ContextProfileModel {
  source: ContextSource
  evidenceItems: ContextEvidenceItem[]
  normalizedEntities: ContextNormalizedEntity[]
  capabilities: ContextCapability[]
  graph: EvidenceGraph
}

export interface ContextJobModel {
  source: ContextSource
  requirements: JobRequirementModel[]
  graph: EvidenceGraph
}

export interface ContextGapReport {
  matches: ContextGapMatch[]
  score: number
  directMatches: number
  adjacentMatches: number
  inferredMatches: number
  trueGaps: number
  unsupported: number
}

export interface ContextEngineResult {
  profile: ContextProfileModel
  job?: ContextJobModel
  gapReport?: ContextGapReport
  claimVerdicts?: ContextClaimVerdict[]
}
