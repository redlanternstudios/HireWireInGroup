// HireWire Coach Types
// Solution-wide, reusable, and strictly governed by the Coach Constitution

export type TruthState = "VERIFIED" | "USER_CONFIRMED" | "DERIVED" | "UNSUPPORTED"

export type ClaimType =
  | "EXPERIENCE"
  | "EDUCATION"
  | "SKILL"
  | "CERTIFICATION"
  | "ACHIEVEMENT"
  | "PROJECT"
  | "SUMMARY"
  | "TITLE"
  | "EMPLOYER"
  | "METRIC"
  | "CUSTOM"

export interface Claim {
  claim_id: string
  type: ClaimType
  text: string
  evidence_ids: string[]
  truth_state: TruthState
  confidence: number
  skills: string[]
  job_requirements_matched: string[]
  source: string
  created_at: string
  updated_at: string
}

export interface EvidenceItem {
  id: string
  user_id: string
  source_type: string
  source_id: string
  title: string
  content: string
  skills: string[]
  confidence: number
  created_at: string
}

export interface JobRequirement {
  id: string
  job_id: string
  requirement_text: string
  requirement_type: string
  priority: number
  keywords: string[]
  confidence: number
  created_at: string
}

export interface RequirementGraph {
  requirements: JobRequirement[]
}

export interface EvidenceGraph {
  evidence: EvidenceItem[]
}

export interface ClaimGraph {
  claims: Claim[]
}

export type GenerationIntent =
  | "ATS_OPTIMIZED"
  | "MORE_CONCISE"
  | "MORE_EXECUTIVE"
  | "MORE_TECHNICAL"
  | "MORE_LEADERSHIP"
  | "MORE_RECRUITER_READABLE"
  | "MORE_HIRING_MANAGER_READABLE"
  | "MORE_METRICS_FOCUSED"
  | "SECTION_REWRITE"
  | "FULL_REWRITE"

export interface StrategyProfile {
  id: string
  name: string
  description: string
  allowedIntents: GenerationIntent[]
  constraints: Record<string, unknown>
}

export type ArtifactType = "RESUME" | "COVER_LETTER" | "OUTREACH" | "INTERVIEW_PREP"

export interface GenerationRun {
  id: string
  user_id: string
  job_id: string
  artifact_type: ArtifactType
  generation_intent: GenerationIntent
  strategy_profile: string
  evidence_locked: boolean
  status: string
  quality_passed: boolean
  drift_score: number
  created_at: string
}

export interface QualityGateResult {
  passed: boolean
  hardFails: string[]
  warnings: string[]
}

export type ValidationSeverity = "HARD_FAIL" | "WARNING"

export interface DriftReport {
  drift_score: number
  changed_claims: string[]
  added_claims: string[]
  removed_claims: string[]
  notes: string[]
}

export interface CoachOutput {
  claims: Claim[]
  artifact_type: ArtifactType
  version: string
  rendered: string
  quality: QualityGateResult
  drift?: DriftReport
}
