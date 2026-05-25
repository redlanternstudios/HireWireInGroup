/**
 * lib/coach/claim-validator.ts
 *
 * Two validators:
 *   1. validateCoachAnswer — scores a user's Match Interview answer by concrete signal count.
 *      Used by the coach-step route to gate saves and set dynamic confidence_score.
 *   2. validateClaim / validateAllClaims — post-generation document validators that check
 *      whether generated bullets/paragraphs are grounded in evidence records.
 */

// ============================================================================
// 1. COACH ANSWER VALIDATOR
// ============================================================================

export interface ClaimSignals {
  hasEmployer: boolean
  hasTime: boolean
  hasScope: boolean
  hasMetric: boolean
  hasTool: boolean
  hasActionVerb: boolean
}

export interface CoachAnswerValidation {
  signals: ClaimSignals
  signalCount: number
  confidence: number
  needsMoreDetail: boolean
  coaching_nudge: string
  what_not_to_overstate: string
  can_force_save: boolean
}

// Action verbs that indicate a concrete contribution
const ACTION_VERBS = /\b(built|shipped|led|launched|created|designed|developed|drove|owned|managed|implemented|deployed|reduced|increased|improved|cut|doubled|scaled|migrated|refactored|wrote|architected|negotiated|closed|generated|delivered|automated|defined|established|hired|coached|mentored|partnered|facilitated|coordinated)\b/i

// Time signals: years, quarters, months, duration expressions
const TIME_PATTERNS = /\b(20\d\d|q[1-4]|january|february|march|april|may|june|july|august|september|october|november|december|\d+\s*(weeks?|months?|years?|days?|quarters?))\b/i

// Scope signals: team size, user count, org size, % of something
const SCOPE_PATTERNS = /\b(\d+\s*(users?|customers?|clients?|engineers?|people|team members?|stakeholders?|markets?)|\d+%|\$[\d,.]+[kmb]?|global|enterprise|cross-functional|org-wide)\b/i

// Metric signals: a number adjacent to a unit or outcome word
const METRIC_PATTERNS = /\b\d[\d,]*\s*(%|x|k|m|b|ms|s\b|hours?|days?|weeks?|\$|dollars?|times?|points?|bps?)\b|\b(increased|decreased|reduced|improved|grew|cut|saved|generated)\s+\w+\s+by\s+\d/i

// Tool/technology signals
const TOOL_PATTERNS = /\b(react|next\.?js|typescript|python|sql|postgres|supabase|aws|gcp|azure|kubernetes|docker|graphql|rest api|stripe|salesforce|jira|figma|looker|dbt|spark|kafka|airflow|openai|langchain|claude|gpt|llm|ai|ml|machine learning)\b/i

// Employer/company signal — capitalized proper noun(s) that aren't the requirement itself
// Simple heuristic: at least one sequence of Title Case words that looks like a company/org
const EMPLOYER_PATTERNS = /\b(at|for|with|@)\s+[A-Z][a-zA-Z]+(\s+[A-Z][a-zA-Z]+)?|\b[A-Z][a-zA-Z]+(\.com|Inc\b|LLC\b|Corp\b|Ltd\b)\b/

function detectSignals(answer: string): ClaimSignals {
  return {
    hasActionVerb: ACTION_VERBS.test(answer),
    hasTime: TIME_PATTERNS.test(answer),
    hasScope: SCOPE_PATTERNS.test(answer),
    hasMetric: METRIC_PATTERNS.test(answer),
    hasTool: TOOL_PATTERNS.test(answer),
    hasEmployer: EMPLOYER_PATTERNS.test(answer),
  }
}

// Confidence by signal count: 0 → 0.15, 1 → 0.35, 2 → 0.55, 3 → 0.68, 4 → 0.80, 5 → 0.90, 6 → 0.95
const CONFIDENCE_BY_SIGNAL_COUNT = [0.15, 0.35, 0.55, 0.68, 0.80, 0.90, 0.95]

function buildCoachingNudge(signals: ClaimSignals, requirementText: string): string {
  const missing: string[] = []
  if (!signals.hasActionVerb) missing.push("what you specifically did (an action verb)")
  if (!signals.hasEmployer) missing.push("where this happened (company or project name)")
  if (!signals.hasTime) missing.push("when (year, quarter, or duration)")
  if (!signals.hasScope) missing.push("how big (team size, user count, or % affected)")
  if (!signals.hasMetric) missing.push("a measurable outcome (number or % change)")
  if (!signals.hasTool) missing.push("what tools or systems you used")

  if (missing.length === 0) return ""

  const firstTwo = missing.slice(0, 2).join(" and ")
  return `To make this stronger, add ${firstTwo} — that turns a claim about "${requirementText.slice(0, 60)}" into verifiable proof.`
}

function buildWhatNotToOverstate(signals: ClaimSignals): string {
  const parts: string[] = ["Use only what the user stated explicitly."]
  if (!signals.hasMetric) parts.push("Do not add metrics the user did not provide.")
  if (!signals.hasEmployer) parts.push("Do not infer employer or company names.")
  if (!signals.hasTime) parts.push("Do not add dates or durations not mentioned.")
  if (!signals.hasScope) parts.push("Do not inflate scope or team size.")
  if (!signals.hasTool) parts.push("Do not add technology names not stated.")
  return parts.join(" ")
}

export function validateCoachAnswer(answer: string, requirementText: string): CoachAnswerValidation {
  const signals = detectSignals(answer)
  const signalCount = Object.values(signals).filter(Boolean).length
  const confidence = CONFIDENCE_BY_SIGNAL_COUNT[Math.min(signalCount, 6)]
  const needsMoreDetail = confidence < 0.35

  return {
    signals,
    signalCount,
    confidence,
    needsMoreDetail,
    coaching_nudge: buildCoachingNudge(signals, requirementText),
    what_not_to_overstate: buildWhatNotToOverstate(signals),
    can_force_save: confidence >= 0.15,
  }
}

// ============================================================================
// 2. POST-GENERATION CLAIM VALIDATOR
// ============================================================================

/**
 * Post-generation claim validator.
 *
 * Every bullet or paragraph produced by the generation pipeline passes through
 * this module. It checks:
 *
 *   1. Does the cited evidence ID actually exist in the evidence set?
 *   2. Is the claim textually grounded in that evidence (keywords, outcomes)?
 *   3. Are any metrics in the claim traceable to the evidence record?
 *
 * GOVERNANCE INVARIANT: A claim with `confidence: "fabricated"` must NEVER
 * appear in a persisted document. The generation pipeline should block or
 * request a retry when fabricated claims are found.
 */

import type { ClaimVerdict, ClaimConfidence, GovernanceEvidence } from "./types"

const FABRICATION_OVERLAP_THRESHOLD = 0.03
const MEDIUM_CONFIDENCE_OVERLAP_THRESHOLD = 0.12

// ── Numeric extraction ────────────────────────────────────────────────────────

const NUMBER_PATTERN = /(\d[\d,]*(?:\.\d+)?)\s*(%|k|m|b|x|\/)?/gi

function extractNumbers(text: string): number[] {
  const matches: number[] = []
  for (const match of text.matchAll(NUMBER_PATTERN)) {
    const n = parseFloat(match[1].replace(/,/g, ""))
    if (!isNaN(n)) matches.push(n)
  }
  return matches
}

function evidenceNumbers(ev: GovernanceEvidence): number[] {
  const texts = [
    ...(ev.responsibilities ?? []),
    ...(ev.outcomes ?? []),
    ...(ev.approved_achievement_bullets ?? []),
    ev.team_size != null ? String(ev.team_size) : "",
    ev.budget_scope ?? "",
    ev.user_impact_scale ?? "",
  ].join(" ")
  return extractNumbers(texts)
}

// ── Keyword grounding ─────────────────────────────────────────────────────────

const STOP_WORDS = new Set([
  "a", "an", "the", "and", "or", "but", "in", "on", "at", "to", "for",
  "of", "with", "by", "from", "as", "into", "through", "during", "including",
  "is", "was", "were", "are", "be", "been", "being", "have", "had", "has",
  "do", "did", "does", "will", "would", "could", "should", "may", "might",
  "this", "that", "these", "those", "it", "its", "we", "our", "my", "i",
])

function keywordsOf(text: string): Set<string> {
  return new Set(
    text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter((w) => w.length > 3 && !STOP_WORDS.has(w))
  )
}

function overlapRatio(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 || b.size === 0) return 0
  let hits = 0
  for (const w of a) if (b.has(w)) hits++
  return hits / Math.min(a.size, b.size)
}

function findBestEvidenceMatch(
  claimText: string,
  evidenceSet: GovernanceEvidence[]
): { evidence: GovernanceEvidence; overlap: number } | null {
  const claimKeywords = keywordsOf(claimText)
  let best: { evidence: GovernanceEvidence; overlap: number } | null = null

  for (const evidence of evidenceSet) {
    const evidenceKeywords = keywordsOf(buildEvidenceText(evidence))
    const overlap = overlapRatio(claimKeywords, evidenceKeywords)
    if (!best || overlap > best.overlap) {
      best = { evidence, overlap }
    }
  }

  return best && best.overlap >= FABRICATION_OVERLAP_THRESHOLD ? best : null
}

// ── Core validator ────────────────────────────────────────────────────────────

function buildEvidenceText(ev: GovernanceEvidence): string {
  return [
    ev.source_title,
    ...(ev.responsibilities ?? []),
    ...(ev.outcomes ?? []),
    ...(ev.approved_achievement_bullets ?? []),
    ...(ev.tools_used ?? []),
    ev.team_size != null ? `team of ${ev.team_size}` : "",
    ev.budget_scope ?? "",
    ev.user_impact_scale ?? "",
  ]
    .filter(Boolean)
    .join(" ")
}

function assessConfidence(params: {
  evidenceExists: boolean
  overlapRatio: number
  metricsTraceable: boolean
  hasMetrics: boolean
}): { confidence: ClaimConfidence; reason?: string } {
  const { evidenceExists, overlapRatio: overlap, metricsTraceable, hasMetrics } = params

  if (!evidenceExists) {
    return { confidence: "fabricated", reason: "Cited evidence ID not found in evidence set." }
  }

  if (overlap < FABRICATION_OVERLAP_THRESHOLD) {
    return {
      confidence: "fabricated",
      reason: `Claim shares almost no keywords with cited evidence (overlap: ${(overlap * 100).toFixed(0)}%).`,
    }
  }

  if (hasMetrics && !metricsTraceable) {
    return {
      confidence: "low",
      reason: "Claim contains metrics not traceable to the cited evidence record.",
    }
  }

  if (overlap < MEDIUM_CONFIDENCE_OVERLAP_THRESHOLD) {
    return { confidence: "medium", reason: "Weak keyword overlap with cited evidence." }
  }

  return { confidence: "high" }
}

// ── Public API ────────────────────────────────────────────────────────────────

export type ClaimInput = {
  text: string
  cited_evidence_id: string | null
}

/**
 * Validate a single claim against the provided evidence set.
 */
export function validateClaim(
  claim: ClaimInput,
  evidenceSet: GovernanceEvidence[]
): ClaimVerdict {
  const evidenceMap = new Map(evidenceSet.map((e) => [e.id, e]))

  let evidence = claim.cited_evidence_id
    ? evidenceMap.get(claim.cited_evidence_id) ?? null
    : null
  let inferredEvidenceReason: string | null = null

  if (!evidence) {
    const inferred = findBestEvidenceMatch(claim.text, evidenceSet)
    if (inferred) {
      evidence = inferred.evidence
      inferredEvidenceReason = claim.cited_evidence_id
        ? `Cited evidence ID was not found; claim matched evidence ${evidence.id} by content (${(inferred.overlap * 100).toFixed(0)}% keyword overlap).`
        : `No evidence ID cited; claim matched evidence ${evidence.id} by content (${(inferred.overlap * 100).toFixed(0)}% keyword overlap).`
    }
  }

  if (!evidence) {
    return {
      claim_text: claim.text,
      cited_evidence_id: claim.cited_evidence_id,
      evidence_exists: false,
      claim_grounded: false,
      metrics_traceable: false,
      confidence: claim.cited_evidence_id ? "fabricated" : "low",
      failure_reason: claim.cited_evidence_id
        ? "Cited evidence ID not found in evidence set."
        : "No evidence ID cited — cannot verify claim.",
    }
  }

  const groundedEvidence = evidence
  const claimKeywords = keywordsOf(claim.text)
  const evidenceText = buildEvidenceText(groundedEvidence)
  const evidenceKeywords = keywordsOf(evidenceText)

  const overlap = overlapRatio(claimKeywords, evidenceKeywords)
  const claimGrounded = overlap >= FABRICATION_OVERLAP_THRESHOLD

  // Metric traceability
  const claimNums = extractNumbers(claim.text)
  const evNums = evidenceNumbers(groundedEvidence)
  const hasMetrics = claimNums.length > 0
  const metricsTraceable =
    !hasMetrics ||
    claimNums.every((n) =>
      evNums.some((en) => {
        const ratio = Math.min(n, en) / Math.max(n, en)
        return ratio >= 0.85 // within 15% tolerance for rounding
      })
    )

  const { confidence, reason } = assessConfidence({
    evidenceExists: true,
    overlapRatio: overlap,
    metricsTraceable,
    hasMetrics,
  })

  return {
    claim_text: claim.text,
    cited_evidence_id: groundedEvidence.id,
    evidence_exists: true,
    claim_grounded: claimGrounded,
    metrics_traceable: metricsTraceable,
    confidence,
    ...(reason || inferredEvidenceReason
      ? { failure_reason: [inferredEvidenceReason, reason].filter(Boolean).join(" ") }
      : {}),
  }
}

/**
 * Validate all resume bullets and cover letter paragraphs.
 * Returns per-claim verdicts and a summary pass/fail.
 */
export function validateAllClaims(
  bullets: ClaimInput[],
  paragraphs: ClaimInput[],
  evidenceSet: GovernanceEvidence[]
): {
  bulletVerdicts: ClaimVerdict[]
  paragraphVerdicts: ClaimVerdict[]
  hasFabricated: boolean
  fabricatedCount: number
  lowConfidenceCount: number
} {
  const bulletVerdicts = bullets.map((b) => validateClaim(b, evidenceSet))
  const paragraphVerdicts = paragraphs.map((p) => validateClaim(p, evidenceSet))

  const all = [...bulletVerdicts, ...paragraphVerdicts]
  const hasFabricated = all.some((v) => v.confidence === "fabricated")
  const fabricatedCount = all.filter((v) => v.confidence === "fabricated").length
  const lowConfidenceCount = all.filter((v) => v.confidence === "low").length

  return {
    bulletVerdicts,
    paragraphVerdicts,
    hasFabricated,
    fabricatedCount,
    lowConfidenceCount,
  }
}
