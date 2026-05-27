# E2E Test Findings Summary
**Date:** 2026-05-27  
**Test:** Full generation flow with real Greenhouse job post  
**Job:** Team Lead, Customer Solutions Manager @ RADAR  
**Status:** Flow Completes But Data Not Persisted  

---

## Executive Summary

**Infrastructure:** ✓ Proven  
**Generation Flow:** ✓ Completes  
**Data Persistence:** ✗ **CRITICAL BLOCKER**  
**Match Score:** 100/100  
**Quality Score:** 85/100 (not passing)

The end-to-end infrastructure is sound—generation runs, governance audits pass, quality checks run. However, **the generated documents (resume and cover letter) are never persisted to the database**, meaning users cannot view or edit them on the documents page.

---

## Critical Issues (Blocking)

### 1. Generated Documents Not Persisted to Database
**Severity:** HIGH  
**Component:** `app/api/generate-documents/route.ts`  
**Problem:**
- Generation completes and quality check runs
- `domain_events.documents_generated` event fires
- But `jobs.generated_resume` and `jobs.generated_cover_letter` remain NULL
- User cannot view generated documents anywhere in the UI

**Evidence:**
```
jobs.generated_resume: null (despite documents_generated event)
jobs.generated_cover_letter: null (despite documents_generated event)
generation_governance_runs.generated_resume_content: null (field exists but unpopulated)
generation_governance_runs.generated_cover_letter_content: null (field exists but unpopulated)
```

**Impact:** Complete UX failure—user sees "Generation passed" but has no documents to review.

**Root Cause to Investigate:**
- Line ~2800+ in route.ts: Where are resume/cover letter variables assigned?
- Are they generated in the AI response but never written to `jobs` table?
- Is there a conditional that skips the write if quality fails?

---

### 2. AI Provider Fallback to OpenAI (Not Anthropic)
**Severity:** HIGH  
**Component:** `lib/ai/gateway.ts`, `isAnthropicConfigured()`  
**Problem:**
- Generation used OpenAI (gpt-4o) instead of Anthropic Claude
- This should not happen; CLAUDE.md indicates Anthropic is the primary provider
- Costs and quality characteristics differ significantly

**Evidence:**
```json
{
  "ai_generation_audit_logs": {
    "provider": "openai",
    "model": "gpt-4o",
    "total_tokens": 900
  }
}
```

**Impact:** Production will incur unexpected OpenAI costs; quality and behavior differ from intended Claude-based system.

**Root Cause to Investigate:**
- `isAnthropicConfigured()` returning false?
- Environment variable not set?
- Fallback logic triggered unintentionally?

---

### 3. Regeneration Cannot Be Triggered Programmatically
**Severity:** HIGH  
**Component:** `app/api/generate-documents/route.ts` (line 1404-1413)  
**Problem:**
- Generation API requires valid Supabase session token: `userClient.auth.getUser()`
- No programmatic way to create session tokens outside UI context
- Blocks automated testing, server-side retries, and admin regeneration

**Evidence:**
```typescript
// Line 1407-1412
const { data: { user } } = await userClient.auth.getUser();
if (!user) {
  return NextResponse.json(
    { success: false, error: "Unauthorized" },
    { status: 401 },
  );
}
```

**Impact:** Cannot complete E2E testing without user login. Quality gate cannot auto-retry from server.

---

### 4. Quality Check Passed But Score Only 85/100
**Severity:** HIGH  
**Component:** Generation quality logic  
**Problem:**
- Quality check failed with score 85
- Issues: 2 vague bullets, 4 AI filler phrases, 1 weak bullet
- `qualityPassed = false` despite quality score calculation
- Auto-retry did NOT trigger (weak_bullets = 1, threshold requires > 2)
- Job stuck in `needs_review` status

**Evidence:**
```
Quality Score: 85
Vague bullets: ["ensuring efficiency and consistency...", "enhancing decision-making..."]
AI filler: ["dynamic and strategic leader", "safe and reliable experiences", "empathetic design", "measurable outcomes"]
Generated resume: NULL (was never written to DB, so user can't even review it)
```

**Impact:** Documents cannot move to ready/apply until manually fixed or regenerated. User cannot see what to fix.

---

## Major Issues (Non-Blocking But Critical Design Problems)

### 5. Match Score Not Stored in job_scores.overall_score
**Severity:** MEDIUM  
**Problem:** `job_scores` table has `overall_score = null`  
**Evidence:**
```
job_scores.overall_score: null
job_analyses.ats_match_score: 100 (stored here instead)
```
**Impact:** Match score display on job analysis shows null; logic reads from wrong column.

---

### 6. Quality State Inconsistency Across Tables
**Severity:** MEDIUM  
**Problem:** Quality passed stored in 3 places with no sync guarantee:
- `jobs.quality_passed = false`
- `generation_quality_checks.passed = false`  
- `jobs.status = "needs_review"`

**Impact:** Readiness evaluator could read stale state if updates incomplete.

---

### 7. Generated Documents Not in Governance Audit Trail
**Severity:** MEDIUM  
**Problem:** `generation_governance_runs` has `generated_resume_content` and `generated_cover_letter_content` columns but they're NULL  
**Evidence:**
```
generation_governance_runs.generated_resume_content: null
generation_governance_runs.generated_cover_letter_content: null
```
**Impact:** No audit trail of what was actually generated for governance review.

---

### 8. MCP Relay Warning
**Severity:** LOW  
**Problem:** `/api/mcp/relay` fetched as relative URL from server component  
**Impact:** Console warnings; no functional impact.

---

## Data Flow Audit

| Step | Status | Evidence |
|------|--------|----------|
| Job created | ✓ | `jobs.id = 3dfa8f82-9297-40db-bfd7-3e2e9fe331dc` |
| Job analyzed | ✓ | `job_analyses` populated, ATS score 100 |
| Coach gate cleared | ✓ | No coach blocks in governance verdicts |
| Generation triggered | ✓ | `ai_generation_audit_logs.status = success` |
| Generation completed | ✓ | `domain_events.documents_generated` fired |
| Governance ran | ✓ | `generation_governance_runs.governance_passed = true` |
| Governance wrote verdicts | ✓ | 5 resume bullets + 4 cover letter paragraphs verified |
| Quality check ran | ✓ | `generation_quality_checks` created |
| **Documents persisted** | ✗ | `jobs.generated_resume = null` **← BLOCKER** |
| **Readiness updated** | ✗ | `jobs.quality_passed = false` (documents missing, so can't review) |
| User can view docs | ✗ | No resume available anywhere |

---

## Match Score Details

```
Job: Team Lead, Customer Solutions Manager @ RADAR
Location: New York, NY or San Diego, CA
Salary: $160,000-$200,000

Scoring Breakdown (job_scores):
- experience_relevance: 70
- evidence_quality: 96
- skills_match: 40
- seniority_alignment: 70
- ats_keywords: 40
- overall_score: 100 (but not stored in the right field)
- confidence_score: 0.7
- scoring_version: 3.0-explainable
```

---

## Quality Check Issues

| Issue | Count | Impact |
|-------|-------|--------|
| Vague bullets | 2 | "ensuring efficiency", "enhancing decision-making" |
| AI filler phrases | 4 | "dynamic leader", "safe experiences", "empathetic design", "measurable outcomes" |
| Weak bullets | 1 | Mild content issue |
| Invented claims | 0 | ✓ None |
| Banned phrases | 0 | ✓ None |
| **Quality Score** | **85/100** | **Not passing** |

---

## Artifact Audit (Proof Infrastructure)

✓ All artifact tables populated and verified:
- `domain_events`: 9 rows
- `hirewire_receipts`: 9 rows
- `ai_routing_decisions`: 3 rows
- `ai_generation_audit_logs`: 3 rows
- `usage_records`: 1 row
- `generation_governance_runs`: 1 row
- `generation_quality_checks`: 1 row

✓ `npm run agent:proof-pass` passed

---

## Recommended Immediate Actions

### Priority 1: Fix Document Persistence (BLOCKER)
1. **Locate the bug:** Find where generated resume/cover letter are created in route.ts
2. **Trace the write:** Verify the write to `jobs` table is happening
3. **Check conditional:** Is the write skipped if `quality_passed = false`?
4. **Test:** Re-run generation and verify `jobs.generated_resume` is populated

### Priority 2: Fix AI Provider Configuration
1. Check `.env.local` or `.env` for `ANTHROPIC_API_KEY`
2. Verify `isAnthropicConfigured()` logic in `lib/ai/gateway.ts`
3. Confirm fallback is intentional or remove it
4. Re-test generation with correct provider

### Priority 3: Fix Match Score Storage
1. Update generation route to write `job_scores.overall_score` correctly
2. Verify readiness evaluator reads from correct column
3. Add test to ensure score persists

### Priority 4: Enable Programmatic Regeneration
1. Add `x-test-mode` or service-role bypass for API
2. Or: Create method to generate tokens for testing
3. Document regeneration flow for QA/support

---

## Files to Review

- `app/api/generate-documents/route.ts` (line ~2700-2900: document write logic)
- `lib/ai/gateway.ts` (AI provider configuration)
- `lib/readiness/evaluator.ts` (canonical readiness source)
- `supabase/migrations/` (verify job_scores schema)

---

## Test Credentials

- **User:** johnnytestone@yopmail.com
- **User ID:** 57c76a77-7780-47d8-9583-95509149372c
- **Job ID:** 3dfa8f82-9297-40db-bfd7-3e2e9fe331dc

---

## Conclusion

The infrastructure is solid—the entire proof system works, governance audits work, quality checks work. The blocker is **data persistence on documents**. Once that's fixed, quality gate can be addressed, and the flow will be production-ready for the quality-review → ready-to-apply stage.
