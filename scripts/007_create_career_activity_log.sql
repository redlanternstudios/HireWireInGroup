-- 007_create_career_activity_log.sql
-- Migration: Table for tracking all user and system activities (patterned after byred_activities)

CREATE TABLE IF NOT EXISTS career_activity_log (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    object_type text NOT NULL, -- e.g. 'resume', 'application', 'integrity_score', etc.
    object_id uuid,
    summary text NOT NULL,
    metadata jsonb,
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_career_activity_log_user_id ON career_activity_log(user_id);
CREATE INDEX IF NOT EXISTS idx_career_activity_log_object_type ON career_activity_log(object_type);
