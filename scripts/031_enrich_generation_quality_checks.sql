-- Migration: Enrich generation_quality_checks with provider/model metadata
-- Purpose: Close the gap identified in the Close-the-Gaps sprint (2026-05-08).
--          The generation_quality_checks table previously lacked fields to trace
--          which AI provider/model was used, which evidence IDs were used during
--          generation, and the overall quality score.
-- 
-- Safe to apply: All new columns are nullable with no NOT NULL constraint,
-- so existing rows are unaffected.

ALTER TABLE generation_quality_checks
  ADD COLUMN IF NOT EXISTS provider TEXT,
  ADD COLUMN IF NOT EXISTS generation_model TEXT,
  ADD COLUMN IF NOT EXISTS quality_check_model TEXT,
  ADD COLUMN IF NOT EXISTS evidence_ids_used JSONB,
  ADD COLUMN IF NOT EXISTS banned_phrases_found JSONB,
  ADD COLUMN IF NOT EXISTS unsafe_metrics_found JSONB,
  ADD COLUMN IF NOT EXISTS quality_score INTEGER;

-- Add a comment explaining the canonical model values
COMMENT ON COLUMN generation_quality_checks.provider IS
  'AI provider used for document generation (e.g. "anthropic")';

COMMENT ON COLUMN generation_quality_checks.generation_model IS
  'Model used for resume/cover letter generation (e.g. "claude-sonnet-4-20250514")';

COMMENT ON COLUMN generation_quality_checks.quality_check_model IS
  'Model used for the quality review pass (e.g. "claude-3-5-haiku-20241022")';

COMMENT ON COLUMN generation_quality_checks.evidence_ids_used IS
  'Array of evidence_library IDs used during document generation';

COMMENT ON COLUMN generation_quality_checks.banned_phrases_found IS
  'Banned phrases detected by TruthSerum rule-based scan';

COMMENT ON COLUMN generation_quality_checks.unsafe_metrics_found IS
  'Potentially invented metrics detected by quantification safety check';

COMMENT ON COLUMN generation_quality_checks.quality_score IS
  'Overall quality score 0-100 calculated from all checks';
