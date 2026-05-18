# HireWire Supabase Setup And Verification

## Current Status

The canonical database path is `supabase/migrations`.

Do not treat the older root `scripts/*.sql` files as the source of truth for
new environments unless a maintainer explicitly promotes one. Many of those
files are historical bootstrap or one-off repair scripts from earlier product
iterations.

The linked remote Supabase project has been pushed through:

```
20260518120000_harden_generation_governance_persistence
```

## Apply Migrations

For a fresh or drifted Supabase project:

```bash
supabase migration list
supabase db push --include-all
```

Use `--include-all` when the remote has migration-history entries that were
created before newer local migrations. Keep placeholder migrations for remote
history versions that already exist remotely.

## Required Tables

Core tables expected by the app:

| Table | Purpose |
|---|---|
| `jobs` | Job records, generated documents, generation lifecycle, readiness inputs, latest governance summary |
| `job_analyses` | Structured job analysis output |
| `job_scores` | Normalized score snapshots |
| `evidence_library` | Verified user evidence for matching and generation |
| `user_profile` | User profile and resume-derived context |
| `generation_governance_runs` | Per-generation governance audit |
| `governance_claim_verdicts` | Per-claim grounding verdicts |
| `generation_quality_checks` | Quality check audit rows |
| `context_sources` | ContextEngine source records |
| `context_evidence_items` | ContextEngine evidence graph items |
| `context_gap_matches` | Requirement/evidence gap matching |
| `context_claim_verdicts` | ContextEngine generated claim verdicts |
| `domain_events` | Workflow/domain event log |
| `run_ledger` | Legacy per-step observability log |
| `job_resume_versions` | Generated package version snapshots |

Legacy/compatibility tables may still exist, including `generated_documents`,
`processing_events`, and `profile_snapshots`. Do not read active generated
resume or cover letter content from `generated_documents`; use `jobs`.

## Required Job Columns

The app expects these generation/governance columns on `jobs`:

- `generation_status`
- `generation_error`
- `generated_resume`
- `generated_cover_letter`
- `quality_passed`
- `evidence_map`
- `resume_provenance`
- `voice_drift_result`
- `governance_version`
- `governance_passed`
- `governance_drift_score`
- `last_governance_run_id`

## RLS Pattern

User-scoped tables must enforce `auth.uid() = user_id` for reads and writes.
Server-side writes still include `user_id` explicitly so RLS and application
logic agree.

```sql
CREATE POLICY "users_select_own" ON table_name
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "users_insert_own" ON table_name
  FOR INSERT WITH CHECK (auth.uid() = user_id);
```

## Verification

Run:

```bash
supabase migration list
npm run test:api
npm run test:context
npx tsc --noEmit --pretty false
```

Expected migration state: local and remote should both include
`20260518120000`.

## Troubleshooting

### Remote migration versions not found locally

If `supabase db push` reports remote versions missing from local migrations,
add no-op placeholder files matching those versions or repair migration history
only when you are certain the remote entry should be marked reverted.

### Table or column not found

Check `supabase migration list` first. If the remote is behind, run
`supabase db push --include-all`.

### Governance writes fail

Confirm:

- `generation_governance_runs` exists.
- `governance_claim_verdicts` exists.
- `jobs.last_governance_run_id` has an FK to `generation_governance_runs`.
- RLS insert policies exist for authenticated user-scoped writes.

## Environment Variables

Required for Supabase:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

AI credentials are handled separately by `@/lib/ai/gateway`:

- `AI_GATEWAY_API_KEY` or `OPENAI_API_KEY`

Deprecated:

- `GROQ_API_KEY`
- n8n webhook env vars
