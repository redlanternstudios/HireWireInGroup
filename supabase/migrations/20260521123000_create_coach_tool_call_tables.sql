create table if not exists public.coach_tool_calls (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  session_id text not null,
  tool_name text not null,
  conversation_turn integer,
  arguments jsonb not null default '{}'::jsonb,
  success boolean not null default false,
  error_message text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists coach_tool_calls_user_created_idx
  on public.coach_tool_calls (user_id, created_at desc);

create index if not exists coach_tool_calls_user_tool_created_idx
  on public.coach_tool_calls (user_id, tool_name, created_at desc);

create index if not exists coach_tool_calls_session_created_idx
  on public.coach_tool_calls (session_id, created_at desc);

create index if not exists coach_tool_calls_session_turn_idx
  on public.coach_tool_calls (session_id, conversation_turn, created_at desc);

alter table public.coach_tool_calls enable row level security;

drop policy if exists "Users can read own coach tool calls" on public.coach_tool_calls;
create policy "Users can read own coach tool calls"
  on public.coach_tool_calls for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own coach tool calls" on public.coach_tool_calls;
create policy "Users can insert own coach tool calls"
  on public.coach_tool_calls for insert
  with check (auth.uid() = user_id);

create table if not exists public.coach_tool_call_cache (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  session_id text not null,
  tool_call_id text not null,
  tool_name text not null,
  result jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  unique (user_id, session_id, tool_call_id, tool_name)
);

create index if not exists coach_tool_call_cache_expiry_idx
  on public.coach_tool_call_cache (expires_at);

alter table public.coach_tool_call_cache enable row level security;

drop policy if exists "Users can read own coach tool cache" on public.coach_tool_call_cache;
create policy "Users can read own coach tool cache"
  on public.coach_tool_call_cache for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own coach tool cache" on public.coach_tool_call_cache;
create policy "Users can insert own coach tool cache"
  on public.coach_tool_call_cache for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete own coach tool cache" on public.coach_tool_call_cache;
create policy "Users can delete own coach tool cache"
  on public.coach_tool_call_cache for delete
  using (auth.uid() = user_id);
