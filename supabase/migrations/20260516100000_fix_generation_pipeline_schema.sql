-- HireWire generation pipeline schema convergence
-- Safe to re-run. Brings Supabase in line with app/api/generate-documents/route.ts.

-- Jobs: generation lifecycle, document output, quality, provenance, governance, voice integrity.
ALTER TABLE public.jobs
  ADD COLUMN IF NOT EXISTS generation_status text DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS generation_error text,
  ADD COLUMN IF NOT EXISTS generation_attempts integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_generation_at timestamptz,
  ADD COLUMN IF NOT EXISTS location text,
  ADD COLUMN IF NOT EXISTS ats_keywords text[] DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS generated_resume text,
  ADD COLUMN IF NOT EXISTS generated_cover_letter text,
  ADD COLUMN IF NOT EXISTS fit text,
  ADD COLUMN IF NOT EXISTS score numeric(5,2),
  ADD COLUMN IF NOT EXISTS score_reasoning jsonb,
  ADD COLUMN IF NOT EXISTS score_strengths text[],
  ADD COLUMN IF NOT EXISTS score_gaps text[],
  ADD COLUMN IF NOT EXISTS resume_strategy text,
  ADD COLUMN IF NOT EXISTS evidence_map jsonb,
  ADD COLUMN IF NOT EXISTS evidence_map_version text,
  ADD COLUMN IF NOT EXISTS resume_provenance jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS scored_at timestamptz,
  ADD COLUMN IF NOT EXISTS generation_timestamp timestamptz,
  ADD COLUMN IF NOT EXISTS generation_quality_score integer,
  ADD COLUMN IF NOT EXISTS generation_quality_issues text[],
  ADD COLUMN IF NOT EXISTS quality_passed boolean,
  ADD COLUMN IF NOT EXISTS resume_format text,
  ADD COLUMN IF NOT EXISTS resume_font text,
  ADD COLUMN IF NOT EXISTS format_recommendation_reason text,
  ADD COLUMN IF NOT EXISTS voice_mode text,
  ADD COLUMN IF NOT EXISTS voice_profile_snapshot jsonb,
  ADD COLUMN IF NOT EXISTS voice_drift_result jsonb,
  ADD COLUMN IF NOT EXISTS voice_integrity_passed boolean,
  ADD COLUMN IF NOT EXISTS voice_review_status text DEFAULT 'needs_review',
  ADD COLUMN IF NOT EXISTS governance_version text,
  ADD COLUMN IF NOT EXISTS governance_passed boolean,
  ADD COLUMN IF NOT EXISTS governance_drift_score integer;

alter table public.jobs
  alter column score type numeric(5,2) using round(score::numeric, 2);

alter table public.job_scores
  alter column overall_score type numeric(5,2) using round(overall_score::numeric, 2);

-- Keep job status writes from failing when generation moves between canonical stages.
ALTER TABLE public.jobs DROP CONSTRAINT IF EXISTS jobs_status_check;
ALTER TABLE public.jobs DROP CONSTRAINT IF EXISTS jobs_status_canonical;
ALTER TABLE public.jobs
  ADD CONSTRAINT jobs_status_canonical
  CHECK (
    status IS NULL OR status IN (
      'draft','queued','analyzing','analyzed','generating','ready',
      'applied','interviewing','offered','rejected','archived',
      'needs_review','error'
    )
  );

CREATE INDEX IF NOT EXISTS idx_jobs_generation_status
  ON public.jobs (generation_status);

-- Evidence fields required by generation governance drift and claim validation.
ALTER TABLE public.evidence_library
  ADD COLUMN IF NOT EXISTS team_size integer,
  ADD COLUMN IF NOT EXISTS budget_scope text,
  ADD COLUMN IF NOT EXISTS user_impact_scale text,
  ADD COLUMN IF NOT EXISTS what_not_to_overstate text;

-- Governance audit tables.
CREATE TABLE IF NOT EXISTS public.generation_governance_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  job_id uuid NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  strategy text NOT NULL CHECK (
    strategy IN (
      'direct_match','adjacent_transition','stretch_honest',
      'full_match','strong_match','partial_match','honest_stretch',
      'do_not_generate'
    )
  ),
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
  failed_at_phase text CHECK (
    failed_at_phase IS NULL OR failed_at_phase IN (
      'pre_flight','evidence_mapping','strategy_selection',
      'resume_generation','cover_generation','claim_validation',
      'drift_scoring','quality_check','persistence'
    )
  ),
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

CREATE INDEX IF NOT EXISTS idx_governance_runs_job_id
  ON public.generation_governance_runs (job_id);
CREATE INDEX IF NOT EXISTS idx_governance_runs_user_id
  ON public.generation_governance_runs (user_id);
CREATE INDEX IF NOT EXISTS idx_governance_runs_blocked
  ON public.generation_governance_runs (governance_passed, drift_is_blocking)
  WHERE governance_passed = false OR drift_is_blocking = true;

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

CREATE INDEX IF NOT EXISTS idx_claim_verdicts_run_id
  ON public.governance_claim_verdicts (run_id);
CREATE INDEX IF NOT EXISTS idx_claim_verdicts_fabricated
  ON public.governance_claim_verdicts (confidence, job_id)
  WHERE confidence = 'fabricated';

ALTER TABLE public.jobs
  ADD COLUMN IF NOT EXISTS last_governance_run_id uuid
    REFERENCES public.generation_governance_runs(id) ON DELETE SET NULL;

-- Quality checks table expected by generate-documents.
CREATE TABLE IF NOT EXISTS public.generation_quality_checks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  job_id uuid NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  document_type text NOT NULL CHECK (document_type IN ('resume', 'cover_letter')),
  invented_claims_found text[],
  vague_bullets_found text[],
  ai_filler_found text[],
  repeated_structures_found text[],
  weak_summaries_found text[],
  generic_buzzwords_found text[],
  unsupported_claims_found text[],
  passed boolean NOT NULL,
  issues_count integer DEFAULT 0,
  regeneration_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.generation_quality_checks
  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS unsupported_claims_found text[];

CREATE INDEX IF NOT EXISTS idx_quality_checks_job_id
  ON public.generation_quality_checks (job_id);
CREATE INDEX IF NOT EXISTS idx_quality_checks_user_id
  ON public.generation_quality_checks (user_id);

-- RLS: users can read their own audit rows; authenticated app requests may insert own rows.
ALTER TABLE public.generation_governance_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.governance_claim_verdicts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.generation_quality_checks ENABLE ROW LEVEL SECURITY;

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

DROP POLICY IF EXISTS "quality_checks_select_own" ON public.generation_quality_checks;
CREATE POLICY "quality_checks_select_own"
  ON public.generation_quality_checks FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "quality_checks_insert_own" ON public.generation_quality_checks;
CREATE POLICY "quality_checks_insert_own"
  ON public.generation_quality_checks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

COMMENT ON TABLE public.generation_governance_runs IS
  'One row per AI document generation attempt. Records strategy, claim verdicts, and drift score.';
COMMENT ON COLUMN public.generation_governance_runs.drift_score IS
  '0 = perfect evidence fidelity, 100 = entirely fabricated. Score >= 65 blocks persistence.';

NOTIFY pgrst, 'reload schema';
