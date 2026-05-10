-- Migration: 031_create_coach_governance_tables.sql
-- Purpose: Add structured tables for the Coach Governance Layer.
-- These tables store per-generation governance runs, claim verdicts, and drift scores
-- so that every AI generation is auditable.
--
-- GOVERNANCE INVARIANT: A generation_governance_runs row must exist for every
-- document generation that reaches the persistence phase. If no row exists,
-- the generation was not governed.
--
-- Review this file before applying. Run in the Supabase SQL editor or via CLI:
--   supabase db push --db-url=<url>

-- ─── 1. governance_runs ──────────────────────────────────────────────────────
-- One row per document generation attempt.

CREATE TABLE IF NOT EXISTS generation_governance_runs (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  job_id              UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,

  -- Strategy decision
  strategy            TEXT NOT NULL
                        CHECK (strategy IN (
                          'full_match', 'strong_match', 'partial_match',
                          'honest_stretch', 'do_not_generate'
                        )),
  strategy_decision   JSONB NOT NULL DEFAULT '{}',  -- Full StrategyDecision object

  -- Claim validation summary
  bullet_verdicts     JSONB NOT NULL DEFAULT '[]',    -- ClaimVerdict[] for resume bullets
  paragraph_verdicts  JSONB NOT NULL DEFAULT '[]',    -- ClaimVerdict[] for cover letter paragraphs
  fabricated_count    INTEGER NOT NULL DEFAULT 0,
  low_confidence_count INTEGER NOT NULL DEFAULT 0,

  -- Drift scoring
  drift_score         INTEGER NOT NULL DEFAULT 0 CHECK (drift_score BETWEEN 0 AND 100),
  drift_is_blocking   BOOLEAN NOT NULL DEFAULT false,
  drift_flags         JSONB NOT NULL DEFAULT '[]',    -- DriftFlag[]
  drift_summary       TEXT,

  -- Overall governance result
  governance_passed   BOOLEAN NOT NULL DEFAULT false,
  failed_at_phase     TEXT
                        CHECK (failed_at_phase IS NULL OR failed_at_phase IN (
                          'pre_flight', 'evidence_mapping', 'strategy_selection',
                          'resume_generation', 'cover_generation', 'claim_validation',
                          'drift_scoring', 'quality_check', 'persistence'
                        )),

  -- Metadata
  governance_version  TEXT NOT NULL DEFAULT '1.0.0',
  evaluated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for querying by job
CREATE INDEX IF NOT EXISTS idx_governance_runs_job_id
  ON generation_governance_runs (job_id);

-- Index for querying by user
CREATE INDEX IF NOT EXISTS idx_governance_runs_user_id
  ON generation_governance_runs (user_id);

-- Index for finding blocked generations
CREATE INDEX IF NOT EXISTS idx_governance_runs_blocked
  ON generation_governance_runs (governance_passed, drift_is_blocking)
  WHERE governance_passed = false OR drift_is_blocking = true;


-- ─── 2. governance_claim_verdicts ────────────────────────────────────────────
-- Optionally store individual claim verdicts as rows for deeper querying.
-- This is supplemental to the JSONB column above — use it for analytics.

CREATE TABLE IF NOT EXISTS governance_claim_verdicts (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id              UUID NOT NULL REFERENCES generation_governance_runs(id) ON DELETE CASCADE,
  user_id             UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  job_id              UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,

  document_type       TEXT NOT NULL CHECK (document_type IN ('resume', 'cover_letter')),
  claim_text          TEXT NOT NULL,
  cited_evidence_id   UUID REFERENCES evidence_library(id) ON DELETE SET NULL,
  evidence_exists     BOOLEAN NOT NULL DEFAULT false,
  claim_grounded      BOOLEAN NOT NULL DEFAULT false,
  metrics_traceable   BOOLEAN NOT NULL DEFAULT true,
  confidence          TEXT NOT NULL CHECK (confidence IN ('high', 'medium', 'low', 'fabricated')),
  failure_reason      TEXT,

  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_claim_verdicts_run_id
  ON governance_claim_verdicts (run_id);

CREATE INDEX IF NOT EXISTS idx_claim_verdicts_fabricated
  ON governance_claim_verdicts (confidence, job_id)
  WHERE confidence = 'fabricated';


-- ─── 3. Row Level Security ───────────────────────────────────────────────────
-- Users may only read their own governance runs and verdicts.
-- No user may insert/update/delete — all writes are server-side only.

ALTER TABLE generation_governance_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE governance_claim_verdicts  ENABLE ROW LEVEL SECURITY;

-- Read: users see only their own rows
CREATE POLICY "Users can read own governance runs"
  ON generation_governance_runs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can read own claim verdicts"
  ON governance_claim_verdicts FOR SELECT
  USING (auth.uid() = user_id);

-- Insert: service role only (no direct user inserts)
CREATE POLICY "Service role inserts governance runs"
  ON generation_governance_runs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Service role inserts claim verdicts"
  ON governance_claim_verdicts FOR INSERT
  WITH CHECK (auth.uid() = user_id);


-- ─── 4. Add governance columns to jobs ───────────────────────────────────────
-- Add a lightweight governance summary directly on the jobs table for fast
-- status checks without a join.

ALTER TABLE jobs
  ADD COLUMN IF NOT EXISTS governance_version    TEXT,
  ADD COLUMN IF NOT EXISTS governance_passed     BOOLEAN,
  ADD COLUMN IF NOT EXISTS governance_drift_score INTEGER,
  ADD COLUMN IF NOT EXISTS last_governance_run_id UUID
    REFERENCES generation_governance_runs(id) ON DELETE SET NULL;


-- ─── 5. Comments ─────────────────────────────────────────────────────────────

COMMENT ON TABLE generation_governance_runs IS
  'One row per AI document generation attempt. Records strategy, claim verdicts, and drift score. Required for auditability.';

COMMENT ON TABLE governance_claim_verdicts IS
  'Per-claim breakdown of generation governance. Supplemental to the JSONB columns in generation_governance_runs.';

COMMENT ON COLUMN generation_governance_runs.drift_score IS
  '0 = perfect evidence fidelity, 100 = entirely fabricated. Score >= 40 blocks persistence.';

COMMENT ON COLUMN generation_governance_runs.governance_version IS
  'Version of lib/coach governance rules active at generation time. See docs/COACH_CONSTITUTION.md.';
