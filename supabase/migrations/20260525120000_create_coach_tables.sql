-- Coach session, message, and evidence-draft tables.
-- Safe to re-run: CREATE TABLE IF NOT EXISTS + ADD COLUMN IF NOT EXISTS throughout.
-- These were originally created manually in Supabase; this migration makes them
-- source-controlled and ensures all columns the API routes depend on exist.

-- -------------------------------------------------------------
-- coach_sessions
-- -------------------------------------------------------------
create table if not exists public.coach_sessions (
  id                 uuid        primary key default gen_random_uuid(),
  user_id            uuid        not null references auth.users(id) on delete cascade,
  job_id             uuid        not null references public.jobs(id) on delete cascade,
  gap_requirement    text        not null default '',
  gap_requirement_id text,
  status             text        not null default 'active',
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

-- Ensure columns exist on pre-existing table
alter table public.coach_sessions
  add column if not exists user_id            uuid        references auth.users(id) on delete cascade,
  add column if not exists job_id             uuid        references public.jobs(id) on delete cascade,
  add column if not exists gap_requirement    text        not null default '',
  add column if not exists gap_requirement_id text,
  add column if not exists status             text        not null default 'active',
  add column if not exists created_at         timestamptz not null default now(),
  add column if not exists updated_at         timestamptz not null default now();

create index if not exists coach_sessions_user_job_idx
  on public.coach_sessions (user_id, job_id, created_at desc);

create index if not exists coach_sessions_requirement_anchor_idx
  on public.coach_sessions (user_id, job_id, gap_requirement_id, status);

alter table public.coach_sessions enable row level security;

drop policy if exists "Users own coach sessions"         on public.coach_sessions;
drop policy if exists "Users can read own coach sessions" on public.coach_sessions;
drop policy if exists "Users can insert own coach sessions" on public.coach_sessions;
drop policy if exists "Users can update own coach sessions" on public.coach_sessions;
drop policy if exists "coach_sessions_own" on public.coach_sessions;

create policy "Users own coach sessions"
  on public.coach_sessions
  for all
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- -------------------------------------------------------------
-- coach_messages
-- -------------------------------------------------------------
create table if not exists public.coach_messages (
  id         uuid        primary key default gen_random_uuid(),
  session_id uuid        not null references public.coach_sessions(id) on delete cascade,
  role       text        not null,
  content    text        not null default '',
  created_at timestamptz not null default now()
);

alter table public.coach_messages
  add column if not exists session_id uuid        references public.coach_sessions(id) on delete cascade,
  add column if not exists role       text        not null default 'assistant',
  add column if not exists content    text        not null default '',
  add column if not exists created_at timestamptz not null default now();

create index if not exists coach_messages_session_created_idx
  on public.coach_messages (session_id, created_at asc);

alter table public.coach_messages enable row level security;

drop policy if exists "Users own coach messages"          on public.coach_messages;
drop policy if exists "Users can read own coach messages"  on public.coach_messages;
drop policy if exists "Users can insert own coach messages" on public.coach_messages;
drop policy if exists "coach_messages_own" on public.coach_messages;

create policy "Users own coach messages"
  on public.coach_messages
  for all
  using (
    exists (
      select 1 from public.coach_sessions s
      where s.id = coach_messages.session_id
        and s.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.coach_sessions s
      where s.id = coach_messages.session_id
        and s.user_id = auth.uid()
    )
  );

-- -------------------------------------------------------------
-- coach_evidence_drafts
-- -------------------------------------------------------------
create table if not exists public.coach_evidence_drafts (
  id               uuid        primary key default gen_random_uuid(),
  session_id       uuid        not null references public.coach_sessions(id) on delete cascade,
  user_id          uuid        not null references auth.users(id) on delete cascade,
  job_id           uuid        references public.jobs(id) on delete cascade,
  requirement_id   text,
  source_title     text,
  source_type      text,
  proof_snippet    text,
  confidence_level text,
  skills           text[]      not null default '{}',
  status           text        not null default 'pending',
  confirmed_row_id uuid        references public.evidence_library(id) on delete set null,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

alter table public.coach_evidence_drafts
  add column if not exists session_id       uuid        references public.coach_sessions(id) on delete cascade,
  add column if not exists user_id          uuid        references auth.users(id) on delete cascade,
  add column if not exists job_id           uuid        references public.jobs(id) on delete cascade,
  add column if not exists requirement_id   text,
  add column if not exists source_title     text,
  add column if not exists source_type      text,
  add column if not exists proof_snippet    text,
  add column if not exists confidence_level text,
  add column if not exists skills           text[]      not null default '{}',
  add column if not exists status           text        not null default 'pending',
  add column if not exists confirmed_row_id uuid        references public.evidence_library(id) on delete set null,
  add column if not exists created_at       timestamptz not null default now(),
  add column if not exists updated_at       timestamptz not null default now();

create index if not exists coach_evidence_drafts_session_idx
  on public.coach_evidence_drafts (session_id, created_at desc);

create index if not exists coach_evidence_drafts_user_idx
  on public.coach_evidence_drafts (user_id, status, created_at desc);

create index if not exists coach_evidence_drafts_requirement_anchor_idx
  on public.coach_evidence_drafts (user_id, job_id, requirement_id, status);

alter table public.coach_evidence_drafts enable row level security;

drop policy if exists "Users own coach evidence drafts"            on public.coach_evidence_drafts;
drop policy if exists "Users can read own coach evidence drafts"   on public.coach_evidence_drafts;
drop policy if exists "Users can insert own coach evidence drafts" on public.coach_evidence_drafts;
drop policy if exists "Users can update own coach evidence drafts" on public.coach_evidence_drafts;
drop policy if exists "coach_drafts_own" on public.coach_evidence_drafts;

create policy "Users own coach evidence drafts"
  on public.coach_evidence_drafts
  for all
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);

notify pgrst, 'reload schema';
