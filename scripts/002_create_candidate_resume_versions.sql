-- 002_create_candidate_resume_versions.sql
-- Migration: Create table for storing versioned resume uploads per user

CREATE TABLE IF NOT EXISTS candidate_resume_versions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    file_name text NOT NULL,
    file_type text NOT NULL,
    parsed_text text NOT NULL,
    upload_source text NOT NULL, -- e.g. 'pdf', 'docx', 'linkedin', etc.
    uploaded_at timestamptz NOT NULL DEFAULT now(),
    deleted_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_candidate_resume_versions_user_id ON candidate_resume_versions(user_id);
CREATE INDEX IF NOT EXISTS idx_candidate_resume_versions_uploaded_at ON candidate_resume_versions(uploaded_at);
