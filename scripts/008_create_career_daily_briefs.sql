-- 008_create_career_daily_briefs.sql
-- Migration: Table for storing daily summary briefs per user (patterned after byred_daily_briefs)

CREATE TABLE IF NOT EXISTS career_daily_briefs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    summary jsonb NOT NULL,
    brief_date date NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE(user_id, brief_date)
);

CREATE INDEX IF NOT EXISTS idx_career_daily_briefs_user_id ON career_daily_briefs(user_id);
CREATE INDEX IF NOT EXISTS idx_career_daily_briefs_brief_date ON career_daily_briefs(brief_date);
