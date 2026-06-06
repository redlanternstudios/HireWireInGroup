# HireWire Agent Constitution

Repo-level constitution for autonomous coding sessions.
Last updated: 2026-05-25.

When this file conflicts with older audit docs, this file wins.

## Start Here

HireWire is an Application Readiness Engine, not a basic job tracker.

Every product surface must support this loop:

```txt
job -> ready -> applied -> outcome
```

Before changing code:

1. Read this file.
2. Read `MEMORY.md`.
3. Read `memory/project_claude_ai_os_constitution.md`.
4. Read `.claude/context/product.md`.
5. Read `.claude/context/architecture.md`.
6. Read `.claude/context/protected-files.md`.
7. Inspect the actual files you will touch.
8. Identify upstream and downstream impact.
9. Make the smallest safe change.

## Non-Negotiable Rules

- `lib/readiness/evaluator.ts` is the canonical readiness authority.
- `lib/actions/apply.ts` is the only apply mutation path.
- `/ready-to-apply` is the apply gate.
- Do not create a second readiness engine, apply path, package lifecycle, or coach save path.
- Do not trust `user_id` from request input. Scope user-owned reads and writes to the authenticated user.
- Do not silently swallow Supabase errors. Log actionable errors with a `[HireWire]` prefix.
- Do not fabricate employers, dates, metrics, outcomes, scope, or claims unsupported by `evidence_library`.
- Prefer Server Components for data fetching.
- Add `"use client"` only for hooks, browser APIs, or event handlers.
- Do not use `useEffect` for primary data fetching in new pages.
- Do not modify Supabase schema unless explicitly asked. New schema changes go in `supabase/migrations/`.
- Migrations must be idempotent with `IF NOT EXISTS` / `IF EXISTS`.
- Do not edit existing migrations.

## Product Definition

The intended user journey is:

```txt
sign up/sign in
-> dashboard
-> add or capture job
-> analyze job post
-> compare requirements against career context
-> identify missing or weak evidence
-> coach clarifies evidence
-> build application package
-> preview package
-> pass readiness gate
-> apply or log override
-> track status and outcomes
-> feed outcomes back into career context
```

Features that do not improve application readiness, application quality, or outcome learning are secondary.

## Readiness Authority

`lib/readiness/evaluator.ts` owns:

- readiness checklist
- blocked reasons
- ready/not-ready state
- apply eligibility
- generate eligibility
- readiness next action

Allowed downstream consumers:

- dashboard counts
- jobs list stages
- job detail CTAs
- documents CTAs
- analytics breakdowns
- coach context
- ready-to-apply gate

Consumers may display local facts such as "documents exist" or "score exists", but they must not become alternate readiness authorities.

## State Model

There is one readiness state model:

```txt
materials missing -> evidence blocked -> quality review -> ready -> applied/outcome
```

`jobs.status` is outcome/history state only.

Use `jobs.status` for:

- applied
- interviewing
- offered
- rejected
- archived
- processing/error labels

Do not use `jobs.status === "ready"` as readiness truth.

`lib/job-workflow.ts` may be used for visual progress only. It must not gate actions or override readiness.

## Apply Gate

All apply actions must route through `/ready-to-apply`.

`/ready-queue` exists only as a compatibility redirect.

Rules:

- no direct apply CTA outside the gate
- no direct status mutation to applied outside `lib/actions/apply.ts`
- blocked applications may be overridden only through the explicit override flow
- overrides must be logged

## Generation Spine

The generation spine must stay unbroken:

```txt
Generate -> Review -> Ready to Apply -> Apply
```

Current implementation:

- Generate: `app/api/generate-documents/route.ts`
- Review: `app/(dashboard)/jobs/[id]/documents/page.tsx`
- Ready gate: `lib/readiness/evaluator.ts` plus `/ready-to-apply`
- Apply: `lib/actions/apply.ts`

Do not create a second apply path.

## Evidence And Truth Rules

Quality is part of readiness, not a side feature.

The readiness checklist must expose:

- resume generated
- cover letter generated
- evidence threshold met
- quality passed

Evidence must feed readiness. Evidence pages may manage proof points, but job-level readiness must reflect whether enough evidence is mapped for the application package.

Generated documents must be grounded in `evidence_library`.

Never generate:

- fabricated employers
- fabricated dates
- fabricated metrics
- inflated scope
- claims unsupported by evidence

Generated document content source of truth:

- `jobs.generated_resume`
- `jobs.generated_cover_letter`

Do not read from a `generated_documents` table for canonical document content.

## Canonical Sidebar Routes

See `.claude/context/routes.md`.

Do not add sidebar routes for legacy concepts unless the route exists and is wired to readiness.

Known non-canonical legacy routes that should not be linked:

- `/jobs/[id]/red-team`
- `/jobs/[id]/interview-prep`
- `/companies`
- `/templates`
- `/manual-entry`

## API And Auth Rules

Preferred authenticated route pattern:

```ts
import { requireUser } from "@/lib/supabase/require-user";
```

If a route still uses `supabase.auth.getUser()`, it must still:

- reject unauthenticated requests
- filter every user-owned query by `user_id`
- never trust `user_id` from request input

Never silently swallow Supabase errors. Log with:

```ts
console.error("[HireWire] ...", error);
```

## JSONB Safety

JSONB columns may be `null`, `{}`, or arrays. Guard before `.map()`.

Correct:

```ts
const items = Array.isArray(data.column) ? data.column : [];
```

Forbidden:

```ts
const items = data.column || [];
```

## Column Name Map

| Table | Use | Never use |
| --- | --- | --- |
| `source_resumes` | `file_name` | `filename` |
| `source_resumes` | `parsed_text` | `content_text` |
| `jobs` | `role_title` | `title` |
| `jobs` | `company_name` | `company` |
| `job_analyses` | `title`, `company` | `jobs.title`, `jobs.company` |
| `user_profile` | `website_url`, `github_url` | `linkedin_url`, `portfolio_url` |
| `evidence_library` | `confidence_level` | `confidence_score` as display authority |

## Frontend Rules

- Use Tailwind utility classes and existing `hw-*` classes.
- Use `cn()` for conditional class names.
- Use shadcn/ui primitives when available.
- Keep empty states actionable.
- Use existing button, card, dialog, toast, and form primitives before inventing variants.
- Do not expose database, picker, or admin language in the primary Prove Fit flow.

## High-Risk Files

Understand the full flow before changing:

| File | Risk |
| --- | --- |
| `lib/readiness/evaluator.ts` | Canonical readiness authority |
| `lib/actions/apply.ts` | Only apply mutation path |
| `app/(dashboard)/ready-to-apply/page.tsx` | Apply gate |
| `app/api/generate-documents/route.ts` | Writes generated materials and quality |
| `lib/canonical-evidence.ts` | Evidence normalization |
| `lib/coach/claim-validator.ts` | Claim safety |
| `lib/coach/drift-scorer.ts` | Drift safety |
| `lib/contracts/hirewire.ts` | Billing/product contract |
| `lib/domain-events/invalidation-map.ts` | Readiness invalidation |

## Build Verification

After readiness, route, API, schema, auth, or document-generation changes, run:

```bash
npx tsc --noEmit
npm run lint
npm run build
```

If one cannot be run, report that clearly.

## Claude Command Layer

Project commands live in `.claude/commands/`.

Recommended commands:

- `/project:truth-audit`
- `/project:readiness-engine-audit`
- `/project:prove-fit-audit`
- `/project:supabase-audit`
- `/project:api-route-audit`
- `/project:component-audit`
- `/project:button-handler-audit`
- `/project:package-audit`
- `/project:v0-handoff`
- `/project:build-day`
- `/project:build-day-prompt`
- `/project:health-check`
- `/project:convergence-check`
- `/project:keymon-setup`
- `/project:review-diff`
