-- HireWire SilentEngine-style AI routing audit.
-- This captures provider/model decisions and generation outcomes without
-- changing model selection behavior.

CREATE TABLE IF NOT EXISTS public.ai_routing_decisions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id text NOT NULL UNIQUE,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  job_id uuid REFERENCES public.jobs(id) ON DELETE SET NULL,
  route text NOT NULL,
  operation text NOT NULL DEFAULT 'unknown',
  requested_model text,
  selected_provider text NOT NULL,
  selected_model text NOT NULL,
  key_source text,
  timeout_ms integer,
  selection_reason text,
  fallback_used boolean NOT NULL DEFAULT false,
  fallback_count integer NOT NULL DEFAULT 0,
  constraints_met boolean NOT NULL DEFAULT true,
  constraint_violations jsonb NOT NULL DEFAULT '[]'::jsonb,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  decided_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ai_routing_decisions_user
  ON public.ai_routing_decisions(user_id, decided_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_routing_decisions_job
  ON public.ai_routing_decisions(job_id, decided_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_routing_decisions_route
  ON public.ai_routing_decisions(route, decided_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_routing_decisions_provider
  ON public.ai_routing_decisions(selected_provider, selected_model);

CREATE TABLE IF NOT EXISTS public.ai_generation_audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id text NOT NULL REFERENCES public.ai_routing_decisions(request_id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  job_id uuid REFERENCES public.jobs(id) ON DELETE SET NULL,
  route text NOT NULL,
  operation text NOT NULL DEFAULT 'unknown',
  provider text NOT NULL,
  model text NOT NULL,
  status text NOT NULL CHECK (status IN ('success', 'error', 'timeout', 'rate_limited')),
  latency_ms integer NOT NULL DEFAULT 0,
  prompt_tokens integer,
  completion_tokens integer,
  total_tokens integer,
  finish_reason text,
  error_message text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ai_generation_audit_request
  ON public.ai_generation_audit_logs(request_id);
CREATE INDEX IF NOT EXISTS idx_ai_generation_audit_user
  ON public.ai_generation_audit_logs(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_generation_audit_job
  ON public.ai_generation_audit_logs(job_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_generation_audit_status
  ON public.ai_generation_audit_logs(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_generation_audit_provider
  ON public.ai_generation_audit_logs(provider, model);

ALTER TABLE public.ai_routing_decisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_generation_audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "ai_routing_decisions_select_own" ON public.ai_routing_decisions;
CREATE POLICY "ai_routing_decisions_select_own"
  ON public.ai_routing_decisions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "ai_routing_decisions_insert_own" ON public.ai_routing_decisions;
CREATE POLICY "ai_routing_decisions_insert_own"
  ON public.ai_routing_decisions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

DROP POLICY IF EXISTS "ai_routing_decisions_service_all" ON public.ai_routing_decisions;
CREATE POLICY "ai_routing_decisions_service_all"
  ON public.ai_routing_decisions FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "ai_generation_audit_logs_select_own" ON public.ai_generation_audit_logs;
CREATE POLICY "ai_generation_audit_logs_select_own"
  ON public.ai_generation_audit_logs FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "ai_generation_audit_logs_insert_own" ON public.ai_generation_audit_logs;
CREATE POLICY "ai_generation_audit_logs_insert_own"
  ON public.ai_generation_audit_logs FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

DROP POLICY IF EXISTS "ai_generation_audit_logs_service_all" ON public.ai_generation_audit_logs;
CREATE POLICY "ai_generation_audit_logs_service_all"
  ON public.ai_generation_audit_logs FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

COMMENT ON TABLE public.ai_routing_decisions IS
  'HireWire SilentEngine-style audit of AI provider/model routing decisions.';
COMMENT ON TABLE public.ai_generation_audit_logs IS
  'HireWire SilentEngine-style audit of AI generation outcomes, latency, and failures.';

NOTIFY pgrst, 'reload schema';
