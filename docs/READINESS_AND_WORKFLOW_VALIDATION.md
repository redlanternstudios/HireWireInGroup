<<<<<<< HEAD
# Readiness and Workflow State Validation

This document validates that HireWire never fakes workflow state and readiness is always derived from canonical logic.


## Canonical Readiness

- has job analysis
- has evidence mapping
- has score
- has resume
- has cover letter
- quality passed
- is applied
- is archived
- can generate
- can apply
- reasons not ready
- next action

## Rules

- No inline readiness computation
- No writing status ready to fake approval
- No Apply Now unless gates satisfied
- No Ready Now unless readiness proves it
- No duplicate apply paths
=======
# READINESS_AND_WORKFLOW_VALIDATION.md
# Verified: 2026-05-10 | Branch: v0/rsemeah-8ad75be8

## Scope
Verify the generation spine is unbroken: Generate → Review → Approve → Ready to Apply → Apply. Verify readiness authority lives only in `lib/readiness.ts`.

## Findings

### Readiness Authority
- **`lib/readiness.ts`:** Contains `evaluateJobReadiness()` and `getReadyJobIds()` — sole gate functions
- **Ready Queue page:** `app/(dashboard)/ready-queue/page.tsx` calls `getReadyJobIds()` — CORRECT
- **Job detail page:** Uses `evaluateJobReadiness()` result — CORRECT
- **Status:** PASS

### Inline Readiness Checks (Accepted)
- `dashboard/page.tsx:43`: `generation_status === "complete" || status === "ready"` — display-only stat counter for "ready" chip. Does NOT gate access to documents or application flow.
- `jobs/page.tsx:49`: Same pattern — display-only count badge.
- `lib/company-utils.ts:258,308`: `status === "ready"` used in company analytics aggregation — read-only, not a gate.
- `lib/orchestrator/runJobFlow.ts:138`: Comment only — documents a known divergence window, does not implement logic.
- **Decision:** All accepted. None bypass the generation spine.

### No status: "ready" Writes
- Confirmed: no route writes `status: "ready"` directly to jobs table
- Status transitions are derived from artifact completion (`generation_status`, `quality_passed`, etc.)
- **Status:** PASS

### Quality-Pass Route
- Single route confirmed: `app/api/jobs/[jobId]/quality-pass/route.ts`
- No duplicate quality-pass routes found
- **Status:** PASS

### Spine Integrity
- Generate: `app/api/generate-documents/route.ts` — PRESENT
- Review: Job detail documents tab — PRESENT
- Approve: Quality-pass route — PRESENT
- Ready: `lib/readiness.ts` gate — PRESENT
- Apply: `lib/actions/apply.ts` — PRESENT
- **Status:** PASS — spine unbroken

## Overall: PASS — 0 critical issues
>>>>>>> 7e1a8af916b56410048e0bfccadd90f00d881991
