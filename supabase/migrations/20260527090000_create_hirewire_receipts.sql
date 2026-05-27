-- HireWire receipt-backed verification gate.
-- Append-only and safe to re-run. Receipts are separate from domain_events so
-- event lineage can stay focused on invalidation/recompute semantics.

create table if not exists public.hirewire_receipts (
  id uuid primary key default gen_random_uuid(),
  receipt_id text not null unique default ('receipt_' || gen_random_uuid()::text),
  user_id uuid not null references auth.users(id) on delete cascade,
  job_id uuid references public.jobs(id) on delete set null,
  domain_event_id text references public.domain_events(event_id) on delete set null,
  receipt_type text not null,
  action text not null,
  details jsonb not null default '{}'::jsonb,
  verification_hash text not null,
  parent_receipt_id uuid references public.hirewire_receipts(id) on delete set null,
  signer_key_id text,
  signature text,
  algo text,
  nonce text,
  submitted_by uuid references auth.users(id) on delete set null,
  delegation_level text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.hirewire_receipts
  add column if not exists receipt_id text not null default ('receipt_' || gen_random_uuid()::text),
  add column if not exists user_id uuid references auth.users(id) on delete cascade,
  add column if not exists job_id uuid references public.jobs(id) on delete set null,
  add column if not exists domain_event_id text references public.domain_events(event_id) on delete set null,
  add column if not exists receipt_type text,
  add column if not exists action text,
  add column if not exists details jsonb not null default '{}'::jsonb,
  add column if not exists verification_hash text,
  add column if not exists parent_receipt_id uuid references public.hirewire_receipts(id) on delete set null,
  add column if not exists signer_key_id text,
  add column if not exists signature text,
  add column if not exists algo text,
  add column if not exists nonce text,
  add column if not exists submitted_by uuid references auth.users(id) on delete set null,
  add column if not exists delegation_level text,
  add column if not exists metadata jsonb not null default '{}'::jsonb,
  add column if not exists created_at timestamptz not null default now();

create unique index if not exists hirewire_receipts_receipt_id_idx
  on public.hirewire_receipts (receipt_id);

create index if not exists hirewire_receipts_user_created_idx
  on public.hirewire_receipts (user_id, created_at desc);

create index if not exists hirewire_receipts_job_created_idx
  on public.hirewire_receipts (job_id, created_at desc)
  where job_id is not null;

create index if not exists hirewire_receipts_domain_event_idx
  on public.hirewire_receipts (domain_event_id)
  where domain_event_id is not null;

create index if not exists hirewire_receipts_type_created_idx
  on public.hirewire_receipts (receipt_type, created_at desc);

alter table public.hirewire_receipts enable row level security;

drop policy if exists "Users can read own hirewire receipts" on public.hirewire_receipts;
create policy "Users can read own hirewire receipts"
  on public.hirewire_receipts for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own hirewire receipts" on public.hirewire_receipts;
create policy "Users can insert own hirewire receipts"
  on public.hirewire_receipts for insert
  with check (auth.uid() = user_id);

drop policy if exists "hirewire receipts cannot update" on public.hirewire_receipts;
create policy "hirewire receipts cannot update"
  on public.hirewire_receipts for update
  using (false);

drop policy if exists "hirewire receipts cannot delete" on public.hirewire_receipts;
create policy "hirewire receipts cannot delete"
  on public.hirewire_receipts for delete
  using (false);

create or replace function public.prevent_hirewire_receipt_mutation()
returns trigger
language plpgsql
as $$
begin
  raise exception 'hirewire_receipts are append-only';
end;
$$;

drop trigger if exists prevent_hirewire_receipt_update_delete on public.hirewire_receipts;
create trigger prevent_hirewire_receipt_update_delete
  before update or delete on public.hirewire_receipts
  for each row execute function public.prevent_hirewire_receipt_mutation();

comment on table public.hirewire_receipts is
  'Append-only proof receipts for HireWire actions and verification gates. Linked to domain_events when available.';

comment on column public.hirewire_receipts.verification_hash is
  'SHA-256 hash of the canonical receipt payload. Signature fields are nullable until key management is enabled.';

notify pgrst, 'reload schema';
