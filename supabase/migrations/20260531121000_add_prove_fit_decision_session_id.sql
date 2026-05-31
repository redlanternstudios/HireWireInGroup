-- Phase 2: tie canonical Prove Fit decisions back to the coach session that made them.

ALTER TABLE public.prove_fit_decisions
  ADD COLUMN IF NOT EXISTS session_id uuid REFERENCES public.coach_sessions(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_prove_fit_decisions_session_id
  ON public.prove_fit_decisions (session_id)
  WHERE session_id IS NOT NULL;

COMMENT ON COLUMN public.prove_fit_decisions.session_id IS
  'Coach session that recorded this confirmed/skipped Prove Fit decision.';

NOTIFY pgrst, 'reload schema';
