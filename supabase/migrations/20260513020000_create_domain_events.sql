-- Domain Events table
--
-- Stores all canonical domain events emitted by HireWire mutations.
-- Every important state change (document edit, apply, quality pass/fail,
-- package review, evidence change, etc.) writes a row here.
--
-- The audit_events table remains as a lightweight fallback for events
-- that predate this system. This table is the primary event store.

create table if not exists domain_events (
  id              bigserial primary key,
  event_id        text        not null unique,
  event_type      text        not null,
  job_id          uuid        references jobs(id) on delete set null,
  user_id         uuid        not null references auth.users(id) on delete cascade,
  source          text        not null,
  payload         jsonb       not null default '{}'::jsonb,
  invalidates     text[]      not null default '{}',
  recomputes      text[]      not null default '{}',
  affected_routes text[]      not null default '{}',
  severity        text        not null default 'info'
                              check (severity in ('info', 'warning', 'error', 'critical')),
  metadata        jsonb       not null default '{}'::jsonb,
  created_at      timestamptz not null default now()
);

-- Indexes for the most common query patterns
create index if not exists domain_events_user_id_idx
  on domain_events (user_id, created_at desc);

create index if not exists domain_events_job_id_idx
  on domain_events (job_id, created_at desc)
  where job_id is not null;

create index if not exists domain_events_event_type_idx
  on domain_events (event_type, created_at desc);

-- RLS: users see only their own events
alter table domain_events enable row level security;

create policy "Users can read own domain events"
  on domain_events for select
  using (auth.uid() = user_id);

-- Service role inserts (server actions use the anon key + user context,
-- but the insert itself must succeed for the authenticated user).
create policy "Users can insert own domain events"
  on domain_events for insert
  with check (auth.uid() = user_id);
