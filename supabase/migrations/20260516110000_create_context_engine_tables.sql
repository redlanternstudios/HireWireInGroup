-- ContextEngine mirror tables.
-- Idempotent and non-destructive: these tables mirror existing app data so the
-- backbone can be validated side-by-side before becoming canonical.

create table if not exists public.context_sources (
  id text primary key,
  user_id uuid references auth.users(id) on delete cascade,
  source_type text not null,
  source_label text not null,
  source_url text,
  raw_text text not null,
  parsed_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.context_evidence_items (
  id text primary key,
  user_id uuid references auth.users(id) on delete cascade,
  source_id text references public.context_sources(id) on delete cascade,
  evidence_type text not null,
  raw_text text not null,
  normalized_value text not null,
  confidence text not null default 'medium',
  extraction_method text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.context_normalized_entities (
  id text primary key,
  user_id uuid references auth.users(id) on delete cascade,
  entity_type text not null,
  canonical_name text not null,
  aliases text[] not null default '{}',
  category text not null,
  confidence text not null default 'medium',
  ambiguity_flags text[] not null default '{}',
  evidence_ids text[] not null default '{}',
  created_at timestamptz not null default now()
);

create table if not exists public.context_capabilities (
  id text primary key,
  user_id uuid references auth.users(id) on delete cascade,
  capability_name text not null,
  capability_type text not null,
  inferred_from_evidence_ids text[] not null default '{}',
  reasoning_summary text not null,
  confidence text not null default 'medium',
  risk_level text not null default 'medium',
  allowed_usage text not null default 'interview_only',
  created_at timestamptz not null default now()
);

create table if not exists public.job_requirement_models (
  id text primary key,
  job_id uuid references public.jobs(id) on delete cascade,
  requirement_text text not null,
  normalized_requirement text not null,
  category text not null,
  importance text not null default 'medium',
  confidence text not null default 'medium',
  evidence_from_job_post text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.context_gap_matches (
  id text primary key,
  user_id uuid references auth.users(id) on delete cascade,
  job_id uuid references public.jobs(id) on delete cascade,
  requirement_id text references public.job_requirement_models(id) on delete cascade,
  match_type text not null,
  match_score numeric(5,2) not null default 0,
  evidence_ids text[] not null default '{}',
  explanation text not null,
  resume_permission text not null default 'blocked',
  cover_letter_permission text not null default 'coach_only',
  interview_permission text not null default 'interview_only',
  risk_level text not null default 'medium',
  created_at timestamptz not null default now()
);

create table if not exists public.context_claim_verdicts (
  id text primary key,
  user_id uuid references auth.users(id) on delete cascade,
  job_id uuid references public.jobs(id) on delete set null,
  generated_document_id uuid,
  claim_text text not null,
  verdict text not null,
  evidence_ids text[] not null default '{}',
  drift_score numeric(5,2) not null default 0,
  risk_flags text[] not null default '{}',
  suggested_rewrite text,
  created_at timestamptz not null default now()
);

create index if not exists idx_context_sources_user_id
  on public.context_sources(user_id);
create index if not exists idx_context_sources_source_type
  on public.context_sources(source_type);
create index if not exists idx_context_evidence_items_user_id
  on public.context_evidence_items(user_id);
create index if not exists idx_context_evidence_items_source_id
  on public.context_evidence_items(source_id);
create index if not exists idx_context_normalized_entities_user_id
  on public.context_normalized_entities(user_id);
create index if not exists idx_context_capabilities_user_id
  on public.context_capabilities(user_id);
create index if not exists idx_job_requirement_models_job_id
  on public.job_requirement_models(job_id);
create index if not exists idx_context_gap_matches_job_id
  on public.context_gap_matches(job_id);
create index if not exists idx_context_gap_matches_user_id
  on public.context_gap_matches(user_id);
create index if not exists idx_context_claim_verdicts_job_id
  on public.context_claim_verdicts(job_id);
create index if not exists idx_context_claim_verdicts_user_id
  on public.context_claim_verdicts(user_id);

alter table public.context_sources enable row level security;
alter table public.context_evidence_items enable row level security;
alter table public.context_normalized_entities enable row level security;
alter table public.context_capabilities enable row level security;
alter table public.job_requirement_models enable row level security;
alter table public.context_gap_matches enable row level security;
alter table public.context_claim_verdicts enable row level security;

drop policy if exists "Users can read own context sources" on public.context_sources;
create policy "Users can read own context sources"
  on public.context_sources for select using (auth.uid() = user_id);
drop policy if exists "Users can insert own context sources" on public.context_sources;
create policy "Users can insert own context sources"
  on public.context_sources for insert with check (auth.uid() = user_id);
drop policy if exists "Users can update own context sources" on public.context_sources;
create policy "Users can update own context sources"
  on public.context_sources for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "Users can read own context evidence" on public.context_evidence_items;
create policy "Users can read own context evidence"
  on public.context_evidence_items for select using (auth.uid() = user_id);
drop policy if exists "Users can insert own context evidence" on public.context_evidence_items;
create policy "Users can insert own context evidence"
  on public.context_evidence_items for insert with check (auth.uid() = user_id);
drop policy if exists "Users can update own context evidence" on public.context_evidence_items;
create policy "Users can update own context evidence"
  on public.context_evidence_items for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "Users can read own normalized entities" on public.context_normalized_entities;
create policy "Users can read own normalized entities"
  on public.context_normalized_entities for select using (auth.uid() = user_id);
drop policy if exists "Users can insert own normalized entities" on public.context_normalized_entities;
create policy "Users can insert own normalized entities"
  on public.context_normalized_entities for insert with check (auth.uid() = user_id);
drop policy if exists "Users can update own normalized entities" on public.context_normalized_entities;
create policy "Users can update own normalized entities"
  on public.context_normalized_entities for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "Users can read own context capabilities" on public.context_capabilities;
create policy "Users can read own context capabilities"
  on public.context_capabilities for select using (auth.uid() = user_id);
drop policy if exists "Users can insert own context capabilities" on public.context_capabilities;
create policy "Users can insert own context capabilities"
  on public.context_capabilities for insert with check (auth.uid() = user_id);
drop policy if exists "Users can update own context capabilities" on public.context_capabilities;
create policy "Users can update own context capabilities"
  on public.context_capabilities for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "Users can read own job requirement models" on public.job_requirement_models;
create policy "Users can read own job requirement models"
  on public.job_requirement_models for select using (
    exists (
      select 1 from public.jobs
      where jobs.id = job_requirement_models.job_id
        and jobs.user_id = auth.uid()
    )
  );
drop policy if exists "Users can insert own job requirement models" on public.job_requirement_models;
create policy "Users can insert own job requirement models"
  on public.job_requirement_models for insert with check (
    exists (
      select 1 from public.jobs
      where jobs.id = job_requirement_models.job_id
        and jobs.user_id = auth.uid()
    )
  );

drop policy if exists "Users can read own context gap matches" on public.context_gap_matches;
create policy "Users can read own context gap matches"
  on public.context_gap_matches for select using (auth.uid() = user_id);
drop policy if exists "Users can insert own context gap matches" on public.context_gap_matches;
create policy "Users can insert own context gap matches"
  on public.context_gap_matches for insert with check (auth.uid() = user_id);
drop policy if exists "Users can update own context gap matches" on public.context_gap_matches;
create policy "Users can update own context gap matches"
  on public.context_gap_matches for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "Users can read own context claim verdicts" on public.context_claim_verdicts;
create policy "Users can read own context claim verdicts"
  on public.context_claim_verdicts for select using (auth.uid() = user_id);
drop policy if exists "Users can insert own context claim verdicts" on public.context_claim_verdicts;
create policy "Users can insert own context claim verdicts"
  on public.context_claim_verdicts for insert with check (auth.uid() = user_id);

comment on table public.context_sources is 'ContextEngine mirror of raw source artifacts used for ATS-safe provenance.';
comment on table public.context_claim_verdicts is 'ContextEngine claim validation verdicts for generated output.';
