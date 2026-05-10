-- 003_create_career_consistency_flags.sql
-- Migration: Table for storing LinkedIn ↔ Resume consistency checks

CREATE TABLE IF NOT EXISTS career_consistency_flags (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    resume_version_id uuid NOT NULL REFERENCES candidate_resume_versions(id) ON DELETE CASCADE,
    linkedin_snapshot_id uuid NOT NULL,
    field text NOT NULL, -- e.g. 'title', 'company', 'date_range'
    source_a text NOT NULL, -- e.g. 'resume'
    source_b text NOT NULL, -- e.g. 'linkedin'
    value_a text,
    value_b text,
    severity text NOT NULL CHECK (severity IN ('cosmetic', 'disqualifying')),
    delta text,
    flagged_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_career_consistency_flags_user_id ON career_consistency_flags(user_id);
CREATE INDEX IF NOT EXISTS idx_career_consistency_flags_resume_version_id ON career_consistency_flags(resume_version_id);
