-- Canonical backfill for drifted production tables.
-- The audit found evidence_library and job_scores were present in production
-- but lacked CREATE TABLE migrations in supabase/migrations.

CREATE TABLE IF NOT EXISTS public.evidence_library (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  source_type text NOT NULL DEFAULT 'achievement',
  source_title text NOT NULL DEFAULT '',
  title text,
  content text,
  source_url text,
  source_resume_id uuid,
  project_name text,
  role_name text,
  company_name text,
  date_range text,
  responsibilities text[] NOT NULL DEFAULT '{}'::text[],
  tools_used text[] NOT NULL DEFAULT '{}'::text[],
  systems_used text[] NOT NULL DEFAULT '{}'::text[],
  workflows_created text[] NOT NULL DEFAULT '{}'::text[],
  industries text[] NOT NULL DEFAULT '{}'::text[],
  outcomes text[] NOT NULL DEFAULT '{}'::text[],
  proof_snippet text,
  approved_keywords text[] NOT NULL DEFAULT '{}'::text[],
  approved_achievement_bullets text[] NOT NULL DEFAULT '{}'::text[],
  role_family_tags text[] NOT NULL DEFAULT '{}'::text[],
  user_problem text,
  business_goal text,
  what_shipped text,
  what_visible text,
  what_not_to_overstate text,
  team_size integer,
  budget_scope text,
  user_impact_scale text,
  confidence_level text NOT NULL DEFAULT 'medium'
    CHECK (confidence_level IN ('high', 'medium', 'low')),
  confidence_score numeric(5,2),
  evidence_weight text NOT NULL DEFAULT 'medium',
  is_user_approved boolean NOT NULL DEFAULT false,
  visibility_status text NOT NULL DEFAULT 'active'
    CHECK (visibility_status IN ('active', 'hidden', 'archived')),
  normalized_keywords text[] NOT NULL DEFAULT '{}'::text[],
  canonical_domains text[] NOT NULL DEFAULT '{}'::text[],
  source_profile_field text,
  is_active boolean NOT NULL DEFAULT true,
  priority_rank integer NOT NULL DEFAULT 0,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.evidence_library ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.evidence_library ADD COLUMN IF NOT EXISTS source_type text NOT NULL DEFAULT 'achievement';
ALTER TABLE public.evidence_library ADD COLUMN IF NOT EXISTS source_title text NOT NULL DEFAULT '';
ALTER TABLE public.evidence_library ADD COLUMN IF NOT EXISTS title text;
ALTER TABLE public.evidence_library ADD COLUMN IF NOT EXISTS content text;
ALTER TABLE public.evidence_library ADD COLUMN IF NOT EXISTS source_url text;
ALTER TABLE public.evidence_library ADD COLUMN IF NOT EXISTS source_resume_id uuid;
ALTER TABLE public.evidence_library ADD COLUMN IF NOT EXISTS project_name text;
ALTER TABLE public.evidence_library ADD COLUMN IF NOT EXISTS role_name text;
ALTER TABLE public.evidence_library ADD COLUMN IF NOT EXISTS company_name text;
ALTER TABLE public.evidence_library ADD COLUMN IF NOT EXISTS date_range text;
ALTER TABLE public.evidence_library ADD COLUMN IF NOT EXISTS responsibilities text[] NOT NULL DEFAULT '{}'::text[];
ALTER TABLE public.evidence_library ADD COLUMN IF NOT EXISTS tools_used text[] NOT NULL DEFAULT '{}'::text[];
ALTER TABLE public.evidence_library ADD COLUMN IF NOT EXISTS systems_used text[] NOT NULL DEFAULT '{}'::text[];
ALTER TABLE public.evidence_library ADD COLUMN IF NOT EXISTS workflows_created text[] NOT NULL DEFAULT '{}'::text[];
ALTER TABLE public.evidence_library ADD COLUMN IF NOT EXISTS industries text[] NOT NULL DEFAULT '{}'::text[];
ALTER TABLE public.evidence_library ADD COLUMN IF NOT EXISTS outcomes text[] NOT NULL DEFAULT '{}'::text[];
ALTER TABLE public.evidence_library ADD COLUMN IF NOT EXISTS proof_snippet text;
ALTER TABLE public.evidence_library ADD COLUMN IF NOT EXISTS approved_keywords text[] NOT NULL DEFAULT '{}'::text[];
ALTER TABLE public.evidence_library ADD COLUMN IF NOT EXISTS approved_achievement_bullets text[] NOT NULL DEFAULT '{}'::text[];
ALTER TABLE public.evidence_library ADD COLUMN IF NOT EXISTS role_family_tags text[] NOT NULL DEFAULT '{}'::text[];
ALTER TABLE public.evidence_library ADD COLUMN IF NOT EXISTS user_problem text;
ALTER TABLE public.evidence_library ADD COLUMN IF NOT EXISTS business_goal text;
ALTER TABLE public.evidence_library ADD COLUMN IF NOT EXISTS what_shipped text;
ALTER TABLE public.evidence_library ADD COLUMN IF NOT EXISTS what_visible text;
ALTER TABLE public.evidence_library ADD COLUMN IF NOT EXISTS what_not_to_overstate text;
ALTER TABLE public.evidence_library ADD COLUMN IF NOT EXISTS team_size integer;
ALTER TABLE public.evidence_library ADD COLUMN IF NOT EXISTS budget_scope text;
ALTER TABLE public.evidence_library ADD COLUMN IF NOT EXISTS user_impact_scale text;
ALTER TABLE public.evidence_library ADD COLUMN IF NOT EXISTS confidence_level text NOT NULL DEFAULT 'medium';
ALTER TABLE public.evidence_library ADD COLUMN IF NOT EXISTS confidence_score numeric(5,2);
ALTER TABLE public.evidence_library ADD COLUMN IF NOT EXISTS evidence_weight text NOT NULL DEFAULT 'medium';
ALTER TABLE public.evidence_library ADD COLUMN IF NOT EXISTS is_user_approved boolean NOT NULL DEFAULT false;
ALTER TABLE public.evidence_library ADD COLUMN IF NOT EXISTS visibility_status text NOT NULL DEFAULT 'active';
ALTER TABLE public.evidence_library ADD COLUMN IF NOT EXISTS normalized_keywords text[] NOT NULL DEFAULT '{}'::text[];
ALTER TABLE public.evidence_library ADD COLUMN IF NOT EXISTS canonical_domains text[] NOT NULL DEFAULT '{}'::text[];
ALTER TABLE public.evidence_library ADD COLUMN IF NOT EXISTS source_profile_field text;
ALTER TABLE public.evidence_library ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true;
ALTER TABLE public.evidence_library ADD COLUMN IF NOT EXISTS priority_rank integer NOT NULL DEFAULT 0;
ALTER TABLE public.evidence_library ADD COLUMN IF NOT EXISTS metadata jsonb NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE public.evidence_library ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now();
ALTER TABLE public.evidence_library ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

DO $$
DECLARE
  constraint_name text;
BEGIN
  SELECT conname INTO constraint_name
  FROM pg_constraint
  WHERE conrelid = 'public.evidence_library'::regclass
    AND conname = 'evidence_library_source_type_check';

  IF constraint_name IS NOT NULL THEN
    EXECUTE format('ALTER TABLE public.evidence_library DROP CONSTRAINT %I', constraint_name);
  END IF;
END $$;

ALTER TABLE public.evidence_library
  ADD CONSTRAINT evidence_library_source_type_check
  CHECK (source_type IN (
    'work_experience',
    'project',
    'portfolio_entry',
    'shipped_product',
    'live_site',
    'achievement',
    'certification',
    'publication',
    'open_source',
    'education',
    'skill',
    'resume',
    'linkedin',
    'github',
    'language',
    'award',
    'volunteer',
    'military',
    'website',
    'manual',
    'user_input',
    'ai_inferred',
    'evidence_packet',
    'coach_confirmed'
  ));

CREATE INDEX IF NOT EXISTS idx_evidence_library_user_id ON public.evidence_library(user_id);
CREATE INDEX IF NOT EXISTS idx_evidence_library_source_type ON public.evidence_library(source_type);
CREATE INDEX IF NOT EXISTS idx_evidence_library_active ON public.evidence_library(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_evidence_library_tools ON public.evidence_library USING gin (tools_used);
CREATE INDEX IF NOT EXISTS idx_evidence_library_industries ON public.evidence_library USING gin (industries);
CREATE INDEX IF NOT EXISTS idx_evidence_library_role_families ON public.evidence_library USING gin (role_family_tags);
CREATE INDEX IF NOT EXISTS idx_evidence_library_normalized_keywords ON public.evidence_library USING gin (normalized_keywords);
CREATE INDEX IF NOT EXISTS idx_evidence_library_canonical_domains ON public.evidence_library USING gin (canonical_domains);

ALTER TABLE public.evidence_library ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "evidence_select_own" ON public.evidence_library;
CREATE POLICY "evidence_select_own"
  ON public.evidence_library FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "evidence_insert_own" ON public.evidence_library;
CREATE POLICY "evidence_insert_own"
  ON public.evidence_library FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "evidence_update_own" ON public.evidence_library;
CREATE POLICY "evidence_update_own"
  ON public.evidence_library FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "evidence_delete_own" ON public.evidence_library;
CREATE POLICY "evidence_delete_own"
  ON public.evidence_library FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "evidence_service_all" ON public.evidence_library;
CREATE POLICY "evidence_service_all"
  ON public.evidence_library FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE TABLE IF NOT EXISTS public.job_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  overall_score numeric(5,2) NOT NULL,
  skills_match numeric(5,2) NOT NULL DEFAULT 0,
  experience_relevance numeric(5,2) NOT NULL DEFAULT 0,
  evidence_quality numeric(5,2) NOT NULL DEFAULT 0,
  seniority_alignment numeric(5,2) NOT NULL DEFAULT 0,
  ats_keywords numeric(5,2) NOT NULL DEFAULT 0,
  confidence_score numeric(5,2) NOT NULL DEFAULT 0,
  scoring_version text NOT NULL,
  score_reasoning jsonb NOT NULL DEFAULT '{}'::jsonb,
  strengths text[] NOT NULL DEFAULT '{}'::text[],
  gaps text[] NOT NULL DEFAULT '{}'::text[],
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.job_scores ADD COLUMN IF NOT EXISTS id uuid DEFAULT gen_random_uuid();
ALTER TABLE public.job_scores ADD COLUMN IF NOT EXISTS job_id uuid REFERENCES public.jobs(id) ON DELETE CASCADE;
ALTER TABLE public.job_scores ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.job_scores ADD COLUMN IF NOT EXISTS overall_score numeric(5,2);
ALTER TABLE public.job_scores ADD COLUMN IF NOT EXISTS skills_match numeric(5,2) NOT NULL DEFAULT 0;
ALTER TABLE public.job_scores ADD COLUMN IF NOT EXISTS experience_relevance numeric(5,2) NOT NULL DEFAULT 0;
ALTER TABLE public.job_scores ADD COLUMN IF NOT EXISTS evidence_quality numeric(5,2) NOT NULL DEFAULT 0;
ALTER TABLE public.job_scores ADD COLUMN IF NOT EXISTS seniority_alignment numeric(5,2) NOT NULL DEFAULT 0;
ALTER TABLE public.job_scores ADD COLUMN IF NOT EXISTS ats_keywords numeric(5,2) NOT NULL DEFAULT 0;
ALTER TABLE public.job_scores ADD COLUMN IF NOT EXISTS confidence_score numeric(5,2) NOT NULL DEFAULT 0;
ALTER TABLE public.job_scores ADD COLUMN IF NOT EXISTS scoring_version text;
ALTER TABLE public.job_scores ADD COLUMN IF NOT EXISTS score_reasoning jsonb NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE public.job_scores ADD COLUMN IF NOT EXISTS strengths text[] NOT NULL DEFAULT '{}'::text[];
ALTER TABLE public.job_scores ADD COLUMN IF NOT EXISTS gaps text[] NOT NULL DEFAULT '{}'::text[];
ALTER TABLE public.job_scores ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now();
ALTER TABLE public.job_scores ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

UPDATE public.job_scores js
SET user_id = j.user_id
FROM public.jobs j
WHERE js.job_id = j.id
  AND js.user_id IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_job_scores_id_unique ON public.job_scores(id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_job_scores_job_id_unique ON public.job_scores(job_id);
CREATE INDEX IF NOT EXISTS idx_job_scores_user_id ON public.job_scores(user_id);
CREATE INDEX IF NOT EXISTS idx_job_scores_created_at ON public.job_scores(created_at DESC);

ALTER TABLE public.job_scores ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "job_scores_select_own" ON public.job_scores;
CREATE POLICY "job_scores_select_own"
  ON public.job_scores FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user_id OR EXISTS (
      SELECT 1 FROM public.jobs
      WHERE jobs.id = job_scores.job_id
        AND jobs.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "job_scores_insert_own" ON public.job_scores;
CREATE POLICY "job_scores_insert_own"
  ON public.job_scores FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id OR EXISTS (
      SELECT 1 FROM public.jobs
      WHERE jobs.id = job_scores.job_id
        AND jobs.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "job_scores_update_own" ON public.job_scores;
CREATE POLICY "job_scores_update_own"
  ON public.job_scores FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = user_id OR EXISTS (
      SELECT 1 FROM public.jobs
      WHERE jobs.id = job_scores.job_id
        AND jobs.user_id = auth.uid()
    )
  )
  WITH CHECK (
    auth.uid() = user_id OR EXISTS (
      SELECT 1 FROM public.jobs
      WHERE jobs.id = job_scores.job_id
        AND jobs.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "job_scores_delete_own" ON public.job_scores;
CREATE POLICY "job_scores_delete_own"
  ON public.job_scores FOR DELETE
  TO authenticated
  USING (
    auth.uid() = user_id OR EXISTS (
      SELECT 1 FROM public.jobs
      WHERE jobs.id = job_scores.job_id
        AND jobs.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "job_scores_service_all" ON public.job_scores;
CREATE POLICY "job_scores_service_all"
  ON public.job_scores FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE OR REPLACE FUNCTION public.update_job_scores_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_update_job_scores_updated_at ON public.job_scores;
CREATE TRIGGER trigger_update_job_scores_updated_at
  BEFORE UPDATE ON public.job_scores
  FOR EACH ROW
  EXECUTE FUNCTION public.update_job_scores_updated_at();

COMMENT ON TABLE public.evidence_library IS
  'Canonical evidence source table for grounded resume, cover letter, coach, and governance flows.';
COMMENT ON COLUMN public.evidence_library.what_not_to_overstate IS
  'Survival-critical negative constraint for AI generation. Do not rename or collapse.';
COMMENT ON TABLE public.job_scores IS
  'Canonical normalized scoring table. scoring_version is required so scores remain comparable over time.';
COMMENT ON COLUMN public.job_scores.scoring_version IS
  'Survival-critical score version. Do not rename or collapse.';

NOTIFY pgrst, 'reload schema';
