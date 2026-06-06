-- HireWire ConfigEngine-style feature flags.
-- Adds queryable rollout controls without changing existing product behavior.

CREATE TABLE IF NOT EXISTS public.feature_flags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  flag_key text NOT NULL UNIQUE,
  status text NOT NULL DEFAULT 'disabled'
    CHECK (status IN ('enabled', 'disabled', 'conditional')),
  description text,
  conditions jsonb NOT NULL DEFAULT '[]'::jsonb,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.feature_flags ADD COLUMN IF NOT EXISTS flag_key text;
ALTER TABLE public.feature_flags ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'disabled';
ALTER TABLE public.feature_flags ADD COLUMN IF NOT EXISTS description text;
ALTER TABLE public.feature_flags ADD COLUMN IF NOT EXISTS conditions jsonb NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE public.feature_flags ADD COLUMN IF NOT EXISTS metadata jsonb NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE public.feature_flags ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now();
ALTER TABLE public.feature_flags ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'feature_flags_status_check'
      AND conrelid = 'public.feature_flags'::regclass
  ) THEN
    ALTER TABLE public.feature_flags
      ADD CONSTRAINT feature_flags_status_check
      CHECK (status IN ('enabled', 'disabled', 'conditional'));
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS idx_feature_flags_flag_key
  ON public.feature_flags(flag_key);
CREATE INDEX IF NOT EXISTS idx_feature_flags_status
  ON public.feature_flags(status);

CREATE TABLE IF NOT EXISTS public.flag_overrides (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  flag_key text NOT NULL REFERENCES public.feature_flags(flag_key) ON DELETE CASCADE,
  scope text NOT NULL CHECK (scope IN ('global', 'user')),
  scope_id uuid,
  enabled boolean NOT NULL,
  reason text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(flag_key, scope, scope_id)
);

ALTER TABLE public.flag_overrides ADD COLUMN IF NOT EXISTS flag_key text;
ALTER TABLE public.flag_overrides ADD COLUMN IF NOT EXISTS scope text NOT NULL DEFAULT 'global';
ALTER TABLE public.flag_overrides ADD COLUMN IF NOT EXISTS scope_id uuid;
ALTER TABLE public.flag_overrides ADD COLUMN IF NOT EXISTS enabled boolean NOT NULL DEFAULT false;
ALTER TABLE public.flag_overrides ADD COLUMN IF NOT EXISTS reason text;
ALTER TABLE public.flag_overrides ADD COLUMN IF NOT EXISTS metadata jsonb NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE public.flag_overrides ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now();
ALTER TABLE public.flag_overrides ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

CREATE INDEX IF NOT EXISTS idx_flag_overrides_flag_key
  ON public.flag_overrides(flag_key);
CREATE INDEX IF NOT EXISTS idx_flag_overrides_scope
  ON public.flag_overrides(scope, scope_id);

CREATE TABLE IF NOT EXISTS public.config_values (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  config_key text NOT NULL,
  value jsonb NOT NULL,
  value_type text NOT NULL DEFAULT 'json'
    CHECK (value_type IN ('string', 'number', 'boolean', 'json')),
  scope text NOT NULL DEFAULT 'global'
    CHECK (scope IN ('global', 'user')),
  scope_id uuid,
  description text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(config_key, scope, scope_id)
);

CREATE INDEX IF NOT EXISTS idx_config_values_config_key
  ON public.config_values(config_key);
CREATE INDEX IF NOT EXISTS idx_config_values_scope
  ON public.config_values(scope, scope_id);

ALTER TABLE public.feature_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.flag_overrides ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.config_values ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "feature_flags_select_authenticated" ON public.feature_flags;
CREATE POLICY "feature_flags_select_authenticated"
  ON public.feature_flags FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "feature_flags_service_all" ON public.feature_flags;
CREATE POLICY "feature_flags_service_all"
  ON public.feature_flags FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "flag_overrides_select_own" ON public.flag_overrides;
CREATE POLICY "flag_overrides_select_own"
  ON public.flag_overrides FOR SELECT
  TO authenticated
  USING (scope = 'global' OR (scope = 'user' AND scope_id = auth.uid()));

DROP POLICY IF EXISTS "flag_overrides_service_all" ON public.flag_overrides;
CREATE POLICY "flag_overrides_service_all"
  ON public.flag_overrides FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "config_values_select_own" ON public.config_values;
CREATE POLICY "config_values_select_own"
  ON public.config_values FOR SELECT
  TO authenticated
  USING (scope = 'global' OR (scope = 'user' AND scope_id = auth.uid()));

DROP POLICY IF EXISTS "config_values_service_all" ON public.config_values;
CREATE POLICY "config_values_service_all"
  ON public.config_values FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE OR REPLACE FUNCTION public.is_feature_enabled(
  p_flag_key text,
  p_user_id uuid DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_status text;
  v_override boolean;
BEGIN
  SELECT enabled INTO v_override
  FROM public.flag_overrides
  WHERE flag_key = p_flag_key
    AND scope = 'user'
    AND scope_id = p_user_id
  LIMIT 1;

  IF FOUND THEN
    RETURN v_override;
  END IF;

  SELECT enabled INTO v_override
  FROM public.flag_overrides
  WHERE flag_key = p_flag_key
    AND scope = 'global'
    AND scope_id IS NULL
  LIMIT 1;

  IF FOUND THEN
    RETURN v_override;
  END IF;

  SELECT status INTO v_status
  FROM public.feature_flags
  WHERE flag_key = p_flag_key
  LIMIT 1;

  RETURN COALESCE(v_status = 'enabled', false);
END;
$$;

INSERT INTO public.feature_flags (flag_key, status, description)
VALUES
  ('prove_fit_v0', 'enabled', 'Controls the Prove Fit decision surface.'),
  ('receipt_backed_domain_events', 'enabled', 'Writes receipts for domain-event persistence.'),
  ('silent_ai_audit', 'enabled', 'Writes AI routing and generation audit rows.'),
  ('notification_queue', 'disabled', 'Enables queued user notifications.'),
  ('paywall_usage_records', 'enabled', 'Records generation usage in usage_records.')
ON CONFLICT (flag_key) DO NOTHING;

NOTIFY pgrst, 'reload schema';
