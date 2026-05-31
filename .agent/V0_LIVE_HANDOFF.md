# v0 Live Handoff

Generated: 2026-05-31T21:55:44.244Z
Branch: main
HEAD: 54d10c9 fix: make prove fit decisions authoritative

## Use This In v0

Build or revise only the UI that matches the current repo state below. Do not invent backend routes, props, tables, or actions. If a button is not wired in the listed files, render it disabled or omit it.

## Current Task

Task: prove-fit-autonomous-builder-convergence - Prove Fit and Autonomous Builder Convergence

Goal: Triage and stabilize the current Prove Fit product convergence work together with the autonomous-builder operating layer.

## Merge / Conflict State

No unresolved merge conflicts detected.

## Changed Files

- .agent/ACCEPTANCE_CRITERIA_BUILD_DAY_25.md
- .agent/CODEX_TASK_BUILD_DAY_25.md
- .agent/GITHUB_PR_BUILD_DAY_25.md
- .agent/SUPABASE_ALIGNMENT_BUILD_DAY_25.md
- .agent/V0_LIVE_HANDOFF.md
- .agent/V0_PROMPT_BUILD_DAY_25_ALIGNMENT.md
- .github/PULL_REQUEST_TEMPLATE.md
- .github/copilot-instructions.md
- app/(dashboard)/jobs/[id]/evidence-match/page.tsx
- app/(dashboard)/jobs/[id]/page.tsx
- app/api/generate-documents/route.ts
- app/api/jobs/[id]/evidence-map/route.ts
- docs/SUPABASE_SETUP.md
- docs/jobs-contract.md
- lib/evidence/proofCoverage.ts
- lib/evidence/unresolved-requirements.ts
- lib/readiness.ts
- lib/readiness/evaluator.ts
- tests/proof-coverage-decisions.test.ts
- tests/unresolved-requirements.test.ts

## Staged Files

No staged files detected.

## Changed Surface Map

### Pages / routes

- app/(dashboard)/jobs/[id]/evidence-match/page.tsx
- app/(dashboard)/jobs/[id]/page.tsx

### API routes

- app/api/generate-documents/route.ts
- app/api/jobs/[id]/evidence-map/route.ts

### Components

- none

### Server actions / domain logic

- lib/evidence/proofCoverage.ts
- lib/evidence/unresolved-requirements.ts
- lib/readiness.ts
- lib/readiness/evaluator.ts

### Migrations

- none

### Tests

- tests/proof-coverage-decisions.test.ts
- tests/unresolved-requirements.test.ts

### Docs / operating layer

- .agent/ACCEPTANCE_CRITERIA_BUILD_DAY_25.md
- .agent/CODEX_TASK_BUILD_DAY_25.md
- .agent/GITHUB_PR_BUILD_DAY_25.md
- .agent/SUPABASE_ALIGNMENT_BUILD_DAY_25.md
- .agent/V0_LIVE_HANDOFF.md
- .agent/V0_PROMPT_BUILD_DAY_25_ALIGNMENT.md
- .github/PULL_REQUEST_TEMPLATE.md
- .github/copilot-instructions.md
- docs/SUPABASE_SETUP.md
- docs/jobs-contract.md

## Protected / High-Risk Files In Current Diff

- app/api/generate-documents/route.ts
- lib/readiness/evaluator.ts

## Diff Stat

```txt
.agent/V0_LIVE_HANDOFF.md                         | 203 ++++++----------------
 .github/PULL_REQUEST_TEMPLATE.md                  |  21 +++
 .github/copilot-instructions.md                   |  13 ++
 app/(dashboard)/jobs/[id]/evidence-match/page.tsx |  63 +++----
 app/(dashboard)/jobs/[id]/page.tsx                |  13 +-
 app/api/generate-documents/route.ts               |  73 ++------
 app/api/jobs/[id]/evidence-map/route.ts           |  75 ++++++++
 docs/SUPABASE_SETUP.md                            |  32 +++-
 docs/jobs-contract.md                             |  41 +++++
 lib/evidence/proofCoverage.ts                     |  45 ++++-
 lib/readiness.ts                                  |  22 ++-
 lib/readiness/evaluator.ts                        | 126 +++-----------
 12 files changed, 357 insertions(+), 370 deletions(-)
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
M .agent/V0_LIVE_HANDOFF.md
 M .github/PULL_REQUEST_TEMPLATE.md
 M .github/copilot-instructions.md
 M app/(dashboard)/jobs/[id]/evidence-match/page.tsx
 M app/(dashboard)/jobs/[id]/page.tsx
 M app/api/generate-documents/route.ts
 M app/api/jobs/[id]/evidence-map/route.ts
 M docs/SUPABASE_SETUP.md
 M docs/jobs-contract.md
 M lib/evidence/proofCoverage.ts
 M lib/readiness.ts
 M lib/readiness/evaluator.ts
?? .agent/ACCEPTANCE_CRITERIA_BUILD_DAY_25.md
?? .agent/CODEX_TASK_BUILD_DAY_25.md
?? .agent/GITHUB_PR_BUILD_DAY_25.md
?? .agent/SUPABASE_ALIGNMENT_BUILD_DAY_25.md
?? .agent/V0_PROMPT_BUILD_DAY_25_ALIGNMENT.md
?? lib/evidence/unresolved-requirements.ts
?? tests/proof-coverage-decisions.test.ts
?? tests/unresolved-requirements.test.ts
```
