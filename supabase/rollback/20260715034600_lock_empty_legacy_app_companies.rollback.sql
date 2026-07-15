grant select, insert, update, delete on table app.companies to authenticated;
create policy "auth_all" on app.companies for all to authenticated using (true) with check (true);
