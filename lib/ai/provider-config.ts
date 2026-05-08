/**
 * Central AI provider configuration for HireWire
 *
 * Single source of truth for:
 * - Primary provider and model (Anthropic Claude via Vercel AI Gateway)
 * - Model names written to DB metadata
 * - Required environment variables
 * - Helper functions returning current model identity
 *
 * Usage rule: any code that writes model/provider metadata to the DB
 * MUST use the helpers here so DB claims match runtime truth.
 */

import { CLAUDE_MODELS } from "@/lib/adapters/anthropic"

export const AI_PROVIDER = {
  /**
   * Primary generation model - used for job analysis, resume, cover letter.
   * Anthropic Claude Sonnet via Vercel AI Gateway (zero-config, no explicit API key required).
   */
  primary: {
    provider: "anthropic",
    model: CLAUDE_MODELS.SONNET,
    /** Short model name for DB metadata (no provider prefix). */
    model_name_db: "claude-sonnet-4-20250514",
    provider_label: "anthropic",
  },

  /**
   * Quality-check model - faster/cheaper, used for TruthSerum quality reviews.
   */
  quality_check: {
    provider: "anthropic",
    model: CLAUDE_MODELS.HAIKU,
    model_name_db: "claude-3-5-haiku-20241022",
    provider_label: "anthropic",
  },

  /**
   * No active fallback provider.
   * If Vercel AI Gateway is unavailable, calls fail with a clear error.
   */
  fallback: null,
} as const

/**
 * Returns the model name to store in DB metadata when recording job analysis.
 * Example: job_analyses.analysis_model
 */
export function getAnalysisModelName(): string {
  return AI_PROVIDER.primary.model_name_db
}

/**
 * Returns the provider label to store in DB metadata.
 * Example: generation_quality_checks.provider
 */
export function getProviderLabel(): string {
  return AI_PROVIDER.primary.provider_label
}

/**
 * Returns the quality-check model name to store in DB metadata.
 * Example: generation_quality_checks.model_name
 */
export function getQualityCheckModelName(): string {
  return AI_PROVIDER.quality_check.model_name_db
}
