-- 005_create_career_ai_content_flags.sql
-- Migration: Table for storing AI-generated content detection results per resume section

CREATE TABLE IF NOT EXISTS career_ai_content_flags (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    resume_version_id uuid NOT NULL REFERENCES candidate_resume_versions(id) ON DELETE CASCADE,
    section text NOT NULL, -- e.g. 'summary', 'experience', 'education', etc.
    ai_confidence_score numeric(3,2) NOT NULL CHECK (ai_confidence_score >= 0 AND ai_confidence_score <= 1),
    flagged_phrases text[],
    flagged_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_career_ai_content_flags_user_id ON career_ai_content_flags(user_id);
CREATE INDEX IF NOT EXISTS idx_career_ai_content_flags_resume_version_id ON career_ai_content_flags(resume_version_id);
