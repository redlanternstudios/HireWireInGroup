-- Add user_id column to job_scores for tenant isolation
ALTER TABLE public.job_scores ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id);

-- Backfill user_id for existing rows by joining jobs
UPDATE public.job_scores SET user_id = jobs.user_id FROM public.jobs WHERE job_scores.job_id = jobs.id;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_job_scores_user_id ON public.job_scores(user_id);
