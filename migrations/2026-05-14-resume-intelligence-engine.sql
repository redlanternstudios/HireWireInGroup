-- HireWire Build Day 14: Resume Intelligence Engine
-- Ensures the intelligence column exists and is indexed for fast reads

-- intelligence JSONB column (stores signal_profile, role_archetype, narrative_mode, recruiter_scan)
alter table jobs
  add column if not exists intelligence jsonb;

-- index for jobs that have intelligence data (used by pipeline panel aggregation)
create index if not exists idx_jobs_intelligence_not_null
  on jobs (user_id, created_at desc)
  where intelligence is not null;

-- score_gaps column (used by intelligence panel recurring gaps aggregation)
alter table jobs
  add column if not exists score_gaps text[];
