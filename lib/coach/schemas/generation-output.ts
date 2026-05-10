/**
 * lib/coach/schemas/generation-output.ts
 *
 * Zod schemas for governance-layer structured outputs.
 * These are used for DB persistence and API response validation —
 * NOT for AI structured output (those live in lib/ai/schemas/).
 */

import { z } from "zod"

// ── Claim Verdict Schema ──────────────────────────────────────────────────────

export const ClaimVerdictSchema = z.object({
  claim_text: z.string(),
  cited_evidence_id: z.string().nullable(),
  evidence_exists: z.boolean(),
  claim_grounded: z.boolean(),
  metrics_traceable: z.boolean(),
  confidence: z.enum(["high", "medium", "low", "fabricated"]),
  failure_reason: z.string().optional(),
})

// ── Drift Flag Schema ─────────────────────────────────────────────────────────

export const DriftFlagSchema = z.object({
  category: z.enum([
    "metric_inflation",
    "scope_expansion",
    "title_promotion",
    "timeline_mismatch",
    "fabricated_outcome",
    "unsupported_tool",
    "banned_phrase",
  ]),
  description: z.string(),
  claim_text: z.string(),
  evidence_id: z.string().nullable(),
  severity: z.enum(["warning", "block"]),
})

export const DriftScoreSchema = z.object({
  score: z.number().min(0).max(100),
  is_blocking: z.boolean(),
  flags: z.array(DriftFlagSchema),
  summary: z.string(),
})

// ── Strategy Decision Schema ──────────────────────────────────────────────────

export const StrategyDecisionSchema = z.object({
  strategy: z.enum([
    "full_match",
    "strong_match",
    "partial_match",
    "honest_stretch",
    "do_not_generate",
  ]),
  requirement_coverage: z.number(),
  evidence_quality_pct: z.number(),
  reasoning: z.string(),
  block_reason: z.string().optional(),
})

// ── Governance Envelope Schema ────────────────────────────────────────────────

export const GovernanceResultSchema = z.object({
  passed: z.boolean(),
  failed_at: z
    .enum([
      "pre_flight",
      "evidence_mapping",
      "strategy_selection",
      "resume_generation",
      "cover_generation",
      "claim_validation",
      "drift_scoring",
      "quality_check",
      "persistence",
    ])
    .optional(),
  bullet_verdicts: z.array(ClaimVerdictSchema),
  paragraph_verdicts: z.array(ClaimVerdictSchema),
  drift: DriftScoreSchema,
  strategy: StrategyDecisionSchema,
  evaluated_at: z.string(),
  governance_version: z.string(),
})

export type GovernanceResultOutput = z.infer<typeof GovernanceResultSchema>
