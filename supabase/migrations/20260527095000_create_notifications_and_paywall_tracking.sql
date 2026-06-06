-- HireWire NotificationsEngine and PaywallEngine infrastructure.
-- Adds queues/preferences and durable usage/entitlement records while leaving
-- current billing and notification behavior unchanged.

CREATE TABLE IF NOT EXISTS public.notification_templates (
  id text PRIMARY KEY,
  reason text NOT NULL,
  channel text NOT NULL CHECK (channel IN ('email', 'notification', 'in_app')),
  subject text,
  body text NOT NULL,
  variables jsonb NOT NULL DEFAULT '[]'::jsonb,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notification_templates_reason
  ON public.notification_templates(reason);
CREATE INDEX IF NOT EXISTS idx_notification_templates_channel
  ON public.notification_templates(channel);

CREATE TABLE IF NOT EXISTS public.notification_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  email_enabled boolean NOT NULL DEFAULT true,
  notification_enabled boolean NOT NULL DEFAULT true,
  in_app_enabled boolean NOT NULL DEFAULT true,
  marketing_enabled boolean NOT NULL DEFAULT false,
  quiet_hours_start time,
  quiet_hours_end time,
  timezone text NOT NULL DEFAULT 'UTC',
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.notification_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reason text NOT NULL,
  channel text NOT NULL CHECK (channel IN ('email', 'notification', 'in_app')),
  status text NOT NULL DEFAULT 'queued'
    CHECK (status IN ('queued', 'sending', 'sent', 'failed', 'canceled')),
  priority text NOT NULL DEFAULT 'normal'
    CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  subject text,
  body text NOT NULL,
  template_id text REFERENCES public.notification_templates(id) ON DELETE SET NULL,
  template_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  recipient text,
  scheduled_for timestamptz,
  sent_at timestamptz,
  error text,
  retry_count integer NOT NULL DEFAULT 0,
  max_retries integer NOT NULL DEFAULT 3,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notification_queue_user
  ON public.notification_queue(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notification_queue_processing
  ON public.notification_queue(status, priority, scheduled_for)
  WHERE status IN ('queued', 'failed');

CREATE TABLE IF NOT EXISTS public.notification_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  queue_id uuid REFERENCES public.notification_queue(id) ON DELETE SET NULL,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reason text NOT NULL,
  channel text NOT NULL,
  status text NOT NULL CHECK (status IN ('sent', 'failed', 'delivered', 'opened', 'clicked')),
  subject text,
  body text,
  recipient text,
  provider text,
  provider_message_id text,
  error text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notification_logs_user
  ON public.notification_logs(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notification_logs_status
  ON public.notification_logs(status, created_at DESC);

CREATE TABLE IF NOT EXISTS public.pricing_plans (
  id text PRIMARY KEY,
  plan_type text NOT NULL CHECK (plan_type IN ('free', 'pro', 'enterprise')),
  name text NOT NULL,
  description text,
  price numeric(10, 2) NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'USD',
  interval text NOT NULL DEFAULT 'monthly'
    CHECK (interval IN ('monthly', 'yearly', 'lifetime')),
  features jsonb NOT NULL DEFAULT '[]'::jsonb,
  limits jsonb NOT NULL DEFAULT '{}'::jsonb,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_pricing_plans_plan_type
  ON public.pricing_plans(plan_type);

CREATE TABLE IF NOT EXISTS public.subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_type text NOT NULL DEFAULT 'free'
    CHECK (plan_type IN ('free', 'pro', 'enterprise')),
  status text NOT NULL DEFAULT 'active',
  stripe_subscription_id text UNIQUE,
  stripe_customer_id text,
  current_period_start timestamptz,
  current_period_end timestamptz,
  canceled_at timestamptz,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS plan_type text NOT NULL DEFAULT 'free';
ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'active';
ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS stripe_subscription_id text;
ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS stripe_customer_id text;
ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS current_period_start timestamptz;
ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS current_period_end timestamptz;
ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS canceled_at timestamptz;
ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS metadata jsonb NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now();
ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

CREATE UNIQUE INDEX IF NOT EXISTS idx_subscriptions_user_unique
  ON public.subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status
  ON public.subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_subscription
  ON public.subscriptions(stripe_subscription_id)
  WHERE stripe_subscription_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS public.entitlements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subscription_id uuid REFERENCES public.subscriptions(id) ON DELETE SET NULL,
  feature text NOT NULL,
  granted boolean NOT NULL DEFAULT true,
  source text NOT NULL DEFAULT 'plan',
  expires_at timestamptz,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, feature)
);

CREATE INDEX IF NOT EXISTS idx_entitlements_user
  ON public.entitlements(user_id);
CREATE INDEX IF NOT EXISTS idx_entitlements_feature
  ON public.entitlements(feature);

CREATE TABLE IF NOT EXISTS public.usage_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subscription_id uuid REFERENCES public.subscriptions(id) ON DELETE SET NULL,
  resource_type text NOT NULL,
  quantity numeric(10, 2) NOT NULL DEFAULT 1,
  unit text NOT NULL DEFAULT 'count',
  occurred_at timestamptz NOT NULL DEFAULT now(),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_usage_records_user_resource
  ON public.usage_records(user_id, resource_type, occurred_at DESC);

ALTER TABLE public.notification_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pricing_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.entitlements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usage_records ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "notification_templates_select_active" ON public.notification_templates;
CREATE POLICY "notification_templates_select_active"
  ON public.notification_templates FOR SELECT
  TO authenticated
  USING (is_active);

DROP POLICY IF EXISTS "notification_preferences_own" ON public.notification_preferences;
CREATE POLICY "notification_preferences_own"
  ON public.notification_preferences FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "notification_queue_select_own" ON public.notification_queue;
CREATE POLICY "notification_queue_select_own"
  ON public.notification_queue FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "notification_queue_insert_own" ON public.notification_queue;
CREATE POLICY "notification_queue_insert_own"
  ON public.notification_queue FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "notification_logs_select_own" ON public.notification_logs;
CREATE POLICY "notification_logs_select_own"
  ON public.notification_logs FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "pricing_plans_select_active" ON public.pricing_plans;
CREATE POLICY "pricing_plans_select_active"
  ON public.pricing_plans FOR SELECT
  TO authenticated
  USING (is_active);

DROP POLICY IF EXISTS "subscriptions_select_own" ON public.subscriptions;
CREATE POLICY "subscriptions_select_own"
  ON public.subscriptions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "entitlements_select_own" ON public.entitlements;
CREATE POLICY "entitlements_select_own"
  ON public.entitlements FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "usage_records_select_own" ON public.usage_records;
CREATE POLICY "usage_records_select_own"
  ON public.usage_records FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "usage_records_insert_own" ON public.usage_records;
CREATE POLICY "usage_records_insert_own"
  ON public.usage_records FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "notifications_service_all" ON public.notification_templates;
CREATE POLICY "notifications_service_all"
  ON public.notification_templates FOR ALL
  TO service_role USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "notification_queue_service_all" ON public.notification_queue;
CREATE POLICY "notification_queue_service_all"
  ON public.notification_queue FOR ALL
  TO service_role USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "notification_logs_service_all" ON public.notification_logs;
CREATE POLICY "notification_logs_service_all"
  ON public.notification_logs FOR ALL
  TO service_role USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "paywall_service_pricing_all" ON public.pricing_plans;
CREATE POLICY "paywall_service_pricing_all"
  ON public.pricing_plans FOR ALL
  TO service_role USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "paywall_service_subscriptions_all" ON public.subscriptions;
CREATE POLICY "paywall_service_subscriptions_all"
  ON public.subscriptions FOR ALL
  TO service_role USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "paywall_service_entitlements_all" ON public.entitlements;
CREATE POLICY "paywall_service_entitlements_all"
  ON public.entitlements FOR ALL
  TO service_role USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "paywall_service_usage_all" ON public.usage_records;
CREATE POLICY "paywall_service_usage_all"
  ON public.usage_records FOR ALL
  TO service_role USING (true) WITH CHECK (true);

INSERT INTO public.pricing_plans (id, plan_type, name, description, price, limits)
VALUES
  ('free', 'free', 'Free', 'Starter plan with limited document generations.', 0, '{"document_generations_per_month": 5}'::jsonb),
  ('pro_monthly', 'pro', 'Pro', 'Unlimited document generation for active job search.', 29, '{"document_generations_per_month": -1}'::jsonb)
ON CONFLICT (id) DO NOTHING;

NOTIFY pgrst, 'reload schema';
