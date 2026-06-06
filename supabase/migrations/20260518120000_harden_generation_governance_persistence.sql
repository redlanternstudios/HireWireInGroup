-- Harden generation governance persistence after Build Day 17.
-- Safe to re-run. Ensures jobs, governance runs, and claim verdicts stay in sync.

ALTER TABLE public.jobs
  ADD COLUMN IF NOT EXISTS governance_version text,
  ADD COLUMN IF NOT EXISTS governance_passed boolean,
  ADD COLUMN IF NOT EXISTS governance_drift_score integer,
  ADD COLUMN IF NOT EXISTS last_governance_run_id uuid;

CREATE TABLE IF NOT EXISTS public.generation_governance_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  job_id uuid NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  strategy text NOT NULL,
  strategy_decision jsonb NOT NULL DEFAULT '{}'::jsonb,
  bullet_verdicts jsonb NOT NULL DEFAULT '[]'::jsonb,
  paragraph_verdicts jsonb NOT NULL DEFAULT '[]'::jsonb,
  fabricated_count integer NOT NULL DEFAULT 0,
  low_confidence_count integer NOT NULL DEFAULT 0,
  drift_score integer NOT NULL DEFAULT 0 CHECK (drift_score BETWEEN 0 AND 100),
  drift_is_blocking boolean NOT NULL DEFAULT false,
  drift_flags jsonb NOT NULL DEFAULT '[]'::jsonb,
  drift_summary text,
  governance_passed boolean NOT NULL DEFAULT false,
  failed_at_phase text,
  governance_version text NOT NULL DEFAULT '1.0.0',
  evaluated_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.generation_governance_runs
  DROP CONSTRAINT IF EXISTS generation_governance_runs_strategy_check;
ALTER TABLE public.generation_governance_runs
  ADD CONSTRAINT generation_governance_runs_strategy_check
  CHECK (
    strategy IN (
      'direct_match','adjacent_transition','stretch_honest',
      'full_match','strong_match','partial_match','honest_stretch',
      'do_not_generate'
    )
  );

ALTER TABLE public.generation_governance_runs
  DROP CONSTRAINT IF EXISTS generation_governance_runs_failed_at_phase_check;
ALTER TABLE public.generation_governance_runs
  ADD CONSTRAINT generation_governance_runs_failed_at_phase_check
  CHECK (
    failed_at_phase IS NULL OR failed_at_phase IN (
      'pre_flight','evidence_mapping','strategy_selection',
      'resume_generation','cover_generation','claim_validation',
      'drift_scoring','quality_check','persistence'
    )
  );

ALTER TABLE public.jobs
  DROP CONSTRAINT IF EXISTS jobs_last_governance_run_id_fkey;
ALTER TABLE public.jobs
  ADD CONSTRAINT jobs_last_governance_run_id_fkey
  FOREIGN KEY (last_governance_run_id)
  REFERENCES public.generation_governance_runs(id)
  ON DELETE SET NULL;

CREATE TABLE IF NOT EXISTS public.governance_claim_verdicts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id uuid NOT NULL REFERENCES public.generation_governance_runs(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  job_id uuid NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  document_type text NOT NULL CHECK (document_type IN ('resume', 'cover_letter')),
  claim_text text NOT NULL,
  cited_evidence_id uuid REFERENCES public.evidence_library(id) ON DELETE SET NULL,
  evidence_exists boolean NOT NULL DEFAULT false,
  claim_grounded boolean NOT NULL DEFAULT false,
  metrics_traceable boolean NOT NULL DEFAULT true,
  confidence text NOT NULL CHECK (confidence IN ('high', 'medium', 'low', 'fabricated')),
  failure_reason text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_governance_runs_job_id
  ON public.generation_governance_runs (job_id);
CREATE INDEX IF NOT EXISTS idx_governance_runs_user_id
  ON public.generation_governance_runs (user_id);
CREATE INDEX IF NOT EXISTS idx_governance_runs_blocked
  ON public.generation_governance_runs (governance_passed, drift_is_blocking)
  WHERE governance_passed = false OR drift_is_blocking = true;
CREATE INDEX IF NOT EXISTS idx_governance_runs_created_at
  ON public.generation_governance_runs (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_claim_verdicts_run_id
  ON public.governance_claim_verdicts (run_id);
CREATE INDEX IF NOT EXISTS idx_claim_verdicts_job_document
  ON public.governance_claim_verdicts (job_id, document_type);
CREATE INDEX IF NOT EXISTS idx_claim_verdicts_fabricated
  ON public.governance_claim_verdicts (confidence, job_id)
  WHERE confidence = 'fabricated';

ALTER TABLE public.generation_governance_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.governance_claim_verdicts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own governance runs" ON public.generation_governance_runs;
CREATE POLICY "Users can read own governance runs"
  ON public.generation_governance_runs FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own governance runs" ON public.generation_governance_runs;
CREATE POLICY "Users can insert own governance runs"
  ON public.generation_governance_runs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can read own claim verdicts" ON public.governance_claim_verdicts;
CREATE POLICY "Users can read own claim verdicts"
  ON public.governance_claim_verdicts FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own claim verdicts" ON public.governance_claim_verdicts;
CREATE POLICY "Users can insert own claim verdicts"
  ON public.governance_claim_verdicts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

WITH latest_governance_run AS (
  SELECT DISTINCT ON (job_id)
    id,
    job_id,
    governance_passed,
    drift_score,
    governance_version
  FROM public.generation_governance_runs
  ORDER BY job_id, created_at DESC
)
UPDATE public.jobs j
SET
  last_governance_run_id = l.id,
  governance_passed = l.governance_passed,
  governance_drift_score = l.drift_score,
  governance_version = l.governance_version
FROM latest_governance_run l
WHERE j.id = l.job_id
  AND (
    j.last_governance_run_id IS DISTINCT FROM l.id OR
    j.governance_passed IS DISTINCT FROM l.governance_passed OR
    j.governance_drift_score IS DISTINCT FROM l.drift_score OR
    j.governance_version IS DISTINCT FROM l.governance_version
  );

COMMENT ON COLUMN public.jobs.last_governance_run_id IS
  'Latest generation_governance_runs row for this job.';
COMMENT ON COLUMN public.jobs.governance_drift_score IS
  'Latest generation governance drift score. Score >= 65 blocks document persistence.';
COMMENT ON TABLE public.governance_claim_verdicts IS
  'One row per generated resume bullet or cover letter paragraph verdict, linked to a governance run.';

NOTIFY pgrst, 'reload schema';
