# Codex Task — Build Day 16 Stabilization

## Builder Instructions

Read `.agent/BUILD_CONTEXT.md` before starting. Read `.agent/ACCEPTANCE_CRITERIA.md` before finishing.

Do not expand scope beyond this task file. If you find a related issue not listed here, note it in your summary but do not fix it without approval.

---

## Task 1: Structured Output Fallback

**File:** `app/api/generate-documents/route.ts`

**Problem:** `Output.object({ schema })` requires the AI provider to support `json_schema` response format. When it does not, `generateText` returns a text response and `result.experimental_output` is `undefined`. The current code asserts `result.experimental_output!` in three places, which throws and returns 400.

**Required fix:**

Add a `parseStructuredOutput<T>` helper that:
1. Returns `result.experimental_output` when present
2. Falls back to parsing `result.text` as JSON when `experimental_output` is undefined
3. Strips markdown code fences before parsing (```` ```json ... ``` ````)
4. Validates the parsed object against the Zod schema
5. Throws a descriptive error if parsing fails (do not silently return empty data)

Replace these three accesses with calls to the helper:
- `evidenceMapResult.experimental_output!` → `parseStructuredOutput(evidenceMapResult, EvidenceMapSchema)`
- `resumeResult.experimental_output!` → `parseStructuredOutput(resumeResult, ResumeWithProvenanceSchema)`
- `coverLetterResult.experimental_output!` → `parseStructuredOutput(coverLetterResult, CoverLetterWithProvenanceSchema)`

The fourth `qualityResult.experimental_output!` is already inside a try/catch — leave it alone.

**Constraint:** Do not remove `Output.object({ schema })` from the `generateText` calls. Keep it — it activates structured output for models that support it. The fallback handles models that don't.

---

## Task 2: Supabase Schema Drift — Safe Migration

**File:** `supabase/migrations/<timestamp>_stabilize_generation_pipeline.sql`

**Problem:** The generation route writes columns that may not exist in all environments.

**Required migration — must be idempotent (safe to run multiple times):**

```sql
-- Add generation counter columns if absent
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS generation_attempts integer DEFAULT 0;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS last_generation_at timestamptz;

-- Add provenance column if absent
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS resume_provenance jsonb;

-- Add voice integrity columns if absent
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS voice_integrity_passed boolean;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS voice_review_status text;

-- Ensure governance table exists
CREATE TABLE IF NOT EXISTS generation_governance_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  job_id uuid NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  strategy text,
  strategy_decision jsonb,
  bullet_verdicts jsonb,
  paragraph_verdicts jsonb,
  fabricated_count integer DEFAULT 0,
  low_confidence_count integer DEFAULT 0,
  drift_score numeric,
  drift_is_blocking boolean DEFAULT false,
  drift_flags jsonb,
  drift_summary text,
  governance_passed boolean NOT NULL,
  failed_at_phase text,
  governance_version text,
  created_at timestamptz DEFAULT now()
);

-- Ensure quality checks table exists
CREATE TABLE IF NOT EXISTS generation_quality_checks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  job_id uuid NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  document_type text,
  invented_claims_found jsonb DEFAULT '[]',
  vague_bullets_found jsonb DEFAULT '[]',
  ai_filler_found jsonb DEFAULT '[]',
  repeated_structures_found jsonb DEFAULT '[]',
  unsupported_claims_found jsonb DEFAULT '[]',
  passed boolean NOT NULL DEFAULT false,
  issues_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Index for fast job-scoped lookups
CREATE INDEX IF NOT EXISTS idx_governance_runs_job_id ON generation_governance_runs(job_id);
CREATE INDEX IF NOT EXISTS idx_quality_checks_job_id ON generation_quality_checks(job_id);
```

**Constraint:** Every statement must use `IF NOT EXISTS` or `IF EXISTS`. The migration must not fail if run twice.

---

## Task 3: Supabase Error Logging Improvement

**File:** `app/api/generate-documents/route.ts`

**Problem:** Supabase write errors are logged but the message format is inconsistent and some error paths are silent.

**Required fix:**

Audit every `supabase.from(...).update(...)`, `supabase.from(...).insert(...)` call in the route. For each one:
- If the error is already passed to `logSupabaseWriteError`, leave it.
- If the error is silently ignored (`.then(() => {}, () => {})`), leave it — those are intentionally non-critical.
- If the error is checked with `if (updateError) return NextResponse.json(...)`, ensure the log includes `action`, `job_id`, and `user_id`.

Do not change the error response format or status codes. Only improve the log payload.

---

## Task 4: Governance Blocked — Preserve Behavior

**File:** `app/api/generate-documents/route.ts`

**Problem:** When governance blocks generation, the route writes `generation_status: "failed"` and `generation_error: <reason>` to the jobs table and returns early. This behavior must be preserved exactly.

**Required check (not a fix unless broken):**

Verify:
1. The governance block path writes `generation_error` with the block reason string before returning.
2. The blocked response body includes `{ success: false, reason: <string>, blocked: true }` (or equivalent).
3. The `generation_governance_runs` insert on the blocked path uses `.then(() => {}, () => {})` to avoid crashing if the table doesn't exist yet.

If any of these three conditions are not met, fix only those conditions.

---

## Task 5: GenerateButton — Surface Real Error Message

**File:** `app/(dashboard)/jobs/[id]/GenerateButton.tsx`

**Problem:** On generation failure, the button shows a generic error string. The backend returns a structured body with a `reason` or `error` field. The button does not read it.

**Required fix:**

In the fetch handler for `POST /api/generate-documents`:
1. Parse the response body as JSON on non-2xx responses.
2. Extract `data.reason ?? data.error ?? data.message ?? "Generation failed"` from the parsed body.
3. Display that string in the error state (wherever the current generic message is shown).

Do not change button styling, loading state, or success behavior.

---

## Task 6: TypeScript and Build Verification

After all changes:

1. Run `npx tsc --noEmit` and report all errors.
2. Run `npm run lint` and report all errors.
3. Run `npm run build` and report result.
4. If any command cannot be run, document why.

Leave the output of each command in your task summary.

---

## Completion Summary Format

When done, leave a summary at the top of this file (do not overwrite — prepend) in this format:

```
## Codex Completion Summary — [date]

### Status: COMPLETE / PARTIAL / BLOCKED

### Changes Made
- [file]: [what changed]

### Tests Run
- tsc: PASS / FAIL (N errors)
- lint: PASS / FAIL (N errors)  
- build: PASS / FAIL

### Known Issues Not Fixed
- [issue]: [reason not fixed]

### Reviewer Notes
[anything Claude should pay attention to in the diff]
```
