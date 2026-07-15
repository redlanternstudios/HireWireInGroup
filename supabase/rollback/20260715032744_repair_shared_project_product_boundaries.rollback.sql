-- Emergency rollback for 20260715032744_repair_shared_project_product_boundaries.sql.
-- This restores the exact permissive access behavior that existed before the repair.

drop policy if exists "profiles_select" on public.circle_profiles;
create policy "profiles_select"
  on public.circle_profiles
  for select
  to authenticated
  using (true);

drop policy if exists "feature_flags_select_authenticated" on public.feature_flags;
create policy "feature_flags_select_authenticated"
  on public.feature_flags
  for select
  to authenticated
  using (true);

create policy "companies_select_authenticated"
  on public.companies
  for select
  to authenticated
  using (true);

create policy "companies_insert_authenticated"
  on public.companies
  for insert
  to authenticated
  with check (true);

create or replace function public.is_feature_enabled(p_flag_key text, p_user_id uuid default null)
returns boolean
language plpgsql
stable
security definer
set search_path to 'public'
as $$
declare
  v_status text;
  v_override boolean;
begin
  select enabled into v_override
  from public.flag_overrides
  where flag_key = p_flag_key and scope = 'user' and scope_id = p_user_id
  limit 1;
  if found then return v_override; end if;

  select enabled into v_override
  from public.flag_overrides
  where flag_key = p_flag_key and scope = 'global' and scope_id is null
  limit 1;
  if found then return v_override; end if;

  select status into v_status
  from public.feature_flags
  where flag_key = p_flag_key
  limit 1;
  return coalesce(v_status = 'enabled', false);
end;
$$;

grant execute on function public.is_feature_enabled(text, uuid) to public;

create or replace function public.home_feed(p_limit integer default 30)
returns table(id uuid, item_type text, source_id uuid, display_text text, ameen_count integer, heart_count integer)
language sql
stable
security definer
set search_path to 'public'
as $$
  select s.id, s.item_type, s.source_id, s.display_text, s.ameen_count, s.heart_count
  from home_feed_snapshot s
  where s.author_id is null
     or auth.uid() is null
     or not exists (
       select 1 from amina_user_blocks b
       where b.blocker_id = auth.uid() and b.blocked_user_id = s.author_id
     )
  order by s.rank desc
  limit least(p_limit, 50);
$$;

create or replace function public.amina_submit_safety_report(
  p_target_type text,
  p_target_id uuid,
  p_reason text,
  p_details text default null
)
returns public.amina_safety_reports
language plpgsql
security definer
set search_path to ''
as $$
declare
  uid uuid := (select auth.uid());
  r public.amina_safety_reports;
  sev text;
  remove_globally boolean;
  automatic_action text;
begin
  if uid is null then raise exception 'Authentication required'; end if;
  if p_target_type not in ('user','circle_post','circle_comment','circle_message','dua') then raise exception 'Unsupported report target'; end if;
  if p_reason not in ('harassment','hate','sexual_content','violence','self_harm','grooming','impersonation','religious_misinformation','privacy','spam','other') then raise exception 'Unsupported report reason'; end if;
  sev := case when p_reason in ('grooming','violence','self_harm') then 'urgent' when p_reason in ('sexual_content','hate','privacy') then 'high' else 'medium' end;
  remove_globally := p_reason in ('harassment','hate','sexual_content','violence','self_harm','grooming','impersonation','privacy','spam');
  automatic_action := case when p_target_type='user' then 'report_recorded_user_block_available' when remove_globally then 'removed_globally' else 'hidden_from_reporter' end;
  insert into public.amina_safety_reports(reporter_id,target_type,target_id,reason,details,status,automated_action,resolved_at)
  values(uid,p_target_type,p_target_id,p_reason,left(nullif(trim(p_details),''),1000),'actioned',automatic_action,now()) returning * into r;
  insert into public.amina_moderation_cases(report_id,target_type,target_id,severity,reasons,status,resolution_note,reviewed_at)
  values(r.id,p_target_type,p_target_id,sev,array[p_reason],'actioned','Automated policy action: '||automatic_action,now());
  if remove_globally and p_target_type='circle_message' then
    update public.circle_messages set moderation_status='removed' where id=p_target_id;
  elsif remove_globally and p_target_type='circle_post' then
    update public.circle_posts set moderation_status='removed' where id=p_target_id;
  elsif remove_globally and p_target_type='circle_comment' then
    update public.circle_comments set moderation_status='removed' where id=p_target_id;
    update public.circle_post_comments set moderation_status='removed' where id=p_target_id;
  end if;
  return r;
end;
$$;

drop function if exists public.is_amina_member();
drop function if exists public.is_hirewire_member();

notify pgrst, 'reload schema';
