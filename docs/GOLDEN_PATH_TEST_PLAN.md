# Golden Path Test Plan

**Product:** HireWire — AI-powered job application engine  
**Date:** 2026-05-08  
**Purpose:** Allow a human tester (or automated test suite) to walk the full golden path and verify every database row and UI state.

---

## Prerequisites

Before running these tests, ensure:

1. Supabase project is running with all migrations applied (`scripts/001` through latest).
2. Vercel AI Gateway is configured (Anthropic Claude access).
3. A test user account exists (or create one during the test).
4. Evidence library is populated (at least 2–3 evidence records).

---

## Step 1: Sign In

**Action:** Navigate to `/login`, sign in with email + password (or Google OAuth).

**Verify:**
- [ ] Redirect to `/` (dashboard) on success
- [ ] `supabase.auth.getUser()` returns a valid user
- [ ] Middleware allows access to protected routes

**DB check:** No row written at this step.

---

## Step 2: Add Job URL

**Action:** Navigate to `/jobs/new` or submit a job URL from the dashboard.

**Input:** A real job posting URL (e.g. Greenhouse, Lever, Workday).

**Verify:**
- [ ] Loading state displayed during analysis
- [ ] On success: redirect to `/jobs/[id]`
- [ ] Error state displayed for invalid URLs or blocked pages (e.g. LinkedIn profile URL)

**DB rows to confirm:**
- `jobs` table: new row with `user_id`, `role_title`, `company_name`, `source_url` (`job_url`), `status = "analyzed"`
- `job_analyses` table: new row with `job_id`, `title`, `company`, `analysis_model = "claude-sonnet-4-20250514"`, `analysis_provider = "anthropic"`, `qualifications_required`, `keywords`
- `job_scores` table: new row with `job_id`, `overall_score`, `scoring_version = "3.0-explainable"`

**What must NOT be true:**
- `jobs.quality_passed` must be `null` or `false`
- `jobs.status` must NOT be `"applied"` or `"ready"`

---

## Step 3: Confirm Job Analysis Visible

**Action:** Open `/jobs/[id]`.

**Verify:**
- [ ] Job title, company, location, responsibilities visible
- [ ] Fit score visible (if evidence library populated)
- [ ] "Generate Materials" button visible (if evidence mapping complete)

---

## Step 4: Evidence Matching

**Action:** Navigate to `/jobs/[id]/evidence-match`.

**Verify:**
- [ ] Requirements from `job_analyses.qualifications_required` are displayed
- [ ] User can map evidence items to requirements
- [ ] "Mark Complete" sets `jobs.evidence_map.matching_complete = true`

**DB check:**
- `jobs.evidence_map` contains `matching_complete: true` after user marks complete

---

## Step 5: Generate Resume and Cover Letter

**Action:** Trigger document generation (button on `/jobs/[id]` or via `/api/generate-documents`).

**Verify:**
- [ ] Loading/generating state displayed
- [ ] On success: resume and cover letter text appear in UI
- [ ] Quality check result visible (pass or fail with reasons)

**DB rows to confirm:**
- `jobs` row updated: `generated_resume` not null, `generated_cover_letter` not null, `quality_passed` is boolean, `status` is `"ready"` or `"needs_review"`
- `generation_quality_checks` table: new row with `job_id`, `user_id`, `passed`, `provider`, `generation_model`, `quality_check_model`, `evidence_ids_used`, `issues_count`

**AI model verification:**
- `generation_quality_checks.generation_model` must equal `"claude-sonnet-4-20250514"` (NOT `"llama-3.3-70b-versatile"`)
- `generation_quality_checks.provider` must equal `"anthropic"`

---

## Step 6: Red Team Quality Review

**Action:** Navigate to `/jobs/[id]/red-team`.

**Verify:**
- [ ] Quality issues displayed (if any)
- [ ] "Approve" or "Pass Quality" action available
- [ ] After approval: `jobs.quality_passed = true`

**DB check:**
- `jobs.quality_passed = true`
- `jobs.status` moves toward `"ready"` if materials exist

**Gate verification:**
- [ ] Apply button is NOT available before `quality_passed = true`

---

## Step 7: Verify Apply Gate

**Action:** Attempt to apply before quality is passed.

**Verify:**
- [ ] Apply action returns error: "Quality review required. Complete Red Team review before applying."
- [ ] `jobs.status` remains unchanged
- [ ] No `applications` row inserted

---

## Step 8: Apply via Canonical Path

**Action:** With `quality_passed = true` and materials present, call `applyToJob(jobId, "manual")` (via UI apply button).

**Verify:**
- [ ] Success response with `applicationId`
- [ ] `jobs.status = "applied"`, `jobs.applied_at` is set

**DB rows to confirm:**
- `jobs`: `status = "applied"`, `applied_at` is ISO timestamp
- `applications`: new row with `job_id`, `user_id`, `applied_at`, `status = "submitted"`, `method = "manual"`
- `audit_events`: new row with `event_type = "job_applied"`, `outcome = "success"`, `job_id`, `user_id`, `metadata.application_id` matching the applications row

---

## Step 9: Verify No Duplicate Apply

**Action:** Attempt to apply again to the same job.

**Verify:**
- [ ] Returns error: "Already marked as applied to this job."
- [ ] No second `applications` row inserted
- [ ] `jobs.applied_at` unchanged

---

## Step 10: Verify UI State After Apply

**Action:** Navigate to `/applications` and `/jobs/[id]`.

**Verify:**
- [ ] Job appears in applications list
- [ ] Job detail shows "Applied" status
- [ ] Apply button no longer available

---

## Automated Test Stubs (Future)

When a test framework is added (e.g. Vitest, Playwright), the following unit/integration tests should be created:

### Unit tests

| Test | File | Assertion |
|------|------|-----------|
| `getAnalysisModelName()` returns `"claude-sonnet-4-20250514"` | `lib/ai/provider-config.ts` | Exact string match |
| `getProviderLabel()` returns `"anthropic"` | `lib/ai/provider-config.ts` | Exact string match |
| `evaluateJobReadiness` returns `can_apply = false` when `quality_passed = false` | `lib/readiness.ts` | Gate check |
| `applyToJob` rejects when `quality_passed = false` | `lib/actions/apply.ts` | Error message check |
| `analyzeJobCore` writes `analysis_model = "claude-sonnet-4-20250514"` | `lib/analyze/analyze-job-core.ts` | DB insert payload check |

### E2E tests (Playwright)

| Test | Steps | Expected outcome |
|------|-------|-----------------|
| Full golden path | Steps 1–9 above | All DB rows present, `audit_events` created |
| Apply gate blocks unapproved | Steps 2–5, skip step 6, attempt step 8 | Error returned, no `applications` row |
| Duplicate URL detection | Submit same URL twice | Second attempt returns `duplicate: true`, no second `jobs` row |
| Quality check metadata | Generate documents, query `generation_quality_checks` | `provider = "anthropic"`, `generation_model = "claude-sonnet-4-20250514"` |

---

## DB Verification Queries (Supabase SQL Editor)

Run after full golden path to confirm all rows are correct:

```sql
-- 1. Check job record
SELECT id, role_title, company_name, status, quality_passed, applied_at
FROM jobs
WHERE user_id = '<test_user_id>'
ORDER BY created_at DESC
LIMIT 1;

-- 2. Check analysis record and model metadata
SELECT id, job_id, title, company, analysis_model, analysis_provider
FROM job_analyses
WHERE user_id = '<test_user_id>'
ORDER BY created_at DESC
LIMIT 1;

-- 3. Check quality check record
SELECT id, job_id, passed, provider, generation_model, quality_check_model, issues_count
FROM generation_quality_checks
WHERE user_id = '<test_user_id>'
ORDER BY created_at DESC
LIMIT 1;

-- 4. Check application record
SELECT id, job_id, user_id, applied_at, status, method
FROM applications
WHERE user_id = '<test_user_id>'
ORDER BY applied_at DESC
LIMIT 1;

-- 5. Check audit event
SELECT id, job_id, event_type, outcome, metadata
FROM audit_events
WHERE user_id = '<test_user_id>'
AND event_type = 'job_applied'
ORDER BY created_at DESC
LIMIT 1;
```

**Expected values:**
- `job_analyses.analysis_model` = `"claude-sonnet-4-20250514"`
- `job_analyses.analysis_provider` = `"anthropic"`
- `generation_quality_checks.provider` = `"anthropic"`
- `generation_quality_checks.generation_model` = `"claude-sonnet-4-20250514"`
- `audit_events.metadata.application_id` matches `applications.id`
