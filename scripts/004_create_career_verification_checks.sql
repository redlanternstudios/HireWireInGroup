-- 004_create_career_verification_checks.sql
-- Migration: Table for storing employer-perspective verification results per claim

CREATE TABLE IF NOT EXISTS career_verification_checks (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    resume_version_id uuid NOT NULL REFERENCES candidate_resume_versions(id) ON DELETE CASCADE,
    claim_text text NOT NULL,
    org_name text,
    check_result text NOT NULL CHECK (check_result IN ('verifiable', 'unclear', 'likely_unverifiable')),
    confidence numeric(3,2) NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
    checked_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_career_verification_checks_user_id ON career_verification_checks(user_id);
CREATE INDEX IF NOT EXISTS idx_career_verification_checks_resume_version_id ON career_verification_checks(resume_version_id);
