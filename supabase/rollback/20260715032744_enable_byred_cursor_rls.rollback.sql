-- Emergency rollback for the By Red cursor table repair.
grant all privileges on table public.byred_board_sync_cursors to anon;
grant all privileges on table public.byred_board_sync_cursors to authenticated;
alter table public.byred_board_sync_cursors disable row level security;
