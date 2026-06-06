/**
 * lib/coach/types.ts
 *
 * Canonical type definitions for HireWire's Coach Governance Layer.
 *
 * These types represent the contracts between:
 *  - The generation pipeline (generate-documents route)
 *  - The claim validation system (claim-validator.ts)
 *  - The drift scoring system (drift-scorer.ts)
 *  - The renderer (renderer.ts)
 *
 * GOVERNANCE INVARIANT: No generated output may leave the pipeline without
 * a GovernanceResult attached. A missing result = BLOCK.
 */

// ── Claim Confidence ──────────────────────────────────────────────────────────

export type ClaimConfidence = "high" | "medium" | "low" | "fabricated"

export type ClaimVerdict = {
  /** The text of the generated claim (bullet or sentence). */
  claim_text: string
  /** The evidence_library ID cited as the source. */
  cited_evidence_id: string | null
  /** Whether the cited evidence actually exists in the provided evidence set. */
  evidence_exists: boolean
  /** Whether the claim is textually anchored to the evidence. */
  claim_grounded: boolean
  /** Whether any metric in the claim was traceable to the evidence. */
  metrics_traceable: boolean
  /** The confidence level of this claim. */
  confidence: ClaimConfidence
  /** Human-readable reason if confidence is low or fabricated. */
  failure_reason?: string
}

export type Claim = {
  claim_id: string
  type?: string
  text: string
  claim_text?: string
  cited_evidence_id?: string | null
  evidence_ids: string[]
  truth_state: "VERIFIED" | "USER_CONFIRMED" | "DERIVED" | "UNSUPPORTED"
  confidence: number
  skills?: string[]
  job_requirements_matched?: string[]
  source?: string
  created_at?: string
  updated_at?: string
}

export type DriftReport = {
  drift_score: number
  changed_claims: string[]
  added_claims: string[]
  removed_claims: string[]
  notes: string[]
}

export type EvidenceItem = {
  id: string
  user_id?: string
  source_type?: string
  source_id?: string
  title?: string
  content: string
  skills?: string[]
  confidence: number
  created_at?: string
}

export type QualityGateResult = {
  passed: boolean
  hardFails: string[]
  warnings: string[]
}

// ── Drift Scoring ─────────────────────────────────────────────────────────────

export type DriftCategory =
  | "metric_inflation"      // Number in output bigger than in evidence
  | "scope_expansion"       // Claimed team/budget/scale not in evidence
  | "title_promotion"       // Generated title more senior than evidence
  | "timeline_mismatch"     // Dates don't match evidence
  | "fabricated_outcome"    // Outcome not present in evidence at all
  | "unsupported_tool"      // Named tool not in evidence tools_used
  | "banned_phrase"         // Language on the never-use list

export type DriftFlag = {
  category: DriftCategory
  description: string
  claim_text: string
  evidence_id: string | null
  severity: "warning" | "block"
}

export type DriftScore = {
  /** 0 = perfect fidelity, 100 = completely fabricated */
  score: number
  /** Whether this score causes a hard block on the generation. */
  is_blocking: boolean
  /** Detailed breakdown of what caused drift. */
  flags: DriftFlag[]
  /** Human-readable summary. */
  summary: string
}

// ── Generation Strategy ───────────────────────────────────────────────────────

export type GenerationStrategy =
  | "full_match"        // ≥80% requirement coverage, high confidence
  | "strong_match"      // 65–79% coverage
  | "partial_match"     // 40–64% coverage, gaps noted honestly
  | "honest_stretch"    // <40% coverage, transparent framing
  | "do_not_generate"   // critical fabrication risk

export type StrategyDecision = {
  strategy: GenerationStrategy
  requirement_coverage: number
  evidence_quality_pct: number
  reasoning: string
  /** If do_not_generate, the user-facing safety reason. */
  block_reason?: string
}

// ── Governance Phases ─────────────────────────────────────────────────────────

export type GenerationPhase =
  | "pre_flight"          // Before any generation: evidence/profile/analysis checks
  | "evidence_mapping"    // Building the evidence-to-requirement map
  | "strategy_selection"  // Choosing generation strategy
  | "resume_generation"   // Generating resume bullets
  | "cover_generation"    // Generating cover letter
  | "claim_validation"    // Post-generation: checking every claim
  | "drift_scoring"       // Calculating overall drift
  | "quality_check"       // AI quality pass
  | "persistence"         // Writing to DB

// ── Full Governance Envelope ──────────────────────────────────────────────────

export type GovernanceResult = {
  /** Whether all governance checks passed and the output is safe to persist. */
  passed: boolean
  /** Phase at which governance failed, if applicable. */
  failed_at?: GenerationPhase
  /** Per-claim verdicts for the resume bullets. */
  bullet_verdicts: ClaimVerdict[]
  /** Per-claim verdicts for cover letter paragraphs. */
  paragraph_verdicts: ClaimVerdict[]
  /** Aggregate drift score for this generation. */
  drift: DriftScore
  /** Strategy used. */
  strategy: StrategyDecision
  /** ISO timestamp of this governance run. */
  evaluated_at: string
  /** Version of the governance rules used (increment when rules change). */
  governance_version: string
}

// ── Rendering ─────────────────────────────────────────────────────────────────

export type ResumeSection = {
  label: string
  content: string
}

export type StructuredResume = {
  header: {
    name: string
    headline: string
    contact: string
  }
  summary: string
  sections: ResumeSection[]
  /** Bullets with their provenance IDs — used for governance cross-check. */
  bullets: Array<{
    text: string
    evidence_id: string | null
  }>
}

export type StructuredCoverLetter = {
  date: string
  salutation: string
  paragraphs: Array<{
    text: string
    evidence_ids: string[]
  }>
  closing: string
  signature: string
}

// ── Evidence Shape (minimal) ──────────────────────────────────────────────────
// Matches the subset of evidence_library used by governance — avoids importing
// the full EvidenceRecord type from lib/types.ts to keep this module self-contained.

export type GovernanceEvidence = {
  id: string
  source_title: string
  source_type: string
  confidence_level: string
  responsibilities?: string[]
  outcomes: string[]
  tools_used: string[]
  team_size?: number | null
  budget_scope?: string | null
  user_impact_scale?: string | null
  what_not_to_overstate?: string | null
  approved_achievement_bullets: string[]
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

export type StrategyProfile = {
  id: string
  name: string
  description: string
  allowedIntents: GenerationIntent[]
  constraints: {
    maxResumeLength: number
    maxBulletsPerSection: number
    maxSectionLength: number
    atsSafe: boolean
  }
}
