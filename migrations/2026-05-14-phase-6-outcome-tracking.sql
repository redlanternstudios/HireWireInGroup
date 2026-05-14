-- HireWire Phase 6: Application Outcome Tracking
-- Enables the learning loop by capturing what happens after submission

-- ── Application outcomes table ────────────────────────────────────────────────
create table if not exists application_outcomes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  job_id uuid references jobs(id) on delete cascade not null,

  -- What happened
  outcome text not null check (outcome in (
    'callback',
    'rejection',
    'ghosted',
    'interview_scheduled',
    'interview_completed',
    'offer_received',
    'offer_accepted',
    'offer_declined',
    'application_withdrawn'
  )),
  outcome_date timestamptz default now(),
  days_to_response integer,               -- null if ghosted or not yet known

  -- How they responded
  response_source text check (response_source in (
    'ats_email', 'recruiter_direct', 'linkedin', 'phone', 'portal', 'other'
  )),

  -- What materials were used (for learning)
  resume_version_hash text,               -- hash of the resume text used
  narrative_mode text,                    -- which narrative mode was active
  role_archetype text,                    -- classified archetype at generation time
  dominant_signal text,                   -- top signal at generation time
  fit_score numeric,                      -- fit score at generation time
  generation_strategy text,               -- direct_match | adjacent_transition | stretch_honest

  -- Context for learning
  salary_discussed boolean default false,
  salary_offered numeric,
  salary_accepted numeric,
  interview_rounds integer,               -- how many rounds before outcome

  -- Free-form notes
  notes text,

  -- Provenance
  created_at timestamptz default now(),
  updated_at timestamptz default now(),

  -- One outcome per job (latest wins — use upsert)
  unique(user_id, job_id)
);

-- RLS
alter table application_outcomes enable row level security;

create policy "Users manage their own outcomes"
  on application_outcomes for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Index for learning queries
create index if not exists idx_application_outcomes_user_id
  on application_outcomes (user_id, created_at desc);

create index if not exists idx_application_outcomes_outcome
  on application_outcomes (user_id, outcome);

create index if not exists idx_application_outcomes_archetype
  on application_outcomes (user_id, role_archetype, outcome);

-- ── Jobs table additions ──────────────────────────────────────────────────────
-- Add outcome tracking columns to the jobs table for quick access
alter table jobs
  add column if not exists outcome text,
  add column if not exists outcome_date timestamptz,
  add column if not exists days_to_response integer,
  add column if not exists interview_rounds integer;

-- ── Evidence relationships table ─────────────────────────────────────────────
-- Phase 7 prep: evidence graph edges
create table if not exists evidence_relationships (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  source_evidence_id uuid references evidence_library(id) on delete cascade,
  target_evidence_id uuid references evidence_library(id) on delete cascade,
  relationship_type text not null check (relationship_type in (
    'supports', 'demonstrates', 'extends', 'temporal', 'contradicts'
  )),
  strength numeric default 0.7 check (strength >= 0 and strength <= 1),
  auto_detected boolean default true,
  confirmed_by_user boolean default false,
  created_at timestamptz default now(),
  unique(source_evidence_id, target_evidence_id, relationship_type)
);

alter table evidence_relationships enable row level security;

create policy "Users manage their own evidence relationships"
  on evidence_relationships for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index if not exists idx_evidence_relationships_source
  on evidence_relationships (source_evidence_id);

create index if not exists idx_evidence_relationships_target
  on evidence_relationships (target_evidence_id);

-- ── Learning insights table ───────────────────────────────────────────────────
-- Phase 9 prep: computed insights from outcome patterns
create table if not exists learning_insights (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  insight_type text not null,             -- bullet_performance | narrative_mode | archetype | signal | industry
  insight_key text not null,             -- the specific item being evaluated
  conversion_rate numeric,               -- callbacks / applications for this key
  sample_size integer,
  confidence numeric,
  recommendation text,
  supporting_data jsonb,
  computed_at timestamptz default now(),
  unique(user_id, insight_type, insight_key)
);

alter table learning_insights enable row level security;

create policy "Users read their own insights"
  on learning_insights for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
