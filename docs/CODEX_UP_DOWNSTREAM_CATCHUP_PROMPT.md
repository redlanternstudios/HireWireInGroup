# HireWire Codex Catch-Up Prompt

Version: 2026-05-22
Branch target: main
Mission: Continue implementation safely without breaking readiness, apply, coach, evidence, generation, or tenant isolation contracts.

You are joining a live codebase with significant production-path changes completed over the last few days. Your job is to continue progress while preserving every canonical authority and all upstream/downstream contracts.

## 1) Product Loop You Must Preserve

One closed loop only:
job intake -> job analysis -> evidence mapping -> generation -> quality review -> ready-to-apply gate -> apply -> outcome tracking -> learning feedback

No alternate loop, no side workflow, no shadow authority.

## 2) Canonical Authorities (Do Not Replace)

Readiness authority:
- lib/readiness/evaluator.ts
- Owns stage, blocked reasons, canGenerate, canApply, and nextAction

Workflow display authority only:
- lib/job-workflow.ts
- Visual progress only, never gating

Apply authority:
- lib/actions/apply.ts and /ready-to-apply
- Do not create any alternate apply mutation path

Domain event propagation authority:
- lib/domain-events/handle-event.ts
- lib/domain-events/invalidation-map.ts
- lib/domain-events/recompute-readiness.ts

Generated document truth:
- jobs.generated_resume
- jobs.generated_cover_letter

## 3) What Was Built In The Last Few Days (Shipped)

Latest sequence includes these high-impact changes:
- Requirement-scoped coach flow surfaced from jobs list and evidence-match deep links
- Requirement modal/session continuity (resume or create per requirement)
- Requirement-scoped skip handling in coach-step route
- Requirement-addressed event emission and invalidation propagation
- Documents freshness downgrade after evidence confirmation, with package invalidation signaling
- Evidence-match requirements expanded to include responsibilities
- Logs taxonomy updated to include requirement_addressed label
- Next-step analyze CTA now respects real hasUrl state
- Coach-step optimistic concurrency guard added using evidence_map_version compare-and-set
- Coach modal now handles 409 evidence_map_conflict with explicit user guidance
- Blocked readiness cards route to canonical readiness.nextAction links
- Readiness evidence fix links now target unresolved requirement via resolve and anchor when possible
- Guided one-by-one popup coach flow added to evidence-match
- Guided flow auto-starts and persists progression by updating resolve query to next unresolved requirement

## 4) Key Upstream/Downstream Contracts Added Recently

### 4.1 Requirement-targeted flow
Upstream:
- Jobs list computes first unresolved requirement and deep-links into evidence-match resolve param
- Evidence-match parses resolve and targets requirement modal opening

Downstream:
- User save/skip in coach modal writes coach-step state
- Events emitted and readiness recomputed through domain-event pipeline
- Refresh preserves progress via resolve query updates to next unresolved requirement

### 4.2 Coach-step concurrency
Upstream:
- coach-step route reads jobs.evidence_map_version

Mutation contract:
- update uses optimistic concurrency guard with expected current evidence_map_version
- successful write sets new evidence_map_version

Conflict contract:
- returns 409 with error evidence_map_conflict, currentVersion, and user_message
- UI shows explicit stale-update message and refreshes before retry

### 4.3 Evidence confirmation and package freshness
Upstream:
- confirming draft evidence maps to requirement and emits evidence_mapped + requirement_addressed

Downstream:
- if generation_status was ready and docs exist, status becomes needs_review
- package_invalidated event emitted with cause metadata

## 5) Page-by-Page Current Behavior Snapshot

### Dashboard
- Uses canonical readiness outputs and next-step entry points
- Navigates to jobs, evidence-match, documents, ready gate, and logs

### Jobs list
- Rows include fix-gaps entry when unresolved requirement exists
- Overflow includes coach/evidence/documents/job routing
- Next-step modal bridges into canonical actions

### Job detail
- Shows readiness checklist and next-step banner
- Analyze/re-analyze, evidence-match, documents, ready gate all present
- Gap coach and workflow coach panel are requirement-aware

### Evidence-match
- Primary interaction is Guided Coach Flow popup (one unresolved requirement at a time)
- Full requirement list is now secondary in collapsible view
- resolve query and anchor targeting are wired
- Required requirement intake includes qualifications plus responsibilities

### Documents
- Empty state respects canGenerate gating and coach-step requirements
- Package review/apply path remains canonical

### Ready-to-apply
- Blocked card fix button now uses readiness.nextAction href
- Ready cards go to documents review and mark-as-applied flow

### Logs
- Event label coverage includes requirement_addressed and package_invalidated semantics

## 6) Supabase Contracts To Preserve

Always:
- Scope user-owned data by user_id
- Keep deleted_at null filters where required for jobs
- Guard JSONB arrays with Array.isArray before map/filter/length

Core tables in active loop:
- jobs
- job_analyses
- job_scores
- evidence_library
- coach_sessions
- coach_messages
- coach_evidence_drafts
- applications
- domain_events
- user_profile
- users

## 7) Critical Files To Read Before Editing

- docs/HIREWIRE_UP_DOWNSTREAM_TOTALITY.md
- docs/V0_SUPABASE_ALIGNMENT_EXECUTION_PROMPT.md
- CLAUDE.md
- .github/copilot-instructions.md
- lib/readiness/evaluator.ts
- lib/domain-events/invalidation-map.ts
- app/(dashboard)/jobs/[id]/evidence-match/page.tsx
- components/coach/GuidedRequirementCoachFlow.tsx
- components/coach/GapCoachDrawer.tsx
- app/api/jobs/[id]/coach-step/route.ts
- app/api/coach/evidence-drafts/[draftId]/confirm/route.ts
- components/jobs/jobs-pipeline-client.tsx

## 8) Anti-Regression Rules

Do not:
- Reintroduce generic fix routing when requirement-targeted flow exists
- Remove evidence_map_version guard from coach-step mutations
- Drop 409 conflict handling in UI for coach-step saves
- Add alternate apply mutation paths outside ready-to-apply and canonical apply action
- Compute readiness locally in pages/components
- Replace canonical generated content columns with secondary sources

Must keep:
- requirement_addressed and package_invalidated event semantics
- document freshness downgrade when evidence changes after ready docs
- guided one-by-one popup progression behavior

## 9) Validation Gates (Run Every Meaningful Batch)

- npx tsc --noEmit
- npm run lint
- npm run build

If one cannot run, state exactly why and what was run instead.

## 10) If You Continue Implementing

Preferred next improvements:
1. Ensure guided popup can optionally resume from last unresolved requirement even without resolve param
2. Expand logs/analytics summaries to surface conflict occurrences and requirement progression rates
3. Tighten requirement identity stability across re-analysis so existing resolve links remain stable

## 11) Required Output Format For Your Work

Provide:
1. Files changed
2. Upstream inputs touched
3. Downstream effects touched
4. Contract checks (readiness/apply/events/supabase)
5. Validation results
6. Any residual risks

Do not claim completion without validation and propagation checks.
