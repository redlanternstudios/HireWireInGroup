-- Roll back the private helper move before rolling back the main boundary repair.

create or replace function public.is_amina_member()
returns boolean language sql stable security definer set search_path to ''
as $$
  select (select auth.uid()) is not null and (
    exists (select 1 from public.amina_profiles ap where ap.id=(select auth.uid()) and ap.deleted_at is null)
    or exists (select 1 from public.circle_profiles cp where cp.user_id=(select auth.uid()))
  );
$$;

create or replace function public.is_hirewire_member()
returns boolean language sql stable security definer set search_path to ''
as $$
  select (select auth.uid()) is not null and (
    exists (select 1 from public.users u where u.id=(select auth.uid()))
    or exists (select 1 from public.jobs j where j.user_id=(select auth.uid()))
    or exists (select 1 from public.companies c where c.user_id=(select auth.uid()))
  );
$$;

revoke all on function public.is_amina_member() from public;
revoke all on function public.is_amina_member() from anon;
grant execute on function public.is_amina_member() to authenticated;
revoke all on function public.is_hirewire_member() from public;
revoke all on function public.is_hirewire_member() from anon;
grant execute on function public.is_hirewire_member() to authenticated;

drop policy if exists "profiles_select" on public.circle_profiles;
create policy "profiles_select" on public.circle_profiles for select to authenticated
using (public.is_amina_member() and (user_id=(select auth.uid()) or coalesce(is_private,false)=false));
drop policy if exists "feature_flags_select_authenticated" on public.feature_flags;
create policy "feature_flags_select_authenticated" on public.feature_flags for select to authenticated
using (public.is_hirewire_member());

-- Keep the private helpers until the main boundary rollback rewrites the three
-- public functions that depend on them. Leaving the equivalent private helpers
-- in place is safe and avoids a dependency failure during emergency rollback.
