-- Outcome learning feedback from application results into Career Context.
-- Safe to re-run.

alter table public.user_profile
  add column if not exists career_context jsonb not null default '{}'::jsonb;
