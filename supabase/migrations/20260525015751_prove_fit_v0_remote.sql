-- Remote migration history backfill.
-- The linked Supabase project contains version 20260525015751 named
-- prove_fit_v0. Its statements overlap the local 20260524090000_prove_fit_v0.sql
-- migration. Keep this file idempotent so local history matches remote history
-- without changing schema behavior on reset or future pushes.

alter table public.jobs
  add column if not exists evidence_map_version uuid,
  add column if not exists gap_clarifications jsonb not null default '[]'::jsonb,
  add column if not exists gaps_addressed text[] not null default '{}'::text[];

alter table public.evidence_library
  add column if not exists normalized_keywords text[] default '{}'::text[],
  add column if not exists canonical_domains text[] default '{}'::text[],
  add column if not exists source_profile_field text;

do $$
declare
  constraint_name text;
begin
  select conname into constraint_name
  from pg_constraint
  where conrelid = 'public.evidence_library'::regclass
    and contype = 'c'
    and pg_get_constraintdef(oid) ilike '%source_type%';

  if constraint_name is not null then
    execute format('alter table public.evidence_library drop constraint %I', constraint_name);
  end if;
end $$;

alter table public.evidence_library
  add constraint evidence_library_source_type_check
  check (
    source_type in (
      'work_experience',
      'education',
      'skill',
      'certification',
      'project',
      'achievement',
      'publication',
      'portfolio_entry',
      'shipped_product',
      'open_source',
      'live_site',
      'language',
      'award',
      'volunteer',
      'military',
      'website',
      'linkedin',
      'github',
      'user_input',
      'ai_inferred'
    )
  );

create table if not exists public.prove_fit_decisions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  job_id uuid not null references public.jobs(id) on delete cascade,
  requirement_id text not null,
  requirement_text text not null,
  decision text not null check (decision in ('auto_mapped', 'confirmed', 'skipped')),
  evidence_id uuid references public.evidence_library(id) on delete set null,
  claim_text text,
  skip_reason text,
  source text not null default 'match_interview',
  input_summary text,
  system_summary text,
  impact jsonb not null default '{}'::jsonb,
  before_state jsonb not null default '{}'::jsonb,
  after_state jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, job_id, requirement_id, decision)
);

alter table public.prove_fit_decisions
  add column if not exists evidence_id uuid references public.evidence_library(id) on delete set null,
  add column if not exists claim_text text,
  add column if not exists skip_reason text,
  add column if not exists source text not null default 'match_interview',
  add column if not exists input_summary text,
  add column if not exists system_summary text,
  add column if not exists impact jsonb not null default '{}'::jsonb,
  add column if not exists before_state jsonb not null default '{}'::jsonb,
  add column if not exists after_state jsonb not null default '{}'::jsonb;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.prove_fit_decisions'::regclass
      and conname = 'prove_fit_decisions_decision_check'
  ) then
    alter table public.prove_fit_decisions
      add constraint prove_fit_decisions_decision_check
      check (decision in ('auto_mapped', 'confirmed', 'skipped'));
  end if;
end $$;

create table if not exists public.document_generation_traces (
  id uuid primary key default gen_random_uuid(),
  generation_id uuid not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  job_id uuid not null references public.jobs(id) on delete cascade,
  evidence_ids uuid[] not null default '{}'::uuid[],
  provenance_map jsonb not null default '{}'::jsonb,
  quality_flags jsonb not null default '[]'::jsonb,
  skipped_requirements jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.document_generation_traces
  add column if not exists generation_id uuid,
  add column if not exists evidence_ids uuid[] not null default '{}'::uuid[],
  add column if not exists provenance_map jsonb not null default '{}'::jsonb,
  add column if not exists quality_flags jsonb not null default '[]'::jsonb,
  add column if not exists skipped_requirements jsonb not null default '[]'::jsonb;

alter table public.prove_fit_decisions enable row level security;
alter table public.document_generation_traces enable row level security;

drop policy if exists "Users own prove fit decisions" on public.prove_fit_decisions;
create policy "Users own prove fit decisions"
  on public.prove_fit_decisions
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users own document generation traces" on public.document_generation_traces;
create policy "Users own document generation traces"
  on public.document_generation_traces
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index if not exists idx_jobs_evidence_map_version
  on public.jobs (id, user_id, evidence_map_version);

create index if not exists idx_jobs_gaps_addressed
  on public.jobs using gin (gaps_addressed);

create index if not exists idx_evidence_library_normalized_keywords
  on public.evidence_library using gin (normalized_keywords);

create index if not exists idx_evidence_library_canonical_domains
  on public.evidence_library using gin (canonical_domains);

create index if not exists idx_prove_fit_decisions_job_requirement
  on public.prove_fit_decisions (user_id, job_id, requirement_id);

create unique index if not exists idx_prove_fit_decisions_unique_decision
  on public.prove_fit_decisions (user_id, job_id, requirement_id, decision);

create index if not exists idx_prove_fit_decisions_evidence
  on public.prove_fit_decisions (evidence_id)
  where evidence_id is not null;

create index if not exists idx_document_generation_traces_job
  on public.document_generation_traces (user_id, job_id, created_at desc);

create unique index if not exists idx_document_generation_traces_generation
  on public.document_generation_traces (generation_id);

create or replace function public.prevent_audit_event_mutation()
returns trigger
language plpgsql
as $$
begin
  raise exception 'audit_events are immutable';
end;
$$;

drop trigger if exists prevent_audit_event_update on public.audit_events;
create trigger prevent_audit_event_update
  before update or delete on public.audit_events
  for each row execute function public.prevent_audit_event_mutation();

create or replace function public.prevent_prove_fit_decision_delete()
returns trigger
language plpgsql
as $$
begin
  raise exception 'prove_fit_decisions cannot be deleted';
end;
$$;

drop trigger if exists prevent_prove_fit_decision_delete on public.prove_fit_decisions;
create trigger prevent_prove_fit_decision_delete
  before delete on public.prove_fit_decisions
  for each row execute function public.prevent_prove_fit_decision_delete();

notify pgrst, 'reload schema';
