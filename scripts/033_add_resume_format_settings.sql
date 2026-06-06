ALTER TABLE jobs
  ADD COLUMN IF NOT EXISTS resume_format text DEFAULT 'modern_professional',
  ADD COLUMN IF NOT EXISTS resume_font text DEFAULT 'inter',
  ADD COLUMN IF NOT EXISTS format_recommendation_reason text;

ALTER TABLE jobs
  DROP CONSTRAINT IF EXISTS jobs_resume_format_check,
  ADD CONSTRAINT jobs_resume_format_check
    CHECK (resume_format IN (
      'ats_safe',
      'modern_professional',
      'compact_professional',
      'executive_narrative',
      'clean_minimal'
    ));

ALTER TABLE jobs
  DROP CONSTRAINT IF EXISTS jobs_resume_font_check,
  ADD CONSTRAINT jobs_resume_font_check
    CHECK (resume_font IN (
      'inter',
      'calibri',
      'arial',
      'helvetica',
      'georgia'
    ));
