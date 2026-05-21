# Acceptance Criteria — Build Day 16 Stabilization

Each criterion has a pass condition, a fail condition, and a test method.
All criteria must PASS before the sprint is considered complete.

---

## AC-1: Structured Output — No 400 on json_schema Rejection

**Pass:** `POST /api/generate-documents` completes successfully when the configured AI model does not support `json_schema` structured output format. The route parses the text response as JSON and continues generation.

**Fail:** The route returns 400 or 500 because `result.experimental_output` is `undefined` and the code throws accessing it.

**Test method:**
- Set `OPENAI_MODEL` to a model that does not support structured output (or mock the AI call to return `{ text: '{"key":"val"}', experimental_output: undefined }`)
- POST to `/api/generate-documents` with a valid job and evidence
- Expect 200 response
- Expect `jobs.generated_resume` to be populated

---

## AC-2: Governance Block — UI Shows Real Reason

**Pass:** When generation is blocked by governance (fabricated claims or drift above threshold), the `GenerateButton` in the UI displays the specific block reason returned by the API (e.g. "Generation blocked by drift score (82/100)"). The generic fallback message is used only when no structured reason is available.

**Fail:** The button shows "Generation failed" or a static string regardless of what the API returned.

**Test method:**
- Trigger a governance-blocked generation (or mock the route to return `{ success: false, blocked: true, reason: "Test block reason" }`)
- Observe the error message displayed in the button/UI
- Expect to see the reason string from the response body

---

## AC-3: Missing Governance Tables Resolved by Migration

**Pass:** The migration file in `supabase/migrations/` creates `generation_governance_runs` and `generation_quality_checks` with `CREATE TABLE IF NOT EXISTS`. Running the migration twice does not error.

**Fail:** Migration uses `CREATE TABLE` without `IF NOT EXISTS`, or fails on a second run, or does not create the required tables.

**Test method:**
- Run the migration SQL against a blank Supabase project
- Run it again
- Expect both runs to succeed with no errors
- Confirm both tables exist with the required columns

---

## AC-4: Missing Jobs Columns Resolved by Migration

**Pass:** The migration adds `generation_attempts`, `last_generation_at`, `resume_provenance`, `voice_integrity_passed`, `voice_review_status` to the `jobs` table using `ADD COLUMN IF NOT EXISTS`. Environments where these columns already exist are unaffected.

**Fail:** Migration uses `ADD COLUMN` without `IF NOT EXISTS`, or fails when columns already exist.

**Test method:**
- Run the migration against an environment with the columns already present
- Expect no errors
- Confirm column types match the values written by the generation route

---

## AC-5: Job Updates Do Not Fail from Schema Mismatch

**Pass:** The final `jobs` update in the generation route succeeds in all environments, including those where optional columns (`resume_provenance`, `voice_integrity_passed`, `voice_review_status`) are absent. These columns are either written in a non-critical secondary update (with error swallowing) OR the migration guarantees their existence.

**Fail:** A missing column causes the main `jobs` update to fail, triggering the `if (updateError) return 500` path, even when generation completed successfully.

**Test method:**
- Run generation in an environment without the optional columns (before migration)
- Expect 200 and populated `generated_resume` / `generated_cover_letter`
- Expect server logs to show no `JOB_UPDATE_FAILED` error

---

## AC-6: Server Logs Include Actionable Supabase Error Details

**Pass:** Every Supabase write error that surfaces in the route passes through `logSupabaseWriteError` (or equivalent) and includes at minimum: `action`, `job_id`, `user_id`, `message`, `code`. Silent swallows (`.then(() => {}, () => {})`) are reserved only for intentionally non-critical writes.

**Fail:** A Supabase error that affects generation outcome is silently discarded with no log entry.

**Test method:**
- Introduce a deliberate write error (e.g. invalid column) in a test environment
- Observe server logs
- Expect to see `[hirewire:supabase-write]` entry with `action` and `job_id`

---

## AC-7: Successful Generation Saves All Required Fields

**Pass:** A successful generation writes all of the following to the `jobs` row:
- `generated_resume` (non-empty string)
- `generated_cover_letter` (non-empty string)
- `generation_status: "ready"` (or `"needs_review"` if quality failed)
- `quality_passed` (boolean)
- `evidence_map` (JSONB with `matching_complete: true`)
- `score` (number)
- `generation_timestamp` (ISO timestamp)

And writes to:
- `generation_governance_runs` (one row per generation attempt)
- `generation_quality_checks` (one row per generation attempt)

**Fail:** Any of the above fields or rows are absent after a successful generation.

**Test method:**
- Run generation end-to-end with valid job + evidence
- Query Supabase for the job row and the related governance/quality rows
- Verify all fields are present and non-null

---

## AC-8: TypeScript Passes

**Pass:** `npx tsc --noEmit` exits with code 0 and no errors in files touched by this sprint.

**Fail:** `npx tsc --noEmit` reports errors in `app/api/generate-documents/route.ts`, `app/(dashboard)/jobs/[id]/GenerateButton.tsx`, or any new migration-related files.

**Note:** Pre-existing TypeScript errors in unrelated files (e.g. `app/(dashboard)/jobs/page.tsx`) do not block this criterion, but must be documented if present.

**Test method:**
```bash
npx tsc --noEmit
```
Expect: no output (exit 0) or only pre-existing errors in unrelated files.

---

## AC-9: Build Passes

**Pass:** `npm run build` succeeds. If it fails, all failures are pre-existing and documented with file paths and error messages.

**Fail:** `npm run build` fails due to a change introduced in this sprint.

**Test method:**
```bash
npm run build
```
Expect: `✓ Compiled successfully` or equivalent Next.js build success output.

---

## Definition of Done

All 9 criteria must be marked PASS in `.agent/CLAUDE_REVIEW.md` before Ro approves the sprint.

If a criterion is NOT TESTED, it does not count as PASS.

If a criterion is FAIL, it must appear in the "Required Fixes" section of `.agent/CLAUDE_REVIEW.md`.
