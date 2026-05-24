-- Prove Fit decision tracking and document generation traceability
-- Establishes immutable audit history, version control, and downstream invalidation

-- ============================================================================
-- Add evidence_map_version, gap_clarifications, gaps_addressed to jobs
-- ============================================================================
alter table public.jobs
add column if not exists evidence_map_version int default 1,
add column if not exists gap_clarifications jsonb default '{}',
add column if not exists gaps_addressed text[] default '{}';

-- ============================================================================
-- Expand evidence_library.source_type to include user_input
-- ============================================================================
alter type source_type add value if not exists 'user_input' before 'skill';

-- Add new columns to evidence_library
alter table public.evidence_library
add column if not exists normalized_keywords text[] default '{}',
add column if not exists canonical_domains text[] default '{}',
add column if not exists source_profile_field text;

-- Create prove_fit_decisions table
-- Tracks every Prove Fit interaction: confirmed matches, skips, auto-mappings, manual judgments
create table if not exists public.prove_fit_decisions (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.jobs(id) on delete cascade,
  requirement_id text not null,
  decision_type text not null,
  check (decision_type in ('confirmed', 'skipped', 'auto_mapped', 'needs_judgment')),
  user_inputs jsonb default '{}',
  auto_mapped_evidence_id uuid references public.evidence_library(id) on delete set null,
  matched_evidence_ids uuid[] default '{}',
  reasoning text,
  created_at timestamptz default now() not null,
  created_by uuid references auth.users(id),
  updated_at timestamptz default now(),
  updated_by uuid references auth.users(id),
  metadata jsonb default '{}'
);

-- RLS on prove_fit_decisions
alter table public.prove_fit_decisions enable row level security;

create policy "Users can view their job prove_fit decisions" on public.prove_fit_decisions
  for select using (
    exists(
      select 1 from public.jobs j
      where j.id = prove_fit_decisions.job_id
        and j.user_id = auth.uid()
    )
  );

create policy "Users can insert prove_fit decisions for their jobs" on public.prove_fit_decisions
  for insert with check (
    exists(
      select 1 from public.jobs j
      where j.id = prove_fit_decisions.job_id
        and j.user_id = auth.uid()
    )
  );

-- Immutable trigger: prevent updates and deletes on prove_fit_decisions
create or replace function prove_fit_decisions_immutable()
returns trigger as $$
begin
  raise exception 'prove_fit_decisions records are immutable after creation';
end;
$$ language plpgsql;

create trigger prevent_prove_fit_update
before update on public.prove_fit_decisions
for each row
execute function prove_fit_decisions_immutable();

create trigger prevent_prove_fit_delete
before delete on public.prove_fit_decisions
for each row
execute function prove_fit_decisions_immutable();

-- ============================================================================
-- Create document_generation_traces table
-- Tracks generation metadata, provenance decisions, quality flags, and evidence lineage
-- ============================================================================
create table if not exists public.document_generation_traces (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.jobs(id) on delete cascade,
  generation_id text not null unique,
  generation_timestamp timestamptz default now() not null,
  generation_model text,
  provenance_map jsonb default '{}',
  quality_flags text[] default '{}',
  skipped_requirements text[] default '{}',
  evidence_ids uuid[] default '{}',
  document_versions jsonb default '{}',
  created_at timestamptz default now() not null,
  metadata jsonb default '{}'
);

-- RLS on document_generation_traces
alter table public.document_generation_traces enable row level security;

create policy "Users can view generation traces for their jobs" on public.document_generation_traces
  for select using (
    exists(
      select 1 from public.jobs j
      where j.id = document_generation_traces.job_id
        and j.user_id = auth.uid()
    )
  );

create policy "Service can insert generation traces" on public.document_generation_traces
  for insert with check (true);

-- Immutable trigger: prevent updates on document_generation_traces
create or replace function document_generation_traces_immutable()
returns trigger as $$
begin
  raise exception 'document_generation_traces records are immutable';
end;
$$ language plpgsql;

create trigger prevent_trace_update
before update on public.document_generation_traces
for each row
execute function document_generation_traces_immutable();

create trigger prevent_trace_delete
before delete on public.document_generation_traces
for each row
execute function document_generation_traces_immutable();

-- Create unique index on generation_id for trace lookup
create unique index if not exists idx_document_generation_traces_generation_id
on public.document_generation_traces(generation_id);

-- ============================================================================
-- Harden audit_events: immutable update and delete
-- ============================================================================
create or replace function audit_events_immutable()
returns trigger as $$
begin
  raise exception 'audit_events records are immutable after creation';
end;
$$ language plpgsql;

-- Drop old triggers if they exist
drop trigger if exists prevent_audit_update on public.audit_events;
drop trigger if exists prevent_audit_delete on public.audit_events;

-- Create new immutable triggers
create trigger prevent_audit_update
before update on public.audit_events
for each row
execute function audit_events_immutable();

create trigger prevent_audit_delete
before delete on public.audit_events
for each row
execute function audit_events_immutable();

-- ============================================================================
-- Indexes for performance
-- ============================================================================
create index if not exists idx_prove_fit_decisions_job_id on public.prove_fit_decisions(job_id);
create index if not exists idx_prove_fit_decisions_requirement_id on public.prove_fit_decisions(requirement_id);
create index if not exists idx_prove_fit_decisions_decision_type on public.prove_fit_decisions(decision_type);
create index if not exists idx_prove_fit_decisions_created_at on public.prove_fit_decisions(created_at);

create index if not exists idx_document_generation_traces_job_id on public.document_generation_traces(job_id);
create index if not exists idx_document_generation_traces_generation_timestamp on public.document_generation_traces(generation_timestamp);
