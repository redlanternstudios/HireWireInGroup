-- 006_create_career_applications.sql
-- Migration: Table for tracking job applications and linking to resume versions

CREATE TABLE IF NOT EXISTS career_applications (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    job_id uuid NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    resume_version_id uuid NOT NULL REFERENCES candidate_resume_versions(id) ON DELETE CASCADE,
    applied_at timestamptz NOT NULL DEFAULT now(),
    status text NOT NULL CHECK (status IN ('pending', 'submitted', 'rejected', 'accepted', 'withdrawn')),
    rejection_signal text,
    deleted_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_career_applications_user_id ON career_applications(user_id);
CREATE INDEX IF NOT EXISTS idx_career_applications_job_id ON career_applications(job_id);
CREATE INDEX IF NOT EXISTS idx_career_applications_resume_version_id ON career_applications(resume_version_id);
