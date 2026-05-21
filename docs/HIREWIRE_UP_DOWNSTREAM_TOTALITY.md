# HireWire Upstream/Downstream Totality Map

Version: 2.0
Date: 2026-05-21
Scope: Product loop, routes, pages, components, clicks, actions, Supabase alignment, and validation

## 1. Canonical Product Loop

HireWire has one closed-loop operating model:

job intake -> job analysis -> evidence mapping -> materials generation -> quality review -> ready-to-apply gate -> apply -> outcome tracking -> learning feedback

Every page, button, mutation, and AI path must fit somewhere in this loop.

## 2. Source-of-Truth Authorities

### 2.1 Readiness authority
- File: `lib/readiness/evaluator.ts`
- Owns:
  - readiness checklist
  - blocked reasons
  - canGenerate
  - canApply
  - stage
  - nextAction
- No page, client component, server action, or route may replace this logic.

### 2.2 Workflow display authority
- File: `lib/job-workflow.ts`
- Purpose: display-only progress strip/state labeling
- Must never gate generation, apply, or next-step eligibility.

### 2.3 Domain-event authority
- Files:
  - `lib/domain-events/handle-event.ts`
  - `lib/domain-events/recompute-readiness.ts`
  - `lib/domain-events/invalidation-map.ts`
- Owns:
  - invalidation fan-out
  - readiness recompute triggers
  - event-driven propagation after writes

### 2.4 Generated content authority
- Canonical columns:
  - `jobs.generated_resume`
  - `jobs.generated_cover_letter`
- Do not use secondary history/version tables as live content truth.

### 2.5 Apply authority
- Canonical mutation path: `lib/actions/apply.ts`
- Canonical UI gate: `/ready-to-apply`
- No alternate apply mutation path is allowed.

## 3. Stage Model and Gates

### 3.1 Canonical stage sequence
- `job_ingested`
- `job_parsed`
- `evidence_mapped`
- `fit_scored`
- `materials_generated`
- `ready`
- `applied`

### 3.2 Gate truth
- `job_ingested`: jobs row exists
- `job_parsed`: qualifications/responsibilities exist on job row
- `evidence_mapped`: canonical evidence_map requirement coverage exists
- `fit_scored`: score exists
- `materials_generated`: generated resume and cover letter exist
- `ready`: materials generated and quality passed
- `applied`: applied_at exists or outcome status is applied

## 4. Top-Level Route Inventory

### 4.1 Canonical dashboard routes
- `/dashboard`
- `/coach`
- `/jobs`
- `/jobs/new`
- `/jobs/[id]`
- `/jobs/[id]/evidence-match`
- `/jobs/[id]/documents`
- `/ready-to-apply`
- `/applications`
- `/documents`
- `/evidence`
- `/analytics`
- `/logs`
- `/profile`
- `/billing`
- `/settings`

### 4.2 Compatibility routes
- `/ready-queue` -> compatibility redirect to ready-to-apply
- `/career-context` -> compatibility redirect to evidence/career context surface

### 4.3 Non-canonical routes that must not become alternate workflow paths
- `/jobs/[id]/red-team`
- `/jobs/[id]/interview-prep`
- `/companies`
- `/templates`
- `/manual-entry`

## 5. Page-by-Page Upstream/Downstream Map

### 5.1 Dashboard `/dashboard`
- File: `app/(dashboard)/dashboard/page.tsx`

Upstream:
- `jobs` rows for current user
- `domain_events` recent activity
- `user_profile` basic identity
- readiness evaluator per displayed job
- next-step engine for hero action

Primary UI blocks:
- hero / next move
- today’s queue metrics
- pipeline overview metrics
- recent pipeline list
- right-rail intelligence, quick actions, momentum, recent activity

Button and click map:
- `Add Job` -> `/jobs/new`
- Hero CTA (`NextStepButton`) -> modal or routed next action depending on job state
- `Skip for now` -> `/jobs`
- Queue stat cards -> filtered jobs or ready-to-apply
- Recent pipeline `Fix` -> `/jobs/[id]/evidence-match`
- Recent pipeline `Review` -> `/jobs/[id]/documents`
- Recent pipeline `Apply` -> `/ready-to-apply`
- Recent pipeline `Open` -> `/jobs/[id]`
- Right-rail quick links -> `/jobs/new`, `/coach`
- Activity items with job id -> `/jobs/[id]`
- Full activity log -> `/logs`

Downstream:
- no writes on page render
- all CTAs feed deeper loop stages via job detail, modal, evidence, documents, or ready gate

Supabase touchpoints:
- `user_profile`
- `jobs`
- `domain_events`

### 5.2 Jobs list `/jobs`
- Files:
  - `app/(dashboard)/jobs/page.tsx`
  - `components/jobs/jobs-pipeline-client.tsx`

Upstream:
- normalized jobs list
- display-stage helper
- staleness helper
- priority helper
- coach-step helper
- next-step helper

Primary UI blocks:
- add job form toggle
- metrics strip
- view tabs
- filter chips
- sort menu
- jobs table rows
- right-rail intelligence panel
- guided next-step modal

Button and click map:
- `Add Job` -> toggles inline `JobInputForm`
- View tabs -> local client filtering only
- Filter chips -> local client filtering only
- Sort button/menu -> local client sorting only
- Row title -> `/jobs/[id]`
- Row next action label -> opens `NextStepModal`
- Row overflow menu:
  - `View job` -> `/jobs/[id]`
  - `Review documents` -> `/jobs/[id]/documents`
  - `Evidence match` -> `/jobs/[id]/evidence-match`
- Right rail `Top Priority` -> `nextActionFor(topJob).href`
- Right rail `Today’s Queue` items -> evidence-match, documents, or job detail
- Right rail quick actions -> add job toggle or `/coach`

Downstream:
- page itself is read-only except inline add-job flow
- next-step modal bridges into analyze/evidence/generate/review/apply actions

Supabase touchpoints:
- jobs list comes from page-level server fetch
- inline add job ultimately feeds analyze/intake routes

### 5.3 Guided next-step system
- Files:
  - `components/workflow/NextStepButton.tsx`
  - `components/workflow/NextStepModal.tsx`
  - `lib/workflow/get-next-step.ts`
  - `lib/actions/complete-step.ts`

Upstream:
- current job state
- canonical readiness result
- evidence map requirement gaps
- workflow display stage

Button and click map:
- `refresh_analysis` -> re-analysis route
- `add_example` -> `/jobs/[id]/evidence-match`
- `generate` -> `/api/generate-documents`
- `review` -> package acceptance server action or docs route
- `apply` -> canonical apply server action
- `done` -> close modal or route to stable destination

Downstream:
- review -> `lib/actions/package.ts`
- apply -> `lib/actions/apply.ts`
- generation -> generated docs, governance, readiness changes
- re-analysis -> analysis backfill + map rebuild

### 5.4 Job detail `/jobs/[id]`
- File: `app/(dashboard)/jobs/[id]/page.tsx`

Upstream:
- full job row
- `job_analyses`
- `job_scores`
- user plan data
- readiness evaluator
- workflow display state
- coach-step state

Primary UI blocks:
- job header
- workflow progress strip
- readiness checklist
- next-step banner
- outcome tracker
- processing state
- fit analysis cards
- matched skills / gaps cards
- gap coach drawer
- workflow coach panel
- documents generation block
- right rail snapshot and quick links

Button and click map:
- breadcrumb `All Jobs` -> `/jobs`
- posting link -> external job URL
- `Re-analyze` -> analysis route
- `NextStepBanner` CTA:
  - analyze -> analyze route
  - docs -> `/jobs/[id]/documents`
  - evidence -> `/jobs/[id]/evidence-match`
  - apply -> `/ready-to-apply`
- `Ready to Apply` -> `/ready-to-apply`
- `GapCoachDrawer` -> coach step route + chat session/tool routes
- `GenerateButton` -> `/api/generate-documents`
- right rail quick links -> evidence-match, documents, ready-to-apply

Downstream:
- analysis writes jobs and job_analyses
- generation writes docs + governance
- coach writes clarifications and/or evidence

Supabase touchpoints:
- `jobs`
- `job_analyses`
- `job_scores`
- `users`

### 5.5 Evidence match `/jobs/[id]/evidence-match`
- File: `app/(dashboard)/jobs/[id]/evidence-match/page.tsx`

Upstream:
- `jobs.evidence_map`
- `job_analyses`
- `evidence_library`
- coach-step state

Primary UI blocks:
- requirement cards
- map-build error banner
- rebuild map button
- confirm evidence form
- gap coach drawer
- right rail proof library

Button and click map:
- breadcrumb -> `/jobs/[id]`
- `RebuildEvidenceMapButton` -> `/api/jobs/[id]/rebuild-evidence-map`
- `ConfirmRequirementEvidenceForm` submit -> `/api/jobs/[id]/evidence-map`
- Requirement `Open coach` -> coach drawer sheet
- Coach drawer `Save answer` -> `/api/jobs/[id]/coach-step`
- Coach drawer `Skip` -> `/api/jobs/[id]/coach-step`
- Embedded `CoachChat`:
  - sends messages -> `/api/coach`
  - confirmation actions -> `/api/coach/confirm-tool-call`
- right rail `Add career context` -> `/evidence`
- `Continue to job` -> `/jobs/[id]`

Downstream:
- updates `jobs.evidence_map`
- creates/updates `coach_sessions`, `coach_messages`, `coach_evidence_drafts`
- may create `evidence_library` row through coach draft confirm
- emits `evidence_mapped` and coach-related events

Supabase touchpoints:
- `jobs`
- `job_analyses`
- `evidence_library`
- `coach_sessions`
- `coach_messages`
- `coach_evidence_drafts`

### 5.6 Documents `/jobs/[id]/documents`
- File: `app/(dashboard)/jobs/[id]/documents/page.tsx`

Upstream:
- generated docs from jobs row
- readiness evaluator
- coach-step state
- resume version history
- voice integrity snapshot

Primary UI blocks:
- empty-state or blocked-state docs gate
- documents editor
- application package preview
- voice integrity section
- version history
- apply button

Button and click map:
- `Back to job` -> `/jobs/[id]`
- `GenerateButton` when no docs -> `/api/generate-documents`
- editor save/regenerate flows -> document edit actions in local components
- `ApplyButton` -> canonical apply path logic
- package preview actions -> review/acceptance logic as implemented by docs components

Downstream:
- doc generation updates jobs + governance
- review acceptance updates quality_passed state
- apply button routes into apply action/gate path

Supabase touchpoints:
- `jobs`
- `user_profile`
- resume version support tables/actions

### 5.7 Ready to Apply `/ready-to-apply`
- File: `app/(dashboard)/ready-to-apply/page.tsx`

Upstream:
- jobs list for active pipeline
- readiness evaluator for each job
- recent readiness_changed events for newly cleared jobs

Primary UI blocks:
- metrics strip
- just-cleared banner
- ready section
- blocked section
- right rail rules and next action

Button and click map:
- `Add Job` -> `/jobs/new`
- ready card `Review docs` -> `/jobs/[id]/documents`
- ready card `MarkAsAppliedButton` -> canonical apply mutation path
- blocked card `Fix readiness` -> `/jobs/[id]`
- blocked card `MarkAsAppliedButton` -> override/apply path where supported

Downstream:
- ready actions produce applications and status mutations
- blocked actions route to remediation or explicit override

Supabase touchpoints:
- `jobs`
- `domain_events`

### 5.8 Applications `/applications`
- File: `app/(dashboard)/applications/page.tsx`

Upstream:
- `applications` joined to `jobs`
- outcome state from `jobs.status`

Primary UI blocks:
- metrics strip
- grouped application list by outcome
- right rail explanatory panel and quick links

Button and click map:
- header `Ready to Apply` -> `/ready-to-apply`
- application row click -> `/jobs/[id]`
- right rail quick links -> `/ready-to-apply`, `/jobs`

Downstream:
- page is read-only
- outcome mutation happens elsewhere, page reflects canonical job/application state

Supabase touchpoints:
- `applications`
- joined `jobs`

### 5.9 Evidence library `/evidence`
- File: `app/(dashboard)/evidence/page.tsx`

Upstream:
- `evidence_library`
- client auth session

Primary UI blocks:
- add entry dialog
- search
- grouped accordion sections
- delete action
- right rail context health and proof tips

Button and click map:
- `Add entry` -> opens dialog
- dialog `Add to context` -> insert `evidence_library`
- search -> local filter
- section header toggle -> local collapse state
- delete icon -> soft-delete evidence row (`is_active=false`)

Downstream:
- inserts or soft-deletes evidence rows
- future jobs/generation/readiness consume this evidence pool

Supabase touchpoints:
- `evidence_library`
- auth session via Supabase client

### 5.10 Analytics `/analytics`
- File: `app/(dashboard)/analytics/page.tsx`

Upstream:
- `users.plan_type`
- `jobs`
- readiness evaluator
- optional nested `job_scores`

Primary UI blocks:
- metrics strip
- pipeline breakdown bars
- pro upsell/coming soon block
- right rail outcome framing, pro features, next action

Button and click map:
- `Upgrade to Pro` -> `/billing`
- empty-state `Add a job` -> `/jobs/new`
- right-rail `Upgrade to Pro` -> `/billing`
- right-rail `View pipeline` -> `/jobs`

Downstream:
- page is read-only analytics surface

Supabase touchpoints:
- `users`
- `jobs`
- nested `job_scores`

### 5.11 Activity log `/logs`
- File: `app/(dashboard)/logs/page.tsx`

Upstream:
- primary: `domain_events`
- fallback: `career_activity_log`
- fallback: `processing_events`

Primary UI blocks:
- metrics strip
- timeline
- right rail category explanation, severity key, quick links

Button and click map:
- header `View Pipeline` -> `/jobs`
- header `Add Job` -> `/jobs/new`
- timeline `View job` -> `/jobs/[id]`
- right rail quick links -> `/jobs/new`, `/jobs`, `/documents`

Downstream:
- read-only audit surface

Supabase touchpoints:
- `domain_events`
- `career_activity_log`
- `processing_events`

### 5.12 Profile `/profile`
- File: `app/(dashboard)/profile/page.tsx`

Upstream:
- `user_profile`
- client auth session

Primary UI blocks:
- save bar
- error/saved feedback
- profile form sections
- skills chip editor
- links section
- LinkedIn import widget
- GitHub parse button
- right rail profile strength and usage explanation

Button and click map:
- `Upload resume` -> `/onboarding`
- `Save profile` -> upsert `user_profile`
- saved banner `Career Context` -> `/evidence`
- saved banner `Add Job` -> `/jobs/new`
- add skill button / Enter key -> local form mutation
- remove skill icon -> local form mutation
- `ParseGithubUrlButton` -> GitHub parse route flow in child component
- `LinkedInImportWidget` -> LinkedIn capture/import flow in child component

Downstream:
- upserts `user_profile`
- imported external data may enrich downstream evidence/profile surfaces

Supabase touchpoints:
- `user_profile`
- auth session via Supabase client

### 5.13 Coach `/coach`
- File: `app/(dashboard)/coach/page.tsx`

Upstream:
- jobs readiness and context
- evidence library and profile context
- coach prompt builder / AI route

Primary UI blocks:
- coach chat shell
- prompt suggestions
- context-aware guidance

Button and click map:
- prompt suggestions -> send chat message
- chat send -> `/api/coach`
- tool confirmations -> `/api/coach/confirm-tool-call`

Downstream:
- may create tool calls, draft evidence, or recommend actions
- may route user into jobs/evidence/documents depending on tool output

Supabase touchpoints:
- via API routes, not direct client reads for authoritative mutations

## 6. API Route Click-to-Write Map

### 6.1 Analyze
- Route: `app/api/analyze/route.ts`
- Triggered by: add job / analyze job actions
- Reads: authenticated user, input URL/body
- Writes:
  - `jobs`
  - `job_analyses`
  - analysis backfill fields on `jobs`
- Downstream:
  - evidence-map initialization/rebuild
  - readiness recompute

### 6.2 Re-analyze
- Route: `app/api/re-analyze/route.ts`
- Triggered by: re-analyze buttons, modal refresh analysis
- Writes:
  - refreshed analysis fields
  - refreshed canonical evidence map
- Downstream:
  - readiness recompute

### 6.3 Evidence map mutation
- Route: `app/api/jobs/[id]/evidence-map/route.ts`
- Triggered by: confirm requirement evidence form
- Writes:
  - `jobs.evidence_map`
- Emits:
  - `evidence_mapped`

### 6.4 Evidence map rebuild
- Route: `app/api/jobs/[id]/rebuild-evidence-map/route.ts`
- Triggered by: rebuild map button
- Writes:
  - rebuilt `jobs.evidence_map`
- Emits:
  - `evidence_mapped`

### 6.5 Coach step
- Route: `app/api/jobs/[id]/coach-step/route.ts`
- Triggered by: gap coach drawer save/skip/complete
- Writes:
  - `jobs.evidence_map` coach-step metadata
  - `jobs.gap_clarifications`
  - `jobs.gaps_addressed`
- Emits:
  - `coach_action_taken`

### 6.6 Coach sessions
- Routes:
  - `app/api/coach/sessions/route.ts`
  - `app/api/coach/sessions/[sessionId]/messages/route.ts`
  - `app/api/coach/evidence-drafts/[draftId]/confirm/route.ts`
- Triggered by: requirement-anchored coach flows
- Writes:
  - `coach_sessions`
  - `coach_messages`
  - `coach_evidence_drafts`
  - `evidence_library` on confirm
  - `jobs.evidence_map` on confirm mapping
- Emits:
  - `coach_gap_session_started`
  - `coach_gap_message_added`
  - `evidence_draft_created`
  - `evidence_mapped`

### 6.7 Coach generic route
- Route: `app/api/coach/route.ts`
- Triggered by: coach chat send
- Writes:
  - tool-call support rows/caches as applicable
- Downstream:
  - confirm-tool-call path for mutations

### 6.8 Generate documents
- Route: `app/api/generate-documents/route.ts`
- Triggered by: generate buttons / modal generate
- Writes:
  - `jobs.generated_resume`
  - `jobs.generated_cover_letter`
  - governance columns on `jobs`
  - `generation_governance_runs`
  - `governance_claim_verdicts`
- Failure outputs:
  - structured blocked response with `blocked_requirements`, `next_action`, `map_build_error`

### 6.9 Package acceptance
- Action file: `lib/actions/package.ts`
- Triggered by: review acceptance flow
- Writes:
  - `jobs.quality_passed`
  - `jobs.generation_status`
- Emits:
  - `package_reviewed`

### 6.10 Apply
- Action file: `lib/actions/apply.ts`
- Triggered by: ready gate apply / mark-as-applied button path
- Writes:
  - `jobs.status`
  - `jobs.applied_at`
  - `applications`
  - override audit rows when necessary
- Emits:
  - `application_submitted`
  - `application_failed`
  - `override_logged`

## 7. Supabase Contract Map

### 7.1 Required user scoping
- Every user-owned query must include `.eq("user_id", user.id)`.
- Jobs queries also include `.is("deleted_at", null)` where applicable.
- Never trust client-provided `user_id`.

### 7.2 Canonical tables by domain
- `jobs`
- `job_analyses`
- `job_scores`
- `evidence_library`
- `coach_sessions`
- `coach_messages`
- `coach_evidence_drafts`
- `applications`
- `domain_events`
- `generation_governance_runs`
- `governance_claim_verdicts`
- `user_profile`
- `users`
- `processing_events`
- `career_activity_log`

### 7.3 Canonical column rules
- Jobs display names in UI should use normalized `role_title` / `company_name` from jobs rows.
- Generated docs source of truth is `jobs.generated_resume` and `jobs.generated_cover_letter`.
- Readiness must rely on canonical evaluator, not local derived booleans.
- JSONB arrays must be guarded with `Array.isArray()` before `.map()` or `.length`.

### 7.4 Cross-cutting Supabase safety rules
- Auth first.
- Tenant isolation always.
- Never write fabricated placeholder data.
- Never change schema in a UI-only pass.
- Never bypass governance writes on generation.

## 8. Domain Event Propagation Map

Primary events:
- `evidence_mapped`
- `coach_action_taken`
- `evidence_draft_created`
- `package_reviewed`
- `package_invalidated`
- `readiness_changed`
- `application_submitted`
- `application_failed`
- `override_logged`

Expected downstream effects:
- route revalidation
- readiness recompute
- dashboard metric freshness
- jobs list freshness
- ready-to-apply freshness
- log/audit consistency

## 9. Failure and Recovery Surfaces

### 9.1 Analysis failure
- Surface: job remains blocked before parsed stage
- Recovery: re-analyze

### 9.2 Evidence map build failure
- Surface: `map_build_error` on evidence match or generation response
- Recovery: rebuild evidence map CTA

### 9.3 Coach draft missing requirement anchor
- Surface: `requirement_anchor_missing` response
- Recovery: restart anchored coach flow from evidence match

### 9.4 Generation blocked by governance or evidence
- Surface: structured 409 with blocked requirements and next action
- Recovery: route back to evidence-match or coach remediation

### 9.5 Package not ready for apply
- Surface: ready gate blocked card / apply refusal
- Recovery: documents review or evidence fixes

### 9.6 Apply insert failure after status mutation
- Surface: application failure handling
- Recovery: rollback jobs mutation and emit failure event

## 10. v0 Coverage Requirements

Any v0 execution claiming full HireWire alignment must cover:

1. Every canonical dashboard route listed in this doc.
2. Every major CTA and click path listed in sections 5 and 6.
3. Readiness/apply/generation/evidence/coach flow integrity.
4. Supabase user scoping and deleted_at handling.
5. No alternate workflow or apply path introduction.
6. No fake analytics, readiness, or applications.

## 11. Validation Checklist

### 11.1 Code validation
- `npx tsc --noEmit`
- `npm run lint`
- `npm run build`

### 11.2 Workflow validation
- Add or analyze a job
- Re-analyze a job
- Confirm evidence for a requirement
- Save or skip a coach step
- Generate docs
- Accept package review
- Apply through ready-to-apply
- Verify applications surface updates

### 11.3 UI validation
- Dashboard hero and queue links route correctly
- Jobs table row actions route correctly
- Job detail right rail links route correctly
- Evidence match confirm/rebuild/coach actions behave correctly
- Documents page empty and generated states both render cleanly
- Ready gate clearly separates ready vs blocked
- Secondary pages maintain same page/workspace rhythm

## 12. Handoff Rule

Any future UX or v0 pass should be reviewed against this document before merge.
If a proposed UI introduces a new click path, page path, or mutation path not represented here, it must either be added here first or rejected as a competing workflow.

## 8. Verification Checklist (End-to-End)

1. Analyze a new job and verify parsed + score fields backfilled on jobs.
2. Confirm evidence to a requirement and verify requirement status progression.
3. Generate docs and verify jobs generated columns plus governance writes.
4. Accept package review and verify quality gate flips ready eligibility.
5. Apply through ready-to-apply and verify applications row + status update.
6. Run typecheck/lint/build gates.

## 9. Minimum Regression Commands

- npx tsc --noEmit
- npm run lint
- npm run build

## 10. Handoff Note

This document is the totality map for upstream/downstream behavior.
Any UI/flow change should be reviewed against this map before merge to avoid hidden loop breaks.
