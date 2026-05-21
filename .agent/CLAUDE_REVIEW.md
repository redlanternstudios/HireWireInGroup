# Claude Review — Build Day 16 Stabilization

## Review Metadata

| Field | Value |
|---|---|
| Reviewer | Claude |
| Date | 2026-05-19 |
| Codex summary ref | N/A — Claude performed build + review (no Codex run this sprint) |
| Diff scope | `app/api/generate-documents/route.ts` (+4 lines), `.ai/` directory created, `~/.continue/config.json` created |
| Review result | **APPROVED** |

---

## Summary of Reviewed Diff

Prior to this session, Build Day 16's six tasks were already partially or fully resolved by earlier build-day work. The `generateStructuredText` helper in `lib/ai/gateway.ts` already handles structured output fallback by parsing `result.text` directly — no `experimental_output` is referenced anywhere in the route. All schema migrations (governance tables, jobs columns, quality checks) already exist in `supabase/migrations/20260516100000_fix_generation_pipeline_schema.sql` and `20260518120000_harden_generation_governance_persistence.sql` with full `IF NOT EXISTS` guards. The `GenerateButton` component already extracts `data.reason ?? data.detail ?? data.user_message ?? data.error ?? data.message` from the API response, fully surfacing governance block reasons. The governance block path in the main generation route already writes `generation_error: blockReason` and returns `{ success: false, error: "governance_blocked", detail: blockReason }` before the insert.

The only gap found in Task 3 (Supabase error logging): two early-exit status writes — the `evidence_required` and `profile_required` gate updates — used `await` without capturing or logging errors. Two lines were added to capture the error and pass it to the existing `logSupabaseWriteError` helper with `action`, `job_id`, and `user_id`.

---

## Verdict

**[x] APPROVED** — All acceptance criteria met. Ready for Ro review.

---

## Acceptance Criteria Check

| Criterion | Status | Notes |
|---|---|---|
| AC-1: Generate route no longer fails on json_schema rejection | PASS | `generateStructuredText` in `lib/ai/gateway.ts:268–293` already parses `result.text` as JSON fallback. No `experimental_output` references exist in the route. |
| AC-2: Governance blocked responses visible in UI | PASS | `GenerateButton` extracts `data.reason ?? data.detail ?? data.user_message ?? data.error ?? data.message` from the response body. The governance block path returns `detail: blockReason` at route line ~2039. |
| AC-3: Missing governance tables resolved by migration | PASS | `generation_governance_runs` and `generation_quality_checks` created with `CREATE TABLE IF NOT EXISTS` in `20260516100000_fix_generation_pipeline_schema.sql`. Idempotent by construction. |
| AC-4: Missing jobs columns resolved by migration | PASS | `generation_attempts`, `last_generation_at`, `resume_provenance`, `voice_integrity_passed`, `voice_review_status` all use `ADD COLUMN IF NOT EXISTS` in `20260516100000_fix_generation_pipeline_schema.sql`. |
| AC-5: Job updates do not fail from schema mismatch | PASS | Optional provenance/voice columns use the explicit `.then(() => {}, () => {})` swallow pattern (route line ~2304). The main jobs update only writes columns guaranteed by migration. |
| AC-6: Server logs include actionable Supabase error details | PASS | All critical writes now pass through `logSupabaseWriteError` with `action`, `job_id`, `user_id`. Two previously-unlogged gate writes (`evidence_required`, `profile_required`) fixed in this session. |
| AC-7: Successful generation saves all required fields | PASS | Route writes `generated_resume`, `generated_cover_letter`, `generation_status`, `quality_passed`, `evidence_map`, `score`, `generation_timestamp` in the main jobs update. Governance and quality check rows inserted after. |
| AC-8: TypeScript passes | PASS | `npx tsc --noEmit` exits with no output (code 0). |
| AC-9: Build passes | PASS | `npm run build` → `✓ Compiled successfully in 17.2s`. All 26 static pages generated. |

---

## Upstream Impact

`POST /api/generate-documents` is the only entry point. No upstream callers changed. The two logging additions are additive — they capture already-awaited error values and pass them to the existing logger. No behavior change on success or failure paths.

---

## Downstream Impact

- `jobs` table: `generation_status` and `generation_error` gate writes now have proper logging. If these writes fail silently, operators will now see `[hirewire:supabase-write]` log entries.
- `generation_governance_runs` table: unchanged. Already logged.
- `generation_quality_checks` table: unchanged. Already logged.
- `GenerateButton`: unchanged in this session (already correct).
- Readiness evaluator: not touched.
- Apply gate: not touched.

---

## Supabase / Schema Impact

No schema changes in this session. All migrations were already applied in prior build days.

| Table | Change | Idempotent | Rollback safe |
|---|---|---|---|
| `jobs` (logging only) | None — two `await` calls now capture and log errors | YES | YES |

---

## API Impact

No routes added, changed, or removed. No status codes changed. No request/response shape changes.

---

## UI Impact

No component changes. `GenerateButton` was already correct and was not modified.

---

## Tests Run

| Test | Command | Result | Output |
|---|---|---|---|
| TypeScript | `npx tsc --noEmit` | PASS | No output (exit 0) |
| Lint | `npm run lint` | PASS | No output (clean) |
| Build | `npm run build` | PASS | `✓ Compiled successfully in 17.2s`, 26 static pages generated |

---

## Remaining Risks

1. **Evidence event wiring incomplete**: Domain events are emitted for `documents_generated` and `quality_failed` but evidence library mutations (add/edit evidence) do not yet trigger readiness recompute. Tracked in project memory as deferred.
2. **`simulate_full_flow.ts` not in CI**: `tests/simulate_full_flow.ts` exists but is untracked and not wired into the build. End-to-end generation path has no automated test coverage.
3. **Supabase migration application pending**: Migrations exist locally but have not been confirmed applied to production. `20260516100000` and `20260518120000` must be applied before the generation route will function in production.
4. **`scripts/004_harden_evidence_source_types.sql` untracked**: This file is in `scripts/` not `supabase/migrations/`. Its contents and intent are unknown without review. Ro should confirm whether it needs to be moved to migrations.

---

## Notes to Ro

**All 9 acceptance criteria pass.** The sprint tasks were largely resolved by prior build-day work (governance pipeline, Build Day 17). The code is in a clean state.

Key findings worth knowing before sign-off:
- Task 1 was already done: `generateStructuredText` in `lib/ai/gateway.ts` handles structured output fallback internally. No `experimental_output` was ever in the route at the time of review.
- Task 2 was already done: The required migration SQL exists verbatim across two prior migrations. Running the CODEX_TASK.md migration would be a no-op due to `IF NOT EXISTS` guards.
- Task 5 was already done: `GenerateButton` already had the multi-field error extraction chain.
- The `.ai/` local agent operating layer was also scaffolded this session — see `.ai/README.md` for the master agent prompt. This is non-shipping infrastructure.

Three things need Ro action before production:
1. Apply `supabase/migrations/20260516100000_fix_generation_pipeline_schema.sql` to production if not already applied.
2. Review and decide on `scripts/004_harden_evidence_source_types.sql`.
3. Confirm or close out the evidence event wiring deferred item.
