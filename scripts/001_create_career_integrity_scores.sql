-- 001_create_career_integrity_scores.sql
-- Migration: Create table for storing per-resume and per-bullet integrity scores and flags

CREATE TABLE IF NOT EXISTS career_integrity_scores (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    resume_version_id uuid NOT NULL REFERENCES candidate_resume_versions(id) ON DELETE CASCADE,
    bullet_index integer NOT NULL,
    bullet_text text NOT NULL,
    risk_score numeric(3,2) NOT NULL CHECK (risk_score >= 0 AND risk_score <= 1),
    risk_level text NOT NULL CHECK (risk_level IN ('low', 'medium', 'high')),
    flag_reason text,
    suggested_rewrite text,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_career_integrity_scores_user_id ON career_integrity_scores(user_id);
CREATE INDEX IF NOT EXISTS idx_career_integrity_scores_resume_version_id ON career_integrity_scores(resume_version_id);
CREATE INDEX IF NOT EXISTS idx_career_integrity_scores_bullet_index ON career_integrity_scores(bullet_index);
