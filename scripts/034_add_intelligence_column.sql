-- =============================================================================
-- Migration: Add Intelligence Layer to Jobs Table
-- HireWire Build Day 14 — Career Signal Orchestration Engine
--
-- Adds a single JSONB column `intelligence` to the jobs table.
-- This stores the output of the Phase 2–5 intelligence pipeline:
--   - signal_profile       (job signal weights with reasoning)
--   - role_archetype        (classified archetype + confidence)
--   - narrative_mode        (selected narrative mode + rationale)
--   - dominant_signal       (top signal label)
--   - signal_summary        (human-readable summary)
--   - ats_priority_keywords (top ATS terms to include)
--   - generation_guidance   (density targets and tone instructions)
--   - recruiter_scan        (pass probability, sentiment, findings summary)
--
-- Design principles:
--   - Single column, flexible schema (JSONB) — no new table joins needed
--   - Intelligence computed at analysis time AND generation time
--   - Coach and documents pages can read from jobs.intelligence without extra query
--   - Existing queries are not affected — column defaults to NULL
-- =============================================================================

ALTER TABLE public.jobs
  ADD COLUMN IF NOT EXISTS intelligence jsonb;

COMMENT ON COLUMN public.jobs.intelligence IS
  'Career Signal Orchestration Engine output. Stores signal_profile, role_archetype, narrative_mode, dominant_signal, ats_priority_keywords, generation_guidance, and recruiter_scan summary. Written by analyze-job-core and generate-documents route.';

-- Index for common intelligence queries (archetype lookups, signal filtering)
CREATE INDEX IF NOT EXISTS idx_jobs_intelligence_archetype
  ON public.jobs USING gin ((intelligence -> 'role_archetype'));

CREATE INDEX IF NOT EXISTS idx_jobs_intelligence_narrative_mode
  ON public.jobs USING gin ((intelligence -> 'narrative_mode'));

-- =============================================================================
-- Verification queries (run manually to confirm)
-- =============================================================================
--
-- SELECT column_name, data_type
-- FROM information_schema.columns
-- WHERE table_name = 'jobs' AND column_name = 'intelligence';
--
-- SELECT id, intelligence->'role_archetype' AS archetype,
--        intelligence->'narrative_mode' AS mode,
--        intelligence->'dominant_signal' AS signal
-- FROM public.jobs
-- WHERE intelligence IS NOT NULL
-- LIMIT 5;
-- =============================================================================
