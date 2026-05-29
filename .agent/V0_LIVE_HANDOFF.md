# v0 Live Handoff

Generated: 2026-05-29T16:08:19.159Z
Branch: main
HEAD: 4c6911e feat: Tier 1 — SOC universal role coverage + identity-blind generation bias guards

## Use This In v0

Build or revise only the UI that matches the current repo state below. Do not invent backend routes, props, tables, or actions. If a button is not wired in the listed files, render it disabled or omit it.

## Current Task

Task: prove-fit-autonomous-builder-convergence - Prove Fit and Autonomous Builder Convergence

Goal: Triage and stabilize the current Prove Fit product convergence work together with the autonomous-builder operating layer.

## Merge / Conflict State

No unresolved merge conflicts detected.

## Changed Files

- .agent/V0_LIVE_HANDOFF.md
- app/api/analyze/route.ts
- app/api/coach/evidence-drafts/[draftId]/confirm/route.ts
- app/api/coach/evidence-drafts/[draftId]/reject/route.ts
- app/api/coach/sessions/[sessionId]/messages/route.ts
- app/api/coach/sessions/[sessionId]/route.ts
- app/api/coach/sessions/route.ts
- app/api/evidence/[id]/route.ts
- app/api/evidence/export/route.ts
- app/api/evidence/import/route.ts
- app/api/evidence/keep-both/route.ts
- app/api/evidence/merge/route.ts
- app/api/export-docx/route.ts
- app/api/generate-documents/route.ts
- app/api/jobs/[id]/coach-step/route.ts
- app/api/jobs/[id]/evidence-map/route.ts
- app/api/jobs/[id]/rebuild-evidence-map/route.ts
- app/api/linkedin/capture/route.ts
- app/api/linkedin/import/route.ts
- app/api/linkedin/pdf-extract/route.ts
- app/api/parse-github/route.ts
- app/api/re-analyze/route.ts
- app/api/resume/upload/route.ts
- app/api/stripe/checkout/route.ts
- app/api/stripe/portal/route.ts
- components/match-interview/MatchInterviewModal.tsx
- components/match-interview/types.ts
- docs/COACH_CONSTITUTION.md
- docs/GENERATION_STRATEGY.md
- docs/V0_SYNC_WORKFLOW.md
- lib/ai/gateway.ts
- lib/analyze/analyze-job-core.ts
- lib/coach/generation-strategy.ts
- lib/coach/types.ts
- lib/scoring-weights.ts
- lib/supabase/require-user.ts
- lib/truthserum.ts
- tests/match-interview-spine.test.ts
- tests/production-hardening-spine.test.ts

## Staged Files

No staged files detected.

## Changed Surface Map

### Pages / routes

- none

### API routes

- app/api/analyze/route.ts
- app/api/coach/evidence-drafts/[draftId]/confirm/route.ts
- app/api/coach/evidence-drafts/[draftId]/reject/route.ts
- app/api/coach/sessions/[sessionId]/messages/route.ts
- app/api/coach/sessions/[sessionId]/route.ts
- app/api/coach/sessions/route.ts
- app/api/evidence/[id]/route.ts
- app/api/evidence/export/route.ts
- app/api/evidence/import/route.ts
- app/api/evidence/keep-both/route.ts
- app/api/evidence/merge/route.ts
- app/api/export-docx/route.ts
- app/api/generate-documents/route.ts
- app/api/jobs/[id]/coach-step/route.ts
- app/api/jobs/[id]/evidence-map/route.ts
- app/api/jobs/[id]/rebuild-evidence-map/route.ts
- app/api/linkedin/capture/route.ts
- app/api/linkedin/import/route.ts
- app/api/linkedin/pdf-extract/route.ts
- app/api/parse-github/route.ts
- app/api/re-analyze/route.ts
- app/api/resume/upload/route.ts
- app/api/stripe/checkout/route.ts
- app/api/stripe/portal/route.ts

### Components

- components/match-interview/MatchInterviewModal.tsx
- components/match-interview/types.ts

### Server actions / domain logic

- lib/ai/gateway.ts
- lib/analyze/analyze-job-core.ts
- lib/coach/generation-strategy.ts
- lib/coach/types.ts
- lib/scoring-weights.ts
- lib/supabase/require-user.ts
- lib/truthserum.ts

### Migrations

- none

### Tests

- tests/match-interview-spine.test.ts
- tests/production-hardening-spine.test.ts

### Docs / operating layer

- .agent/V0_LIVE_HANDOFF.md
- docs/COACH_CONSTITUTION.md
- docs/GENERATION_STRATEGY.md
- docs/V0_SYNC_WORKFLOW.md

## Protected / High-Risk Files In Current Diff

- app/api/generate-documents/route.ts

## Diff Stat

```txt
app/api/analyze/route.ts                           |  40 ++-
 .../evidence-drafts/[draftId]/confirm/route.ts     |   8 +-
 .../evidence-drafts/[draftId]/reject/route.ts      |  12 +-
 .../coach/sessions/[sessionId]/messages/route.ts   |   9 +-
 app/api/coach/sessions/[sessionId]/route.ts        |  14 +-
 app/api/coach/sessions/route.ts                    |   9 +-
 app/api/evidence/[id]/route.ts                     |  12 +-
 app/api/evidence/export/route.ts                   |  10 +-
 app/api/evidence/import/route.ts                   |  12 +-
 app/api/evidence/keep-both/route.ts                |  12 +-
 app/api/evidence/merge/route.ts                    |  16 +-
 app/api/export-docx/route.ts                       |  11 +-
 app/api/generate-documents/route.ts                | 139 ++++----
 app/api/jobs/[id]/coach-step/route.ts              |  24 +-
 app/api/jobs/[id]/evidence-map/route.ts            |  10 +-
 app/api/jobs/[id]/rebuild-evidence-map/route.ts    |  22 +-
 app/api/linkedin/capture/route.ts                  |  18 +-
 app/api/linkedin/import/route.ts                   |  12 +-
 app/api/linkedin/pdf-extract/route.ts              |  12 +-
 app/api/parse-github/route.ts                      |  19 +-
 app/api/re-analyze/route.ts                        |  42 ++-
 app/api/resume/upload/route.ts                     |  37 +--
 app/api/stripe/checkout/route.ts                   |  26 +-
 app/api/stripe/portal/route.ts                     |  12 +-
 components/match-interview/MatchInterviewModal.tsx | 359 ++++++++++++++++-----
 components/match-interview/types.ts                |   1 +
 docs/COACH_CONSTITUTION.md                         |   6 +-
 docs/GENERATION_STRATEGY.md                        |  16 +-
 lib/ai/gateway.ts                                  |  15 +-
 lib/analyze/analyze-job-core.ts                    |  11 +-
 lib/coach/generation-strategy.ts                   |  18 +-
 lib/coach/types.ts                                 |   6 +-
 lib/scoring-weights.ts                             | 183 ++++++++++-
 lib/supabase/require-user.ts                       |   4 +-
 lib/truthserum.ts                                  |  10 +-
 tests/match-interview-spine.test.ts                |   8 +-
 tests/production-hardening-spine.test.ts           |  49 ++-
 37 files changed, 834 insertions(+), 390 deletions(-)
```

## v0 Design Rules

- Build the actual product screen, not a marketing page.
- Preserve existing route structure, components, and server/client boundaries.
- Use HireWire language: Prove Fit, Match Interview, Career Context, Application Package, Ready to Apply.
- Hide database, evidence-picker, manual-mapping, and workflow-theory language from primary user flows.
- Do not show CTAs that are not backed by existing routes/actions unless explicitly disabled.
- Keep readiness and apply gates honest. Do not imply a package can be applied before the gate clears.
- Respect the current design system and local component patterns.

## Backend Assumptions v0 Must Not Make

- Do not assume new Supabase tables or columns unless a migration is listed above.
- Do not assume a new API route exists unless it is listed in Changed Surface Map or already exists in `app/api`.
- Do not assume Career Context is a first-class screen unless `/career-context` stops redirecting.
- Do not create fake success states for document generation, package review, outcome logging, billing, or apply.

## Prompt To Paste

```txt
You are updating HireWire UI from the live repo handoff.
Use the Changed Surface Map and Changed Files above as the source of truth.
Design only the affected screen/component. Do not invent backend behavior.
If the handoff lists unresolved conflicts, produce a design recommendation only, not code.
Return file-scoped changes and acceptance criteria.
```

## Raw Git Status

```txt
M app/api/analyze/route.ts
 M app/api/coach/evidence-drafts/[draftId]/confirm/route.ts
 M app/api/coach/evidence-drafts/[draftId]/reject/route.ts
 M app/api/coach/sessions/[sessionId]/messages/route.ts
 M app/api/coach/sessions/[sessionId]/route.ts
 M app/api/coach/sessions/route.ts
 M app/api/evidence/[id]/route.ts
 M app/api/evidence/export/route.ts
 M app/api/evidence/import/route.ts
 M app/api/evidence/keep-both/route.ts
 M app/api/evidence/merge/route.ts
 M app/api/export-docx/route.ts
 M app/api/generate-documents/route.ts
 M app/api/jobs/[id]/coach-step/route.ts
 M app/api/jobs/[id]/evidence-map/route.ts
 M app/api/jobs/[id]/rebuild-evidence-map/route.ts
 M app/api/linkedin/capture/route.ts
 M app/api/linkedin/import/route.ts
 M app/api/linkedin/pdf-extract/route.ts
 M app/api/parse-github/route.ts
 M app/api/re-analyze/route.ts
 M app/api/resume/upload/route.ts
 M app/api/stripe/checkout/route.ts
 M app/api/stripe/portal/route.ts
 M components/match-interview/MatchInterviewModal.tsx
 M components/match-interview/types.ts
 M docs/COACH_CONSTITUTION.md
 M docs/GENERATION_STRATEGY.md
 M lib/ai/gateway.ts
 M lib/analyze/analyze-job-core.ts
 M lib/coach/generation-strategy.ts
 M lib/coach/types.ts
 M lib/scoring-weights.ts
 M lib/supabase/require-user.ts
 M lib/truthserum.ts
 M tests/match-interview-spine.test.ts
 M tests/production-hardening-spine.test.ts
?? .agent/V0_LIVE_HANDOFF.md
?? docs/V0_SYNC_WORKFLOW.md
```
