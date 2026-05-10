-- 009_create_career_import_batches.sql
-- Migration: Table for tracking resume/LinkedIn import jobs (patterned after byred_import_batches)

CREATE TABLE IF NOT EXISTS career_import_batches (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    source text NOT NULL, -- e.g. 'resume', 'linkedin', 'github'
    status text NOT NULL CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    total_rows integer,
    imported_rows integer,
    failed_rows integer,
    error_message text,
    started_at timestamptz NOT NULL DEFAULT now(),
    finished_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_career_import_batches_user_id ON career_import_batches(user_id);
CREATE INDEX IF NOT EXISTS idx_career_import_batches_source ON career_import_batches(source);
