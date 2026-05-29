-- Credential inflation flags for bias removal. Safe to re-run.
ALTER TABLE public.job_analyses ADD COLUMN IF NOT EXISTS credential_flags jsonb DEFAULT '[]'::jsonb;