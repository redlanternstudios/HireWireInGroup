/**
 * lib/coach/generation-strategy.ts
 *
 * Canonical strategy resolver for the HireWire generation pipeline.
 *
 * This module is the SINGLE SOURCE OF TRUTH for the strategy decision.
 * The existing `determineGenerationStrategy` in the generate-documents
 * route calls into this after the evidence map is built.
 *
 * Strategy tiers:
 *   full_match      ≥80% required qualifications covered + evidence quality ≥70%
 *   strong_match    65–79% covered OR coverage ≥80% but evidence quality 40–69%
 *   partial_match   40–64% covered
 *   honest_stretch  <40% covered
 *   do_not_generate direct fabrication risk detected
 *
 * GOVERNANCE INVARIANT: Low evidence coverage is a user-facing warning, not an
 * algorithmic veto. Direct fabrication risk remains a hard safety block.
 */

import type { StrategyDecision, GenerationStrategy } from "./types"

// ── Thresholds ────────────────────────────────────────────────────────────────

const THRESHOLDS = {
  FULL_MATCH_COVERAGE: 80,
  FULL_MATCH_QUALITY: 70,
  STRONG_MATCH_COVERAGE: 65,
  PARTIAL_MATCH_COVERAGE: 40,
  HONEST_STRETCH_COVERAGE: 25,
} as const

// ── Strategy prompt fragments (used by the generation route) ──────────────────

export const STRATEGY_PROMPT_FRAGMENTS: Record<GenerationStrategy, string> = {
  full_match: `
STRATEGY: FULL MATCH
The candidate is a strong match for this role. Write with confidence.
- Use achievement-focused language grounded in the evidence
- Include all relevant metrics from the evidence
- Lead with the candidate's strongest differentiators
`.trim(),

  strong_match: `
STRATEGY: STRONG MATCH
The candidate has solid relevant experience. Write with confidence but acknowledge where gaps exist.
- Highlight strengths clearly
- For any gap areas, use transferable experience honestly
- Do not invent qualifications
`.trim(),

  partial_match: `
STRATEGY: PARTIAL MATCH
The candidate meets some requirements. Be honest about transferable skills.
- Focus on genuine strengths
- Do not stretch claims beyond what evidence supports
- Address gaps via transferable experience, not fabrication
- If using adjacent experience, say "related experience in X" not "direct experience"
`.trim(),

  honest_stretch: `
STRATEGY: HONEST STRETCH
The candidate is stretching for this role. Be transparent.
- Lead with genuine strengths
- Frame transferable skills explicitly as "adjacent" or "related"
- Do NOT imply direct experience the evidence doesn't support
- The cover letter should acknowledge the growth opportunity honestly
`.trim(),

  do_not_generate: `
STRATEGY: DO NOT GENERATE
This generation is blocked because direct fabrication risk was detected.
`.trim(),
}

// ── Resolver ──────────────────────────────────────────────────────────────────

export function resolveStrategy(params: {
  requirementCoverage: number
  evidenceQualityPct: number
  hasDirectFabricationRisk?: boolean
}): StrategyDecision {
  const { requirementCoverage, evidenceQualityPct, hasDirectFabricationRisk = false } = params

  // Hard block: direct fabrication risk detected pre-generation
  if (hasDirectFabricationRisk) {
    return {
      strategy: "do_not_generate",
      requirement_coverage: requirementCoverage,
      evidence_quality_pct: evidenceQualityPct,
      reasoning:
        "Fabrication risk detected — evidence cannot support the required claims for this role.",
      block_reason:
        "Generation blocked: evidence set cannot support this role's required claims without fabrication.",
    }
  }

  // Very low coverage is an honest-stretch warning, not a qualification veto.
  if (requirementCoverage < THRESHOLDS.HONEST_STRETCH_COVERAGE) {
    return {
      strategy: "honest_stretch",
      requirement_coverage: requirementCoverage,
      evidence_quality_pct: evidenceQualityPct,
      reasoning: `Requirement coverage (${requirementCoverage}%) is very low. Continue only with conservative, evidence-only positioning after user acknowledgment.`,
    }
  }

  // Honest stretch
  if (requirementCoverage < THRESHOLDS.PARTIAL_MATCH_COVERAGE) {
    return {
      strategy: "honest_stretch",
      requirement_coverage: requirementCoverage,
      evidence_quality_pct: evidenceQualityPct,
      reasoning: `Coverage ${requirementCoverage}% — honest stretch. Transferable framing required.`,
    }
  }

  // Partial match
  if (requirementCoverage < THRESHOLDS.STRONG_MATCH_COVERAGE) {
    return {
      strategy: "partial_match",
      requirement_coverage: requirementCoverage,
      evidence_quality_pct: evidenceQualityPct,
      reasoning: `Coverage ${requirementCoverage}% — partial match. Gaps must be addressed honestly.`,
    }
  }

  // Full match: both coverage and quality meet the bar
  if (
    requirementCoverage >= THRESHOLDS.FULL_MATCH_COVERAGE &&
    evidenceQualityPct >= THRESHOLDS.FULL_MATCH_QUALITY
  ) {
    return {
      strategy: "full_match",
      requirement_coverage: requirementCoverage,
      evidence_quality_pct: evidenceQualityPct,
      reasoning: `Coverage ${requirementCoverage}% with ${evidenceQualityPct}% high-confidence evidence — full match.`,
    }
  }

  // Strong match: coverage is there but quality or coverage isn't quite full
  return {
    strategy: "strong_match",
    requirement_coverage: requirementCoverage,
    evidence_quality_pct: evidenceQualityPct,
    reasoning: `Coverage ${requirementCoverage}% — strong match. Write with confidence; use evidence carefully.`,
  }
}

// ── Strategy prompt builder ───────────────────────────────────────────────────

export function buildStrategyPromptFragment(strategy: GenerationStrategy): string {
  return STRATEGY_PROMPT_FRAGMENTS[strategy]
}
