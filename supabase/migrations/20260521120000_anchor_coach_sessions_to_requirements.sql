do $$
begin
  if to_regclass('public.coach_sessions') is not null then
    alter table public.coach_sessions
      add column if not exists gap_requirement_id text;

    create index if not exists coach_sessions_requirement_anchor_idx
      on public.coach_sessions (user_id, job_id, gap_requirement_id, status);
  end if;
end $$;
