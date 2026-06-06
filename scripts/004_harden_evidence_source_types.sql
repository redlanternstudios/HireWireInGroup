-- 004_harden_evidence_source_types.sql
-- Align evidence_library.source_type with all types emitted by code
DO $$
DECLARE
  constraint_name text;
BEGIN
  SELECT conname INTO constraint_name FROM pg_constraint
  WHERE conrelid = 'public.evidence_library'::regclass
    AND contype = 'c'
    AND pg_get_constraintdef(oid) ILIKE '%source_type%';
  IF constraint_name IS NOT NULL THEN
    EXECUTE format('ALTER TABLE public.evidence_library DROP CONSTRAINT %I', constraint_name);
  END IF;
END $$;

ALTER TABLE public.evidence_library
ADD CONSTRAINT evidence_library_source_type_check
CHECK (
  source_type IN (
    'work_experience',
    'education',
    'skill',
    'certification',
    'project',
    'achievement',
    'publication',
    'portfolio_entry',
    'shipped_product',
    'open_source',
    'live_site',
    'language',
    'award',
    'volunteer',
    'military',
    'website',
    'linkedin',
    'github',
    'user_input',
    'ai_inferred'
  )
);

ALTER TABLE public.evidence_library
ADD COLUMN IF NOT EXISTS normalized_keywords text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS canonical_domains text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS source_profile_field text;

CREATE INDEX IF NOT EXISTS idx_evidence_library_normalized_keywords
ON public.evidence_library USING GIN (normalized_keywords);

CREATE INDEX IF NOT EXISTS idx_evidence_library_canonical_domains
ON public.evidence_library USING GIN (canonical_domains);
