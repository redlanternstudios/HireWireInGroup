# HireWire → dedicated Supabase project — migration plan (SCOPING, not executed)

**Status:** proposal for sign-off. Nothing in here has been run. This is an
architecture change → also log to the Notion Decision Log once approved.

## Why

HireWire currently shares Supabase project `endovljmaudnxdzdapmf` with **four other
products** — Amina (`amina_*`, `quran`, `circle_*`, `dua_*`, `rituals`), Deixis
Gallery (`deixis_*`), By Red OS (`os_*`, `byred_*`), and Lantern (`lantern_*`) —
all on a single `auth.users` and a single GoTrue auth config. Concrete harm we've
already hit:

- **One shared auth-email identity.** `smtp_sender_name = "Amina"`, `site_url =
  https://myamina.app`. HireWire's confirmation emails arrive *From: "Amina"* and
  cannot be fixed without breaking the other apps (these fields are project-global).
- **One shared email rate limit.** `rate_limit_email_sent` throttles all five
  products together; HireWire signups silently failed under `over_email_send_rate_limit`
  until we raised it. Any co-tenant spike re-breaks HireWire signup.
- **Blast radius.** Every auth/config/RLS change risks four unrelated products.
- **No tenant isolation at the project level** — only per-row RLS separates them.

Target: HireWire on its own Supabase project with its own auth identity, SMTP
sender, redirect allow-list, rate limits, and RLS surface.

## Scope — what moves

**HireWire-owned tables** (core; confirm against a live dependency scan before cutover):
`user_profile`, `user_profile_links`, `profile_links`, `profile_completeness`,
`profile_snapshots`, `pending_profile_changes`, `profile_change_audit`,
`source_resumes`, `resumes`, `evidence_library`, `evidence_relationships`,
`jobs`, `job_analyses`, `job_scores`, `job_requirement_models`, `job_resume_versions`,
`applications`, `application_events`, `application_outcomes`, `follow_ups`,
`coach_sessions`, `coach_messages`, `coach_memory`, `coach_evidence_drafts`,
`coach_gap_queue`, `coach_tool_calls`, `coach_tool_call_cache`,
`prove_fit_decisions`, `gap_resolution_log`, `generated_documents`, `generated_claims`,
`document_generation_traces`, `generation_governance_runs`, `generation_quality_checks`,
`governance_claim_verdicts`, `hirewire_receipts`, `interview_prep`, `interview_bank`,
`context_*` (career-context engine, 7 tables), `user_intelligence`,
`user_career_patterns`, `user_education_records`, `user_facts`, `companies`,
`entitlements`, `subscriptions`, `usage_records`, `pricing_plans`, `waitlist`,
`notification_*`, `domain_events`, `audit_events`, `ai_generation_audit_logs`,
`ai_routing_decisions`, `run_ledger`, `feature_flags`/`flag_overrides` (HireWire subset).

**Explicitly NOT moving** (other products; leave in place): `amina_*`, `quran`,
`rituals`, `circle_*`, `dua_*`, `daily_reflection_*`, `reflection_images`,
`cultural_context_kb`, `deixis_*`, `os_*`, `byred_*`, `lantern_*`.

**Ambiguous — must classify before migrating** (shared/generic names): `users`,
`profiles`/`profiles_deprecated`, `documents`, `leads`, `moderation_queue`,
`config_values`, `dm_*`, `guidance_articles`, `home_feed_snapshot`. Do a column +
FK + code-reference audit on each; do not assume.

## The hard part: `auth.users`

All five products share one `auth.users`. HireWire users are intermingled. Options:

1. **Full Supabase project migration** (Supabase's `pg_dump`/restore + auth export)
   then *delete* non-HireWire data — clean end state, heaviest lift, and it
   duplicates the other products' auth users into the new project (must be pruned).
2. **Selective auth export** — export only `auth.users` rows that own HireWire
   `user_profile` rows, re-import into the new project (preserving `id`s so all FKs
   hold), migrate only HireWire tables. Cleaner separation, more scripting.
3. **Fresh start + re-auth** — new project, migrate app data keyed by `user_id`,
   require users to re-verify email on first login. Simplest data path, worst UX.

**Recommended: option 2.** Preserve user UUIDs so every `user_id` FK survives; move
only HireWire's auth users + tables. ~8 real users today (low volume — this is the
cheapest it will ever be to do).

## Phased execution (each phase gated by sign-off)

1. **Inventory & classify** — automated scan: for each table, (a) code references in
   the HireWire repo, (b) FK graph, (c) row-owner overlap with `user_profile`.
   Produce a definitive move/keep/split list. *(read-only)*
2. **Provision** new project `hirewire` (By Red org), pgvector + extensions, Storage
   buckets (`brand`, resume uploads), Auth config: HireWire SMTP sender, `site_url =
   https://hirewire.org` (or the chosen domain), redirect allow-list, own rate limits,
   HireWire email templates (already authored). *(new project — no prod impact)*
3. **Schema migration** — apply HireWire DDL (tables, RLS policies, functions,
   triggers, sequences) to the new project. Diff against source to confirm parity.
4. **Dry-run data copy** — copy auth-users subset + HireWire tables into the new
   project in a maintenance window rehearsal; verify row counts, FK integrity, a
   full E2E (signup → onboarding → analyze → generate) against the new project.
   *(no cutover yet)*
5. **Cutover** — freeze writes briefly, final delta copy, repoint the app's
   `NEXT_PUBLIC_SUPABASE_URL` / anon / service keys (+ `AI_GATEWAY`/others unchanged)
   in Vercel, update Supabase redirect URLs + OAuth callbacks, deploy. Run the
   onboarding e2e against prod. Keep the old project intact as rollback.
6. **Verify & monitor** — auth logs, email delivery (now From: HireWire), a real
   signup, generation spine. Hold 1–2 weeks.
7. **Decommission** — only after a clean hold: remove HireWire tables/users from the
   old shared project (reduces its RLS surface and co-tenant risk).

## Rollback

Until Phase 7, the old project is untouched and authoritative — rollback = repoint
env back + redeploy. After Phase 7, rollback needs the pre-decommission backup.

## Risks / call-outs

- **`user_id` FK integrity** is the whole ballgame — preserve UUIDs (option 2).
- **Storage**: resume uploads + the `brand` bucket (email logo) must move; the email
  templates reference `endovljmaudnxdzdapmf.supabase.co/storage/...` and must be
  re-pointed to the new project's public URL.
- **Stripe**: `subscriptions`/`entitlements`/webhook `customer` mapping travels with
  the data; verify the webhook still resolves users post-cutover.
- **Edge functions / cron** scoped to HireWire must be redeployed to the new project.
- **The shared `os_*`/`byred_*` tables here contradict the memory that By Red OS lives
  in `mlmrdkiyxlngmwhdtrln`** — confirm which project By Red OS actually reads before
  assuming those rows are inert.

## Decision needed from you

- Confirm the **target domain** (`hirewire.org`?) for `site_url` + redirect URLs.
- Approve **option 2** (selective auth export, preserve UUIDs) vs. 1 or 3.
- Green-light **Phase 1 (inventory, read-only)** — I can run that now and come back
  with the definitive move/keep list before anything is provisioned or copied.
