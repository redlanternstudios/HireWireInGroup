# Codex Phase 2 Completion — 2026-06-01

### Status: COMPLETE

### Tasks Completed
- P2-T1: Updated `getCoachStepState()` so canonical unresolved required `requirement_matches` participate in required/complete/remaining-gap math while preserving original `score_gaps` for existing display pills.
- P2-T2: Replaced the job detail legacy workflow progress strip with a readiness-driven 5-step strip mapped from `readiness.displayState`.
- P2-T3: Added confirmed `prove_fit_decisions` claim text to the generation prompt as grounded candidate proof, ignoring blank proof rows and preserving the existing gap-clarification block.

### Tests Run
- tsc: PASS (`npx tsc --noEmit`)
- lint: PASS (`npm run lint`)
- build: PASS (`npm run build`)

### Acceptance Criteria
- P2-T1: PASS by code change and verification; manual score-75/unresolved-required fixture check not run because no authenticated test job was provided.
- P2-T2: PASS by code change and verification; manual browser step-state checks not run because no authenticated test session was provided.
- P2-T3: PASS by code change and verification; manual resume-generation proof-overlap check not run because no authenticated test job was provided.

### Blockers or Risks Not Fixed
- Manual DB-backed/browser verification still needs authenticated test credentials or a known test job.
- The previously stashed v0/agent work remains parked at `stash@{0}: pre-phase1-v0-agent-dirty-tree`.

### Reviewer Notes
Phase 2 intentionally keeps readiness authority in `evaluateReadiness()` and uses the coach change only to align the legacy coach-step surface with canonical unresolved required requirements. Generation prompt context is additive and does not loosen the existing evidence packet guardrails.

---

# Codex Phase 1 Completion — 2026-06-01

### Status: COMPLETE

### Tasks Completed
- P1-T1: Added batched `prove_fit_decisions` reads to dashboard, jobs list, and ready-to-apply. Each readiness evaluation now receives per-job decision authority without N+1 queries.
- P1-T2: Added batched `job_analyses` presence reads to dashboard and jobs list. Each list-view readiness evaluation now receives `analysis_present` so stale `jobs.score` cannot masquerade as real analysis.
- P1-T3: Updated the canonical `applyToJob()` server action to fetch `prove_fit_decisions` scoped by authenticated user and job before calling `evaluateReadiness()`. Override, rollback, response shape, and apply mutation semantics were not changed.

### Tests Run
- tsc: PASS (`npx tsc --noEmit`)
- lint: PASS (`npm run lint`)
- build: PASS (`npm run build`)

### Acceptance Criteria
- P1-T1: PASS by code change and verification; manual browser checks not run because no authenticated test session was provided.
- P1-T2: PASS by code change and verification; manual stale-score/no-analysis fixture check not run.
- P1-T3: PASS by code change and verification; manual apply action test not run.

### Blockers or Risks Not Fixed
- Manual DB-backed/browser verification still needs authenticated test credentials or a known test job.
- The previously stashed v0/agent work remains parked at `stash@{0}: pre-phase1-v0-agent-dirty-tree`.

### Reviewer Notes
Phase 1 intentionally used additive, batched queries only. It did not change readiness rules, apply override behavior, rollback behavior, status codes, response shapes, or `/ready-to-apply` apply semantics.

---

# Codex Phase 0 Completion — 2026-06-01

### Status: COMPLETE

### Tasks Completed
- P0-T1: Already satisfied in current `app/api/generate-documents/route.ts`; the main jobs update writes `generated_resume` and `generated_cover_letter` outside the `qualityPassed` branch, sets `generation_status` to `ready` or `needs_review`, and logs update errors through `logSupabaseWriteError`.
- P0-T2: Replaced stale `analysis_model: "llama-3.3-70b-versatile"` with `getActiveAnalysisModelName()` from `lib/ai/gateway.ts`, so analysis rows record the active configured model/provider.
- P0-T3: Added a hard `do_not_generate` return in `app/api/generate-documents/route.ts` before any resume/cover-letter AI calls in the main generation branch. It marks the job `generation_status: "failed"` and `generation_error: "insufficient_evidence"`, logs write errors, and returns 409.
- P0-T4: Updated `lib/domain-events/recompute-readiness.ts` to fetch `prove_fit_decisions` scoped by authenticated `userId` and `jobId`, then pass them into `evaluateReadiness()`.

### Tests Run
- tsc: PASS (`npx tsc --noEmit`)
- lint: PASS (`npm run lint`)
- build: PASS (`npm run build`)

### Acceptance Criteria
- P0-T1 document persistence: PASS by code inspection; manual Supabase generation/query not run in this session because no test job/session was provided.
- P0-T2 analysis model: PASS by code change and typecheck; manual Supabase analysis/query not run.
- P0-T3 insufficient evidence hard return: PASS by code change and typecheck; manual API call/no-AI-call verification not run.
- P0-T4 readiness recompute decisions: PASS by code change and typecheck; manual domain event query not run.

### Blockers or Risks Not Fixed
- The working tree contains unrelated v0/other-agent changes and local `main` is behind `origin/main`; these were preserved and not merged/pulled during Phase 0.
- Manual DB-backed verification still needs authenticated test credentials or a known test job.

### Reviewer Notes
Phase 0 was applied against current repo reality rather than stale line numbers. P0-T1 did not need a code edit because the document write is already outside the quality-pass branch in the current route. Review should focus on the new active model helper, insufficient-evidence early return placement, and readiness recompute decision scoping.

---

# CODEX TASK — HireWire Master Execution
**Build Day: Post-25 Stabilization + Intelligence Activation**
**Status:** Active — replace all prior CODEX_TASK files with this one
**Architect:** Ro Semeah
**Reviewer:** Claude (fills CLAUDE_REVIEW.md after each phase)

---

## How to read this file

This file replaces `CODEX_TASK.md` and `CODEX_TASK_BUILD_DAY_25.md`.
It is the single source of truth for all remaining HireWire build work.

## Codex Calibration — Do Not Follow Blindly

This file is a working execution plan, not a license to ignore the actual
repository. Claude-authored instructions may contain stale branch state, stale
line numbers, or assumptions from another agent's checkout.

Before editing any phase:
1. Run `git status --short --branch`.
2. Read the current target files.
3. Verify the described bug still exists in the current code.
4. If a task is already fixed, document it as already satisfied and do not
   churn the file.
5. If the requested fix conflicts with canonical contracts, preserve the
   contract and update this file with the corrected implementation path.

Canonical contracts beat task prose:
- Readiness authority: `lib/readiness/evaluator.ts`.
- Prove Fit unresolved authority: `lib/evidence/unresolved-requirements.ts`.
- Apply authority: `lib/actions/apply.ts`.
- Apply gate: `app/(dashboard)/ready-to-apply/page.tsx`.
- Generation authority: `app/api/generate-documents/route.ts`.
- Drawer read contract: `GET /api/jobs/[id]/evidence-map`.

Do not make mechanical edits from this file if the codebase has moved. The
goal is a working HireWire system, not checking boxes.

Tasks are ordered in strict phases. Do not begin Phase N+1 until Phase N
acceptance criteria are confirmed PASS in `CLAUDE_REVIEW.md`.

Each task has:
- **Files** — exact files to touch (only these)
- **Problem** — what is currently broken and why
- **Fix** — exactly what to write
- **Verify** — what to run and what output to expect
- **Constraints** — what must not be touched

---

## Current State (read before starting)

As of the Codex calibration pass on 2026-06-01:
- Local `main` may be behind `origin/main`; verify before implementation.
- The working tree may contain v0/other-agent changes. Do not overwrite them.
- Build Day 25 concepts are now baseline architecture, not optional:
  - `lib/evidence/unresolved-requirements.ts`
  - `lib/evidence/proofCoverage.ts`
  - `lib/readiness/evaluator.ts`
  - `lib/readiness.ts`
  - `app/api/jobs/[id]/evidence-map/route.ts`
  - `app/(dashboard)/jobs/[id]/evidence-match/page.tsx`
  - `app/(dashboard)/jobs/[id]/page.tsx`
  - `tests/proof-coverage-decisions.test.ts`
  - `tests/unresolved-requirements.test.ts`

The previous claim that these files are "new, untracked" may be stale in the
current checkout. Trust `git status`, `git log`, and file contents over this
historical note.

**Known live blocker from e2e test (2026-05-27):**
`jobs.generated_resume` and `jobs.generated_cover_letter` remain NULL after
generation completes. The `documents_generated` domain event fires but the
document write is not persisting. This is the first thing to fix.

---

## PHASE 0 — Stop the Bleeding
**Prereq:** None — begin immediately
**Constraint:** No new features. No scope expansion. Fix only what is listed.

---

### P0-T1: Fix document persistence — generated_resume/cover_letter NULL bug

**Files:**
- `app/api/generate-documents/route.ts`

**Problem:**
E2e test confirmed: generation completes, `documents_generated` domain event
fires, `generation_governance_runs` and `generation_quality_checks` rows are
created — but `jobs.generated_resume` and `jobs.generated_cover_letter` remain
NULL. Users see "Generation passed" with no documents to view.

Root cause to locate: find where `formattedResume` and `formattedCoverLetter`
are assigned in the route. Trace whether the main jobs UPDATE that writes these
fields is conditional on `quality_passed`. If `quality_passed = false`, the
write may be skipped. Documents must be written regardless of quality gate
outcome — quality determines `generation_status` (`ready` vs `needs_review`),
not whether the document is persisted.

**Fix:**
1. Locate the main `supabase.from('jobs').update(updatePayload)` that is meant
   to write `generated_resume` and `generated_cover_letter`.
2. Confirm `formattedResume` and `formattedCoverLetter` are in `updatePayload`.
3. If the write is inside a `if (qualityPassed)` block, move it outside.
   Documents must always be persisted. Quality outcome sets
   `generation_status: qualityPassed ? 'ready' : 'needs_review'`.
4. If the variables are undefined at the write point, trace back to find where
   the AI output is parsed and ensure the values flow through to the write.
5. Wrap the write in `logSupabaseWriteError` if not already.

**Verify:**
```bash
# Run generation on any job with evidence. Then query Supabase:
# SELECT id, generated_resume IS NOT NULL, generated_cover_letter IS NOT NULL,
#        generation_status, quality_passed
# FROM jobs WHERE id = '<test_job_id>';
# Expected: both columns non-null, generation_status = 'ready' or 'needs_review'
npx tsc --noEmit
npm run build
```

**Constraints:**
- Do not change `generation_status` values. Keep `ready` and `needs_review`.
- Do not change quality check logic.
- Do not touch `lib/readiness/evaluator.ts`.
- Do not touch `lib/actions/apply.ts`.

---

### P0-T2: Fix analysis_model hardcode

**Files:**
- `lib/analyze/analyze-job-core.ts`

**Problem:**
Line 761: `analysis_model: "llama-3.3-70b-versatile"` is hardcoded. The
gateway now routes to OpenAI gpt-4o. Every `job_analyses` row records the
wrong model. Corrupts audit trail.

**Fix:**
Import the active model from `lib/ai/gateway.ts`. At the point of the
`job_analyses` insert, resolve the model name at runtime:

```typescript
import { CLAUDE_MODELS } from "@/lib/ai/gateway"
// or if gateway exposes an active model getter, use that
// Replace the hardcoded string with the actual model in use
analysis_model: CLAUDE_MODELS.SONNET, // or the correct constant
```

If `gateway.ts` does not export a constant matching the analysis model,
add `export const ACTIVE_ANALYSIS_MODEL = "gpt-4o"` to gateway.ts and
import it here.

**Verify:**
```bash
npx tsc --noEmit
# Run analysis on a new job
# SELECT analysis_model FROM job_analyses WHERE job_id = '<id>';
# Expected: 'gpt-4o' or current model, NOT 'llama-3.3-70b-versatile'
```

---

### P0-T3: Fix do_not_generate hard return

**Files:**
- `app/api/generate-documents/route.ts`

**Problem:**
`determineGenerationStrategy()` can return `'do_not_generate'` when evidence
coverage is critically low. `buildStrategyPrompt()` converts this to a block
instruction string — but the code continues past it and fires the OpenAI call
anyway. The AI ignores the instruction string and generates with no evidence
grounding. Governance may catch it downstream but tokens burn and output is
wrong.

**Fix:**
Locate the `determineGenerationStrategy()` call. Immediately after it, add:

```typescript
if (strategy === "do_not_generate") {
  await supabase
    .from("jobs")
    .update({
      generation_status: "failed",
      generation_error: "insufficient_evidence",
    })
    .eq("id", job_id)
    .eq("user_id", userId);

  return NextResponse.json(
    {
      success: false,
      error: "insufficient_evidence",
      user_message:
        "Your evidence library does not cover enough of this role to generate. Add more evidence or close gaps in Prove Fit first.",
    },
    { status: 409 },
  );
}
```

**Verify:**
```bash
npx tsc --noEmit
# Create a job for a role with zero matching evidence (e.g. surgeon for a PM user)
# POST /api/generate-documents with that job_id
# Expected: 409 response, error: 'insufficient_evidence', NO OpenAI call fired
# Check jobs.generation_status = 'failed', jobs.generation_error = 'insufficient_evidence'
```

---

### P0-T4: Fix recompute-readiness missing prove_fit_decisions

**Files:**
- `lib/domain-events/recompute-readiness.ts`

**Problem:**
`recomputeReadiness()` fetches the job and calls `evaluateReadiness(job)` with
no `prove_fit_decisions`. Line 87: the SELECT query does not include it. Every
domain event that triggers a readiness recompute (job_analyzed, evidence_added,
evidence_updated) stores a `readiness_changed` payload that ignores confirmed
Prove Fit decisions. The snapshot in `domain_events` is wrong for every job
where the user completed Prove Fit.

**Fix:**
After the `supabase.from("jobs").select(...)` query that fetches the job,
add a second query:

```typescript
const { data: pfDecisions } = await supabase
  .from("prove_fit_decisions")
  .select("requirement_id, decision, claim_text")
  .eq("job_id", jobId)
  .eq("user_id", userId);
```

Then pass into `evaluateReadiness`:
```typescript
const result = evaluateReadiness({
  ...job,
  prove_fit_decisions: pfDecisions ?? [],
});
```

**Verify:**
```bash
npx tsc --noEmit
# Complete Prove Fit on a job
# Trigger re-analyze (fires job_analyzed → readiness recompute)
# SELECT payload FROM domain_events
#   WHERE event_type = 'readiness_changed' AND job_id = '<id>'
#   ORDER BY created_at DESC LIMIT 1;
# Expected: payload.snapshot.checklist.evidence = true
```

---

### P0 Verification Gate

Before proceeding to Phase 1, run all of these and confirm PASS:

```bash
npx tsc --noEmit        # must exit 0
npm run lint            # must exit 0
npm run build           # must compile successfully
```

Prepend P0 completion summary to this file. Claude reviews before Phase 1 begins.

---

## PHASE 1 — Fix Data Scope
**Prereq:** Phase 0 APPROVED in CLAUDE_REVIEW.md

Every list view passes the wrong data to `evaluateReadiness`. Status badges
are wrong on every card across the app. The apply gate can silently block
users who completed Prove Fit. Fix these together.

---

### P1-T1: Batch-fetch prove_fit_decisions for list views

**Files:**
- `app/(dashboard)/dashboard/page.tsx`
- `app/(dashboard)/jobs/page.tsx`
- `app/(dashboard)/ready-to-apply/page.tsx`

**Problem:**
All three pages call `evaluateReadiness(job)` with only the jobs row. No
`prove_fit_decisions` fetched. A user who completed Prove Fit — confirmed
every required requirement — still shows "Evidence needed" on every card.
The primary status signal across the app is wrong.

**Fix:**
In each page, after the jobs SELECT, add one batch query:

```typescript
const { data: allDecisions } = await supabase
  .from("prove_fit_decisions")
  .select("job_id, requirement_id, decision, claim_text")
  .eq("user_id", userId);

const decisionsByJobId = new Map<string, typeof allDecisions>();
(allDecisions ?? []).forEach((d) => {
  if (!decisionsByJobId.has(d.job_id)) decisionsByJobId.set(d.job_id, []);
  decisionsByJobId.get(d.job_id)!.push(d);
});
```

Then when calling `evaluateReadiness`, pass:
```typescript
evaluateReadiness({
  ...job,
  prove_fit_decisions: decisionsByJobId.get(job.id) ?? [],
})
```

One extra query per page load. No N+1.

**Verify:**
```bash
npx tsc --noEmit
# Complete Prove Fit on a job
# Navigate to /jobs — badge must show 'Ready to generate' not 'Evidence needed'
# Navigate to /dashboard — same
# Navigate to /ready-to-apply — job must appear in the ready list
```

---

### P1-T2: Add analysis_present flag to list view evaluations

**Files:**
- `app/(dashboard)/dashboard/page.tsx`
- `app/(dashboard)/jobs/page.tsx`

**Problem:**
`hasJobAnalysis()` fallback checks `jobs.score` or `jobs.status`. A job with
a stale score but no `job_analyses` row shows as analyzed. Wrong next actions
surface. The job detail page fixes this with `analysis_present` — list views
don't.

**Fix:**
In the same batch fetch pass as P1-T1, add:

```typescript
const { data: analysisPresence } = await supabase
  .from("job_analyses")
  .select("job_id")
  .eq("user_id", userId);

const analysisJobIds = new Set(
  (analysisPresence ?? []).map((a) => a.job_id)
);
```

Then pass into each `evaluateReadiness` call:
```typescript
evaluateReadiness({
  ...job,
  analysis_present: analysisJobIds.has(job.id),
  prove_fit_decisions: decisionsByJobId.get(job.id) ?? [],
})
```

**Verify:**
```bash
npx tsc --noEmit
# A job with jobs.score populated but no job_analyses row
# must show 'Analyze this job' as next action on dashboard
# not 'Prove Fit' or 'Generate'
```

---

### P1-T3: Fix applyToJob() readiness gate missing prove_fit_decisions

**Files:**
- `lib/actions/apply.ts`

**Problem:**
`applyToJob()` line 75 calls `evaluateReadiness(job)` with just the jobs row.
No `prove_fit_decisions` fetched. This is the server-side apply gate — the
last line of defense. A user who completed Prove Fit has `readiness.isReady`
return false here. They are blocked or forced into an override flow at the
exact moment they should be allowed to apply.

This is a protected file. Make only the targeted change described below.
Do not alter any other logic.

**Fix:**
After the job fetch (line ~60, after `const { data: job } = await supabase...`),
add:

```typescript
const { data: pfDecisions } = await supabase
  .from("prove_fit_decisions")
  .select("requirement_id, decision, claim_text")
  .eq("job_id", jobId)
  .eq("user_id", user.id);
```

Then on line 75, change:
```typescript
// BEFORE:
const readiness = evaluateReadiness(job);

// AFTER:
const readiness = evaluateReadiness({
  ...job,
  prove_fit_decisions: pfDecisions ?? [],
});
```

**Verify:**
```bash
npx tsc --noEmit
# Complete Prove Fit on a job (all required requirements confirmed)
# Click 'Mark as Applied'
# Expected: apply succeeds, NO override prompt shown
# Check: applications table has new row, jobs.status = 'applied'
```

**Protected file rules:**
- Do not change the override logic
- Do not change the rollback logic
- Do not change any status code or response shape
- Do not add new parameters to `applyToJob()`

---

### P1 Verification Gate

```bash
npx tsc --noEmit
npm run lint
npm run build
```

Prepend P1 completion summary to this file. Claude reviews before Phase 2.

---

## PHASE 2 — Close the Coach/Readiness Split
**Prereq:** Phase 1 APPROVED

`getCoachStepState` reads `score_gaps`. `evaluateReadiness` reads
`requirement_matches`. They diverge. The job detail page shows both
simultaneously producing contradictory states. Prove Fit completion
answers are never seen by the generation AI. Fix all three together.

---

### P2-T1: Merge requirement_matches into getCoachStepState

**Files:**
- `lib/coach-step.ts`

**Problem:**
`getCoachStepState` computes `gaps` from `score_gaps` (AI-extracted during
analysis, often empty for score >= 70 jobs). `required = lowFit || gaps.length > 0`.
A job with score 75 has empty `score_gaps` — coach says `not_required`. But
`requirement_matches` in the canonical evidence map has 3 unresolved required
requirements blocking generation. User sees green coach checkmark, hits
generation wall with no explanation.

**Fix:**
After the `const gaps = Array.isArray(job.score_gaps)...` block (~line 56),
add:

```typescript
// Merge unresolved required requirements from canonical evidence map
const evidenceMapRecord = asRecord(job.evidence_map) ?? {};
const requirementMatches = Array.isArray(evidenceMapRecord.requirement_matches)
  ? (evidenceMapRecord.requirement_matches as Array<Record<string, unknown>>)
  : [];
const unresolvedRequiredFromMap = requirementMatches
  .filter(
    (m) =>
      m.priority === "required" &&
      m.proof_decision === "needs_judgment" &&
      m.status !== "met",
  )
  .map((m) => String(m.requirement_text ?? ""))
  .filter(Boolean);

const mergedGaps = Array.from(new Set([...gaps, ...unresolvedRequiredFromMap]));
```

Replace all subsequent uses of `gaps` with `mergedGaps` for the
`required`, `remainingGaps`, `answeredAllCriticalGaps`, and `complete`
computations. Keep `gaps` (the original `score_gaps` array) for display
purposes in `CoachStepState.gaps` so existing UI gap pill rendering is
unchanged.

**Verify:**
```bash
npx tsc --noEmit
# Add a required requirement with no evidence to a job with score 75
# (so score_gaps would be empty but requirement_matches has unresolved required)
# Coach step must return status: 'required', not 'not_required'
# ReadinessChecklist and CoachStep card on job detail must both show blocked state
```

---

### P2-T2: Replace WorkflowProgress with readiness-driven strip

**Files:**
- `app/(dashboard)/jobs/[id]/page.tsx`

**Problem:**
Line 316: `<WorkflowProgress stage={workflow.stage} />` renders from
`getWorkflowState()`. It hits `evidence_mapped` as soon as any `evidence_map`
key exists — which is always after analysis. The strip shows "Fit Proved"
before Prove Fit has ever been run. Directly contradicts `ReadinessNextStepCard`
and `ReadinessChecklist` on the same page.

**Fix:**
Replace the `WorkflowProgress` component render with an inline 5-step strip
driven by `readiness.displayState`:

```typescript
// Map readiness.displayState to step number (1-5)
const READINESS_STEP: Record<string, number> = {
  analyze_needed: 1,
  evidence_needed: 2,
  coach_needed: 2,
  ready_to_generate: 3,
  package_review: 4,
  ready_to_apply: 5,
  applied: 5,
  interviewing: 5,
  offered: 5,
  rejected: 5,
  archived: 5,
};
const STEP_LABELS = ["Analyze", "Prove Fit", "Generate", "Review", "Apply"];
const currentStep = READINESS_STEP[readiness.displayState] ?? 1;
```

Render a horizontal strip of 5 labeled steps with the current step highlighted.
Use existing `hw-*` CSS classes and shadcn/ui patterns from the file.

Remove the `getWorkflowState(workflow)` call and `WorkflowProgress` import.
Remove `workflow` variable if it is only used for `WorkflowProgress`.
Keep all other `job-workflow` imports that are still needed (check before
removing).

**Verify:**
```bash
npx tsc --noEmit
# A job analyzed but not through Prove Fit: step 2 active
# After completing Prove Fit: step 3 active
# After generation: step 4 active
# After applying: step 5 active
# Strip must match ReadinessNextStepCard at all times
```

---

### P2-T3: Wire prove_fit_decisions into generation prompt

**Files:**
- `app/api/generate-documents/route.ts`

**Problem:**
The generate route reads `gap_clarifications` from `jobData` (~line 1724)
for AI gap context. `gap_clarifications` is written only by the old coach
modal flow and is rarely populated. `prove_fit_decisions` table contains
the actual confirmed proof answers from Prove Fit — `claim_text` per
requirement. This table is never queried by the generate route. The
generation AI never sees what the user confirmed.

**Fix:**
After loading `jobData` in the generate route (the section that loads
`gapClarifications` ~line 1724), add:

```typescript
const { data: proveFitDecisions } = await supabase
  .from("prove_fit_decisions")
  .select("requirement_id, decision, claim_text, requirement_text")
  .eq("job_id", job_id)
  .eq("user_id", userId)
  .eq("decision", "confirmed");

const confirmedProofBlock =
  (proveFitDecisions ?? []).length > 0
    ? `\n\nCONFIRMED PROOF FROM CANDIDATE (inject as grounded bullets — do not fabricate beyond this):\n${(proveFitDecisions ?? [])
        .map(
          (d) =>
            `Requirement: ${d.requirement_text}\nProof: ${d.claim_text}`,
        )
        .join("\n\n")}`
    : "";
```

In the `jobContext` prompt string, append `confirmedProofBlock` in the same
section as `gapClarifications`. Place it after the existing
`ADDITIONAL CONTEXT FROM CANDIDATE` block so it is additive.

**Verify:**
```bash
npx tsc --noEmit
# Confirm proof for a requirement in Prove Fit with specific claim text
# Generate resume
# Resume must contain a bullet grounded in the confirmed claim text
# Check tracedBullets — bullet citing that requirement must have packet_overlap >= 0.12
```

---

### P2 Verification Gate

```bash
npx tsc --noEmit
npm run lint
npm run build
```

Prepend P2 completion summary. Claude reviews before Phase 3.

---

## PHASE 3 — Activate the Context Engine
**Prereq:** Phase 2 APPROVED

The context engine is the most sophisticated part of HireWire and may be
completely off in production. `CONTEXT_ENGINE_ENABLED` env var status is
unknown. This phase runs it unconditionally and wires its intelligence
into the generation prompt and the job detail UI.

**Risk note:** Enabling `validateGeneratedClaims()` adds a second governance
layer. Run one generation on a staging job after P3-T1 and check the
contextBlocked rate before full rollout. If blocked rate > 20%, tune
verdict thresholds in `lib/context-engine/validate-claims.ts` before
proceeding to P3-T2 and P3-T3.

---

### P3-T1: Remove isContextEngineEnabled() flag gates

**Files:**
- `lib/analyze/analyze-job-core.ts`
- `app/api/generate-documents/route.ts`
- `app/api/coach/route.ts`
- `lib/context-engine/context-engine.ts`

**Problem:**
All three pipeline files gate the context engine on `isContextEngineEnabled()`.
If `CONTEXT_ENGINE_ENABLED` is not set in Vercel production (unverified), the
entire context engine is bypassed: no knockout detection, no gap classification,
no positioning strategy, no claim validation in governance.

Additionally, in `analyze-job-core.ts`, the `positioning` output from
`runContextGapMatch()` (`gapContext.positioning`) is computed but the result
is discarded. `jobs.resume_strategy` is never written at analysis time despite
the intelligence existing.

**Fix:**

1. In `lib/context-engine/context-engine.ts`, change `isContextEngineEnabled()`:
```typescript
export function isContextEngineEnabled() {
  // Context engine runs unconditionally — do not gate on env var
  return true;
}
```

2. In `lib/analyze/analyze-job-core.ts`, in the context engine block (~L853),
capture the positioning output and write it to `jobs.resume_strategy`:

```typescript
const gapContext = runContextGapMatch({ ... });
// Existing mirror calls stay the same

// NEW: write positioning to jobs so generation has it
void supabase
  .from("jobs")
  .update({
    resume_strategy: gapContext.positioning.resume_strategy ?? null,
  })
  .eq("id", job.id)
  .eq("user_id", user.id);
```

3. Remove all `if (isContextEngineEnabled())` guards in the three pipeline files
   (the function now always returns true, so the guards are dead code).

**Verify:**
```bash
npx tsc --noEmit
npm run build
# Run analysis on any job
# SELECT resume_strategy FROM jobs WHERE id = '<id>';  → must not be null
# SELECT COUNT(*) FROM context_gap_matches WHERE job_id = '<id>';  → must be > 0
# SELECT COUNT(*) FROM context_normalized_entities WHERE user_id = '<uid>';  → must be > 0
# For a job with 'PMP certification required':
#   SELECT match_type, risk_level FROM context_gap_matches
#   WHERE job_id = '<id>' AND requirement_id ILIKE '%pmp%';
#   → match_type = 'true_gap', risk_level = 'blocked'
```

---

### P3-T2: Surface knockout gate warnings on job detail

**Files:**
- `app/(dashboard)/jobs/[id]/page.tsx`
- `components/jobs/KnockoutGateWarning.tsx` (new file)

**Problem:**
`reverseEngineerJob()` classifies requirements as `knockout` (certification
required, clearance, must be authorized, license required, degree required).
`scoreGapMatch()` marks them `match_type='true_gap'`, `risk_level='blocked'`.
This data is in `context_gap_matches` but never shown to the user. A PM
applying to a job requiring active clearance gets auto-rejected at gate 1.
HireWire knows — it just doesn't say. This is the primary n8n "behind enemy
lines" feature.

**Fix:**

Create `components/jobs/KnockoutGateWarning.tsx`:
```typescript
// Props: requirements: Array<{ requirement_id: string; explanation: string }>
// Renders a warning card with HireWire hw-card styling
// Title: "Hard gate detected"
// Body: List of blocked requirements with their explanation text
// Footer CTA: "Discuss with Coach" linking to /coach
// Use amber/warning color treatment consistent with existing HireWire UI
```

In `app/(dashboard)/jobs/[id]/page.tsx`, after loading job+analysis, add:

```typescript
const { data: knockoutGates } = await supabase
  .from("context_gap_matches")
  .select("requirement_id, explanation")
  .eq("job_id", id)
  .eq("user_id", userId)
  .eq("risk_level", "blocked");
```

Render `<KnockoutGateWarning requirements={knockoutGates ?? []} />` after
`ReadinessNextStepCard` only when `knockoutGates.length > 0`.

**Verify:**
```bash
npx tsc --noEmit
# Job with credential requirement (e.g. 'PMP certification required') + no PMP evidence:
#   → KnockoutGateWarning renders after analysis
# Job with no knockout requirements:
#   → KnockoutGateWarning does not render (no empty-state shown)
```

---

### P3-T3: Wire positioning intelligence into generation prompt

**Files:**
- `app/api/generate-documents/route.ts`

**Problem:**
`generatePositioning()` computes `resume_strategy`, `cover_letter_strategy`,
`strongest_requirement_ids`, `adjacent_requirement_ids`, and `gap_requirement_ids`
based on the actual gap report. This is the ATS ranking intelligence — it knows
how the employer's system classifies this candidate. The intelligence exists in
`context_gap_matches` and in `jobs.resume_strategy` (now populated after P3-T1)
but is never injected into the generation prompt.

**Fix:**
In the generate route, after loading `jobData`, add:

```typescript
const { data: contextGapMatches } = await supabase
  .from("context_gap_matches")
  .select("match_type, explanation, requirement_id")
  .eq("job_id", job_id)
  .eq("user_id", userId);

const strongest = (contextGapMatches ?? [])
  .filter((m) =>
    ["direct_match", "terminology_mismatch"].includes(m.match_type),
  )
  .map((m) => m.explanation)
  .slice(0, 4);

const adjacent = (contextGapMatches ?? [])
  .filter((m) =>
    ["adjacent_match", "inferred_match"].includes(m.match_type),
  )
  .map((m) => m.explanation)
  .slice(0, 3);

const trueGaps = (contextGapMatches ?? [])
  .filter((m) => ["true_gap", "unsupported"].includes(m.match_type))
  .map((m) => m.explanation)
  .slice(0, 3);

const positioningBlock =
  strongest.length > 0 || trueGaps.length > 0
    ? `\n\nATS POSITIONING INTELLIGENCE:\nLead with direct evidence for: ${strongest.join("; ")}\nFrame carefully (adjacent evidence only): ${adjacent.join("; ")}\nDO NOT CLAIM (no evidence exists): ${trueGaps.join("; ")}\nResume angle: ${jobData.resume_strategy ?? "evidence-based"}`
    : "";
```

Inject `positioningBlock` into the `jobContext` prompt after the
`confirmedProofBlock` from P2-T3. This is additive.

**Verify:**
```bash
npx tsc --noEmit
# Generate a resume for a job where context_gap_matches has a true_gap
# on a required requirement
# Resume must NOT contain a bullet claiming that requirement
# tracedBullets must not cite that requirement_id
```

---

### P3 Verification Gate

```bash
npx tsc --noEmit
npm run lint
npm run build
```

Prepend P3 completion summary. Claude reviews before Phase 4.

---

## PHASE 4 — Kill Dead Code
**Prereq:** Phase 3 APPROVED

Confirmed dead files. Remove them. Run tsc after each deletion.

---

### P4-T1: Delete semantic-gates.ts

**Files:**
- `lib/semantic-gates.ts` — DELETE

**Fix:**
```bash
grep -r "semantic-gates" app/ lib/ components/ --include="*.ts" --include="*.tsx"
# Must return zero results before deleting
rm lib/semantic-gates.ts
npx tsc --noEmit
```

**Verify:** tsc passes, grep returns nothing.

---

### P4-T2: Delete dead workflow component chain

**Files (DELETE all):**
- `lib/workflow/get-next-step.ts`
- `components/workflow/NextStepModal.tsx`
- `components/workflow/NextStepButton.tsx`
- `components/workflow/WorkflowCoachPanel.tsx`
- `components/workflow/WorkflowCoachPanelClient.tsx`

**Fix:**
```bash
# Confirm zero mounts in app/ for each component before deleting
grep -r "NextStepModal\|NextStepButton\|WorkflowCoachPanel\|WorkflowCoachPanelClient" \
  app/ --include="*.tsx" --include="*.ts"
# Must return zero results (only definition files, not consumers)
# Then delete all five files
npx tsc --noEmit
```

---

### P4-T3: Reduce job-workflow.ts

**Files:**
- `lib/job-workflow.ts`
- `lib/readiness.ts`

**Fix:**
Move `WorkflowStage` type and `WORKFLOW_STAGES`/`STAGE_LABELS` constants
into `lib/readiness/evaluator.ts`. Update the import in `lib/readiness.ts`.
Delete all function bodies from `lib/job-workflow.ts` (hasEvidenceMap,
areGapsAcknowledged, calculateEvidenceCoverage, getWorkflowState).
If the only remaining export is a re-export of the moved type, delete
`lib/job-workflow.ts` entirely.

```bash
npx tsc --noEmit
grep -r "job-workflow" app/ lib/ components/ --include="*.ts" --include="*.tsx"
# Must return zero or only the type import in readiness.ts
```

---

### P4-T4: Resolve dead infrastructure

**Files:**
- `lib/config/feature-flags.ts`
- `app/api/mcp/relay/route.ts`
- `app/api/zapier/outgoing/route.ts`

**Fix:**

1. `feature-flags.ts` — `isFeatureEnabled()` is never called. Add one call:
   in `app/api/jobs/[id]/outcome/route.ts` (Phase 5 will use this), import
   `isFeatureEnabled` and check the `notification_queue` flag before calling
   `queueNotification`. Delete `prove_fit_v0` flag from the type — Prove Fit
   is now unconditional. Keep all other flags.

2. `app/api/mcp/relay/route.ts` — The in-memory queue comment says
   "in production use Redis/Supabase". Add a code comment:
   `// TODO: wire to Supabase notification_queue when notification system is active`
   Do not change the route logic.

3. `app/api/zapier/outgoing/route.ts` — Add a comment:
   `// Requires ZAPIER_WEBHOOK_URL or N8N_JOB_INTAKE_WEBHOOK_URL env var`
   Document in `.agent/BUILD_CONTEXT.md` that this env var must be set for
   Zapier/n8n integration to function.

```bash
npx tsc --noEmit
```

---

### P4 Verification Gate

```bash
npx tsc --noEmit
npm run lint
npm run build
```

Prepend P4 completion summary. Claude reviews before Phase 5.

---

## PHASE 5 — Activate the Flywheel
**Prereq:** Phase 4 APPROVED

The learning infrastructure exists but nothing writes to it. This phase
wires the compounding moat.

---

### P5-T1: Write job_scores dimensions after generation

**Files:**
- `app/api/generate-documents/route.ts`

**Problem:**
`job_scores` has only `overall_score` written via `syncNormalizedJobScore()`.
`skills_match`, `experience_relevance`, `evidence_quality`, `seniority_alignment`,
`ats_keywords` are never written by the generate route. Coach reads these
dimensions for intelligence context — always gets null.

**Fix:**
In the DB write block, after the main jobs update, add a `job_scores` upsert:

```typescript
void supabase.from("job_scores").upsert(
  {
    job_id: job_id,
    user_id: userId,
    overall_score: generatedEvidenceMap.fit_score ?? job.score,
    skills_match: Math.round(
      (generatedEvidenceMap.matched_skills?.length ?? 0) /
        Math.max(jobAnalysis?.qualifications_required?.length ?? 1, 1) *
        100,
    ),
    experience_relevance: Math.min(
      Math.round((usablePackets.length / Math.max(capabilityPackets.length, 1)) * 100),
      100,
    ),
    evidence_quality: qualityScore ?? 0,
    seniority_alignment:
      strategy === "DIRECT_MATCH" ? 95
      : strategy === "ADJACENT_TRANSITION" ? 70
      : strategy === "STRETCH_HONEST" ? 50
      : 60,
    ats_keywords: Math.round(
      (generatedEvidenceMap.matched_skills?.filter((s: string) =>
        jobAnalysis?.ats_keywords?.includes(s),
      ).length ?? 0) /
        Math.max(jobAnalysis?.ats_keywords?.length ?? 1, 1) *
        100,
    ),
    scoring_version: "generation-derived",
  },
  { onConflict: "job_id" },
);
```

**Verify:**
```bash
npx tsc --noEmit
# After generation, query:
# SELECT skills_match, experience_relevance, evidence_quality,
#        seniority_alignment, ats_keywords
# FROM job_scores WHERE job_id = '<id>';
# All 5 columns must be non-null integers
```

---

### P5-T2: Write generated_documents row on generation

**Files:**
- `app/api/generate-documents/route.ts`

**Problem:**
`generated_documents` table exists with `voice_profile_used`, `evidence_ids_used`,
`generation_model` FK fields. Never written. Future features (interview prep,
provenance UI, receipt system) all expect a `generated_documents` row.

**Fix:**
In the DB write block after the main jobs update, add:

```typescript
void supabase.from("generated_documents").insert({
  id: generationId, // use existing generationId variable
  job_id: job_id,
  user_id: userId,
  document_type: "resume_and_cover_letter",
  generation_model: model,
  evidence_ids_used: Array.from(packetEvidenceIds),
  voice_profile_used: effectiveVoiceMode ?? voiceMode,
  quality_score: qualityScore ?? null,
  governance_passed: governancePassed,
  created_at: new Date().toISOString(),
});
```

**Verify:**
```bash
npx tsc --noEmit
# After generation:
# SELECT id, evidence_ids_used, generation_model FROM generated_documents
# WHERE job_id = '<id>';
# Must return one row with evidence_ids_used as non-empty array
```

---

### P5-T3: Activate learning_insights writes on outcome

**Files:**
- `lib/actions/outcome-learning.ts`
- `app/api/jobs/[id]/outcome/route.ts`

**Problem:**
`writeOutcomeLearning()` writes to `user_profile.career_context.outcome_learning`
(a JSONB blob). `learning_insights` table has never had a row written.
`user_intelligence.last_recomputed_at` never updates. After 85 jobs the
system knows nothing about what works for this user.

**Fix:**
In `writeOutcomeLearning()`, after writing to `career_context`, add:

```typescript
// Fetch existing learning insight for this archetype
const { data: existing } = await supabase
  .from("learning_insights")
  .select("id, positive_count, negative_count, sample_size")
  .eq("user_id", userId)
  .eq("insight_type", "role_archetype_outcome")
  .eq("context_key", archetype)
  .maybeSingle();

const positiveCount =
  (existing?.positive_count ?? 0) +
  (POSITIVE_OUTCOMES.has(outcome) ? 1 : 0);
const negativeCount =
  (existing?.negative_count ?? 0) +
  (NEGATIVE_OUTCOMES.has(outcome) ? 1 : 0);
const sampleSize = positiveCount + negativeCount;
const conversionRate =
  sampleSize > 0
    ? Math.round((positiveCount / sampleSize) * 100)
    : null;

await supabase.from("learning_insights").upsert(
  {
    id: existing?.id ?? crypto.randomUUID(),
    user_id: userId,
    insight_type: "role_archetype_outcome",
    context_key: archetype,
    positive_count: positiveCount,
    negative_count: negativeCount,
    conversion_rate: conversionRate,
    sample_size: sampleSize,
    confidence:
      sampleSize >= 5 ? "high" : sampleSize >= 3 ? "medium" : "low",
    recommendation:
      conversionRate !== null && conversionRate >= 60
        ? `Strong fit archetype — ${archetype} roles convert at ${conversionRate}%`
        : conversionRate !== null && conversionRate <= 30
          ? `Low fit archetype — ${archetype} roles convert at only ${conversionRate}%`
          : null,
    updated_at: new Date().toISOString(),
  },
  { onConflict: "id" },
);

// Update user intelligence timestamp
void supabase
  .from("user_intelligence")
  .update({ last_recomputed_at: new Date().toISOString() })
  .eq("user_id", userId);
```

**Verify:**
```bash
npx tsc --noEmit
# Mark a job as 'callback'
# SELECT * FROM learning_insights WHERE user_id = '<uid>';
# → new row with insight_type = 'role_archetype_outcome'
# SELECT last_recomputed_at FROM user_intelligence WHERE user_id = '<uid>';
# → recent timestamp
```

---

### P5-T4: Activate Coach session + notification on interview_scheduled

**Files:**
- `app/api/jobs/[id]/outcome/route.ts`
- `lib/comms/queue.ts` (read only — use existing `queueNotification`)

**Problem:**
When user marks outcome `interview_scheduled`, the outcome route writes to
jobs and fires a domain event. Nothing else happens. No coach session. No
notification. The user has no signal that HireWire is ready to help them
prepare.

**Fix:**
In the outcome route, after writing `interview_scheduled` status, add:

```typescript
if (outcome === "interview_scheduled") {
  // Create interview prep coach session if none exists
  const { data: existingSession } = await supabase
    .from("coach_sessions")
    .select("id")
    .eq("job_id", jobId)
    .eq("user_id", userId)
    .eq("session_type", "interview_prep")
    .maybeSingle();

  if (!existingSession) {
    void supabase.from("coach_sessions").insert({
      job_id: jobId,
      user_id: userId,
      session_type: "interview_prep",
      status: "active",
      initial_context: {
        interview_at: body.interview_at ?? null,
        job_title: job.role_title,
        company: job.company_name,
      },
    });
  }

  // Queue in-app notification
  const { queueNotification } = await import("@/lib/comms/queue");
  void queueNotification(supabase, {
    userId,
    reason: "interview_scheduled",
    channel: "in_app",
    priority: "high",
    subject: "Interview prep ready",
    body: `Your interview prep for ${job.role_title} at ${job.company_name} is ready in HireWire.`,
    metadata: { job_id: jobId },
  });
}
```

**Verify:**
```bash
npx tsc --noEmit
# Mark a job interview_scheduled
# SELECT id, session_type, status FROM coach_sessions
# WHERE job_id = '<id>' AND session_type = 'interview_prep';
# → new row
# SELECT reason, status, body FROM notification_queue
# WHERE user_id = '<uid>' ORDER BY created_at DESC LIMIT 1;
# → reason = 'interview_scheduled', status = 'queued'
```

---

### P5 Verification Gate

```bash
npx tsc --noEmit
npm run lint
npm run build
```

Prepend P5 completion summary. Claude reviews before Phase 6.

---

## PHASE 6 — Deprecate Legacy Fields
**Prereq:** Phase 5 APPROVED and stable for 48+ hours

Run Phase 6 as two separate commits at least 48 hours apart.

---

### P6-T1: Stop writing score_gaps, gap_clarifications, gaps_addressed

**Files:**
- `lib/analyze/analyze-job-core.ts` (L800 — remove `score_gaps: gaps`)
- `app/api/re-analyze/route.ts` (L349 — remove `score_gaps: gaps`)
- `lib/actions/jobs.ts` (L361 — remove `score_gaps: analysis.known_gaps || []`)
- `app/api/jobs/[id]/coach-step/route.ts` — remove any writes to these fields

Remove these three fields from all UPDATE/INSERT payloads in these files.
Keep reading them as fallback in `lib/coach-step.ts` for 48 hours.

**Verify:**
```bash
npx tsc --noEmit
npm run build
# Run analysis on a new job
# SELECT score_gaps, gap_clarifications, gaps_addressed FROM jobs WHERE id = '<new_id>';
# All three must be null
# Existing jobs retain old values — no migration
```

---

### P6-T2: Remove legacy fields from all queries (48h after P6-T1)

**Files:**
- `app/(dashboard)/dashboard/page.tsx`
- `app/(dashboard)/jobs/page.tsx`
- `app/(dashboard)/ready-to-apply/page.tsx`
- `app/(dashboard)/coach/page.tsx`
- `app/api/coach/route.ts`
- `lib/readiness.ts`
- `lib/domain-events/recompute-readiness.ts`
- `lib/coach-step.ts` (remove fallback reads from P2-T1 fix)

Remove `score_gaps`, `gap_clarifications`, `gaps_addressed` from every SELECT
query. Remove from `PipelineJob` TypeScript type. Remove fallback reads from
`coach-step.ts` — `mergedGaps` now comes entirely from `requirement_matches`.

**Verify:**
```bash
npx tsc --noEmit
npm run lint
npm run build
grep -r "score_gaps\|gap_clarifications\|gaps_addressed" \
  app/ lib/ --include="*.ts" --include="*.tsx"
# Must return zero results in SELECT queries
# Type definitions may still reference them with a deprecation comment
```

---

## Completion Summary Format

When a phase is done, prepend to this file:

```
## Codex Phase [N] Completion — [date]

### Status: COMPLETE / PARTIAL / BLOCKED

### Tasks Completed
- [task-id]: [what changed, file, line range]

### Tests Run
- tsc: PASS / FAIL (N errors)
- lint: PASS / FAIL
- build: PASS / FAIL

### Acceptance Criteria
- [AC-id]: PASS / FAIL / NOT TESTED — [note]

### Blockers or Risks Not Fixed
- [issue]: [reason, suggested next step]

### Reviewer Notes
[anything Claude should pay attention to in the diff]
```

---

## Protected Files — Never Touch Without Ro Approval

- `lib/actions/apply.ts` (P1-T3 makes one surgical change only)
- `app/(dashboard)/ready-to-apply/page.tsx`
- `lib/supabase/**`
- `supabase/migrations/**` (do not add new migrations — all work is app-layer)

---

## Absolute Constraints

1. **Never fabricate completion.** If a verify step cannot be run, document why.
2. **One phase at a time.** Do not begin Phase N+1 before Claude marks Phase N APPROVED.
3. **No scope expansion.** If you find a related issue not in this file, note it in your summary and stop. Do not fix it.
4. **No silent failures.** Every Supabase write that affects generation, apply, or readiness outcome must log on error.
5. **Never trust user_id from request body.** Always scope to authenticated session user.
6. **JSONB columns require Array.isArray() guard before .map().**
7. **`lib/readiness/evaluator.ts` is the canonical readiness authority.** Do not add readiness logic elsewhere.
8. **`lib/actions/apply.ts` is the canonical apply path.** No alternate apply mutations anywhere.
