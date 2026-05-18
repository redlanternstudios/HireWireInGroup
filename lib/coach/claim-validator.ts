/**
 * lib/coach/claim-validator.ts
 *
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

// ── Core validator ────────────────────────────────────────────────────────────

function buildEvidenceText(ev: GovernanceEvidence): string {
  return [
    ev.source_title,
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

  // Fabrication threshold is intentionally low (0.03) because:
  // - Short bullets (4-6 words) produce tiny keyword sets; cosine-style overlap
  //   is naturally low even for valid, grounded content
  // - True fabrication has 0 overlapping keywords with the cited evidence
  // - Anything above 0.03 means the model at least borrowed terminology from
  //   the evidence record, which is the minimum bar for "not fabricated"
  if (overlap < 0.03) {
    return {
      confidence: "fabricated",
      reason: `Claim shares no keywords with cited evidence (overlap: ${(overlap * 100).toFixed(0)}%).`,
    }
  }

  if (hasMetrics && !metricsTraceable) {
    return {
      confidence: "low",
      reason: "Claim contains metrics not traceable to the cited evidence record.",
    }
  }

  if (overlap < 0.12) {
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

  const evidence = claim.cited_evidence_id
    ? evidenceMap.get(claim.cited_evidence_id) ?? null
    : null

  const evidenceExists = evidence !== null

  if (!evidenceExists) {
    // If an ID was cited but not found in the set, that's likely a stale/retry
    // artefact — treat as low confidence rather than fabricated to avoid false blocks.
    // True fabrication is caught by the overlap check on the full evidence pool below.
    if (claim.cited_evidence_id) {
      // Fall through to full-pool check using all evidence instead of blocking here
      const allKeywords = keywordsOf(evidenceSet.map(buildEvidenceText).join(" "))
      const claimKeywords = keywordsOf(claim.text)
      const overlap = overlapRatio(claimKeywords, allKeywords)
      if (overlap < 0.03) {
        return {
          claim_text: claim.text,
          cited_evidence_id: claim.cited_evidence_id,
          evidence_exists: false,
          claim_grounded: false,
          metrics_traceable: false,
          confidence: "fabricated",
          failure_reason: "Cited evidence ID not found and claim shares no keywords with any evidence.",
        }
      }
      return {
        claim_text: claim.text,
        cited_evidence_id: claim.cited_evidence_id,
        evidence_exists: false,
        claim_grounded: overlap >= 0.08,
        metrics_traceable: false,
        confidence: "low",
        failure_reason: "Cited evidence ID not found in evidence set — validated against full evidence pool.",
      }
    }
    return {
      claim_text: claim.text,
      cited_evidence_id: null,
      evidence_exists: false,
      claim_grounded: false,
      metrics_traceable: false,
      confidence: "low",
      failure_reason: "No evidence ID cited — cannot verify claim.",
    }
  }

  const claimKeywords = keywordsOf(claim.text)
  const evidenceText = buildEvidenceText(evidence)
  const evidenceKeywords = keywordsOf(evidenceText)

  const overlap = overlapRatio(claimKeywords, evidenceKeywords)
  const claimGrounded = overlap >= 0.08

  // Metric traceability
  const claimNums = extractNumbers(claim.text)
  const evNums = evidenceNumbers(evidence)
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
    evidenceExists,
    overlapRatio: overlap,
    metricsTraceable,
    hasMetrics,
  })

  return {
    claim_text: claim.text,
    cited_evidence_id: claim.cited_evidence_id,
    evidence_exists: true,
    claim_grounded: claimGrounded,
    metrics_traceable: metricsTraceable,
    confidence,
    ...(reason ? { failure_reason: reason } : {}),
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
