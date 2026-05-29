-- Outcome tracking for application feedback loop. Safe to re-run.
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS callback_received_at timestamptz, ADD COLUMN IF NOT EXISTS interview_at timestamptz, ADD COLUMN IF NOT EXISTS offer_received_at timestamptz, ADD COLUMN IF NOT EXISTS outcome text;
ALTER TABLE public.jobs DROP CONSTRAINT IF EXISTS jobs_outcome_check;
ALTER TABLE public.jobs ADD CONSTRAINT jobs_outcome_check CHECK (outcome IN ('no_response','rejected','phone_screen','interview','offer','accepted','withdrew'));