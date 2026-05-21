-- Application outcome tracking used by both the job outcome route and coach tools.
-- Safe to re-run.

alter table public.jobs
  add column if not exists outcome text,
  add column if not exists outcome_date timestamptz,
  add column if not exists days_to_response integer,
  add column if not exists archived_at timestamptz,
  add column if not exists archive_reason text,
  add column if not exists archived_by_session text;

create table if not exists public.application_outcomes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  job_id uuid not null references public.jobs(id) on delete cascade,
  outcome text not null,
  outcome_date timestamptz,
  days_to_response integer,
  response_source text,
  narrative_mode text,
  role_archetype text,
  dominant_signal text,
  fit_score numeric(5,2),
  generation_strategy text,
  salary_discussed boolean not null default false,
  salary_offered numeric,
  interview_rounds integer,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, job_id)
);

create index if not exists application_outcomes_user_created_idx
  on public.application_outcomes (user_id, created_at desc);

create index if not exists application_outcomes_job_idx
  on public.application_outcomes (job_id);

alter table public.application_outcomes enable row level security;

drop policy if exists "Users can read own application outcomes" on public.application_outcomes;
create policy "Users can read own application outcomes"
  on public.application_outcomes for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own application outcomes" on public.application_outcomes;
create policy "Users can insert own application outcomes"
  on public.application_outcomes for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own application outcomes" on public.application_outcomes;
create policy "Users can update own application outcomes"
  on public.application_outcomes for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete own application outcomes" on public.application_outcomes;
create policy "Users can delete own application outcomes"
  on public.application_outcomes for delete
  using (auth.uid() = user_id);
