-- =============================================================================
-- HireWire — Readiness Gate Override Events
-- Captures explicit overrides when users apply despite failed readiness checks.
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.application_events (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id      uuid        NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  user_id     uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type        text        NOT NULL CHECK (type IN ('override')),
  reasons     jsonb       NOT NULL DEFAULT '[]'::jsonb,
  reason      text,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_application_events_user_id    ON public.application_events (user_id);
CREATE INDEX IF NOT EXISTS idx_application_events_job_id     ON public.application_events (job_id);
CREATE INDEX IF NOT EXISTS idx_application_events_type       ON public.application_events (type);
CREATE INDEX IF NOT EXISTS idx_application_events_created_at ON public.application_events (created_at DESC);

ALTER TABLE public.application_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "application_events_select_own" ON public.application_events;
DROP POLICY IF EXISTS "application_events_insert_own" ON public.application_events;
DROP POLICY IF EXISTS "application_events_service_role_all" ON public.application_events;

CREATE POLICY "application_events_select_own" ON public.application_events
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "application_events_insert_own" ON public.application_events
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "application_events_service_role_all" ON public.application_events
  FOR ALL TO service_role USING (true) WITH CHECK (true);

NOTIFY pgrst, 'reload schema';
