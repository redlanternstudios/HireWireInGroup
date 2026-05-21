do $$
begin
  if to_regclass('public.coach_evidence_drafts') is not null then
    alter table public.coach_evidence_drafts
      add column if not exists job_id uuid references public.jobs(id) on delete cascade,
      add column if not exists requirement_id text;

    update public.coach_evidence_drafts draft
    set
      job_id = coalesce(draft.job_id, session.job_id),
      requirement_id = coalesce(draft.requirement_id, session.gap_requirement_id)
    from public.coach_sessions session
    where draft.session_id = session.id
      and (draft.job_id is null or draft.requirement_id is null);

    create index if not exists coach_evidence_drafts_requirement_anchor_idx
      on public.coach_evidence_drafts (user_id, job_id, requirement_id, status);
  end if;
end $$;
