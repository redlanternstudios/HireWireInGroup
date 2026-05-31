-- Phase 1: capture coached/confirmed evidence provenance without changing matching writes.

ALTER TABLE public.evidence_library
  ADD COLUMN IF NOT EXISTS coached_version text,
  ADD COLUMN IF NOT EXISTS provenance text,
  ADD COLUMN IF NOT EXISTS first_confirmed_job_id uuid REFERENCES public.jobs(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS coach_tags text[] DEFAULT '{}'::text[];

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'evidence_library_provenance_check'
      AND conrelid = 'public.evidence_library'::regclass
  ) THEN
    ALTER TABLE public.evidence_library
      ADD CONSTRAINT evidence_library_provenance_check
      CHECK (
        provenance IS NULL OR provenance IN (
          'resume_import',
          'linkedin_import',
          'coach_session',
          'user_manual'
        )
      );
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_evidence_library_provenance
  ON public.evidence_library (provenance);

CREATE INDEX IF NOT EXISTS idx_evidence_library_first_confirmed_job_id
  ON public.evidence_library (first_confirmed_job_id)
  WHERE first_confirmed_job_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_evidence_library_coach_tags
  ON public.evidence_library USING gin (coach_tags);

COMMENT ON COLUMN public.evidence_library.coached_version IS
  'Coach-confirmed phrasing that should be preferred over raw/imported snippets during matching and generation.';

COMMENT ON COLUMN public.evidence_library.provenance IS
  'Origin of the evidence record or confirmation flow.';

COMMENT ON COLUMN public.evidence_library.first_confirmed_job_id IS
  'First job where this evidence was confirmed as applicable by the user/coach.';

COMMENT ON COLUMN public.evidence_library.coach_tags IS
  'Coach-derived labels used for retrieval, context sync, and downstream generation.';

NOTIFY pgrst, 'reload schema';
