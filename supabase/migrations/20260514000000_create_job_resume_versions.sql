-- job_resume_versions: snapshot every generated resume+cover letter per job
-- Allows users to view history and restore prior generations.

CREATE TABLE IF NOT EXISTS job_resume_versions (
  id                uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id            uuid        NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  user_id           uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  version_number    integer     NOT NULL DEFAULT 1,
  resume_text       text,
  cover_letter_text text,
  resume_format     text,
  resume_font       text,
  generation_model  text,
  quality_passed    boolean,
  quality_score     numeric,
  strategy          text,
  label             text,
  created_at        timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_jrv_job_id    ON job_resume_versions(job_id);
CREATE INDEX IF NOT EXISTS idx_jrv_user_id   ON job_resume_versions(user_id);
CREATE INDEX IF NOT EXISTS idx_jrv_job_ver   ON job_resume_versions(job_id, version_number DESC);

ALTER TABLE job_resume_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users own their resume versions"
  ON job_resume_versions FOR ALL
  USING  (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
