# HIREWIRE - CLAUDE.md

Repo-level constitution for autonomous coding sessions.
Last updated: 2026-05-13.

When this file conflicts with older audit docs, this file wins.

---

## 1. Product Definition

HireWire is an Application Readiness Engine.

Every product surface must support this loop:

```txt
job -> ready -> applied -> outcome
```

Features that do not improve application readiness, application quality, or outcome learning should be treated as secondary.

---

## 2. Readiness Authority

`lib/readiness/evaluator.ts` is the canonical readiness authority.

It owns:

- readiness checklist
- blocked reasons
- ready/not-ready state
- apply eligibility
- generate eligibility
- readiness next action

No page, component, API route, or helper may independently decide whether a job is ready, applyable, blocked, or next-action eligible.

Allowed downstream consumers:

- dashboard counts
- jobs list stages
- job detail CTAs
- documents CTAs
- analytics breakdowns
- coach context
- ready-to-apply gate

These consumers may display local facts such as "documents exist" or "score exists", but they must not become alternate readiness authorities.

---

## 3. State Model

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

---

## 4. Apply Gate

All apply actions must route through:

```txt
/ready-to-apply
```

`/ready-queue` exists only as a compatibility redirect.

Rules:

- no direct apply CTA outside the gate
- no direct status mutation to applied outside `lib/actions/apply.ts`
- blocked applications may be overridden only through the explicit override flow
- overrides must be logged

---

## 5. Quality And Evidence

Quality is part of readiness, not a side feature.

The readiness checklist must expose:

- resume generated
- cover letter generated
- evidence threshold met
- quality passed

Evidence must feed readiness. Evidence pages may manage proof points, but job-level readiness must reflect whether enough evidence is mapped for the application package.

---

## 6. Canonical Sidebar Routes

| Route | Purpose | File |
|---|---|---|
| `/dashboard` | Command center | `app/(dashboard)/dashboard/page.tsx` |
| `/coach` | State-aware guidance | `app/(dashboard)/coach/page.tsx` |
| `/jobs` | All jobs pipeline | `app/(dashboard)/jobs/page.tsx` |
| `/jobs/new` | Add job | `app/(dashboard)/jobs/new/page.tsx` |
| `/jobs/[id]` | Job detail and progress | `app/(dashboard)/jobs/[id]/page.tsx` |
| `/jobs/[id]/evidence-match` | Evidence gaps and mapping guidance | `app/(dashboard)/jobs/[id]/evidence-match/page.tsx` |
| `/jobs/[id]/documents` | Generated materials review | `app/(dashboard)/jobs/[id]/documents/page.tsx` |
| `/ready-to-apply` | Apply gate | `app/(dashboard)/ready-to-apply/page.tsx` |
| `/ready-queue` | Compatibility redirect | `app/(dashboard)/ready-queue/page.tsx` |
| `/applications` | Applied/outcome tracker | `app/(dashboard)/applications/page.tsx` |
| `/documents` | Materials library | `app/(dashboard)/documents/page.tsx` |
| `/evidence` | Career Context | `app/(dashboard)/evidence/page.tsx` |
| `/career-context` | Compatibility redirect | `app/(dashboard)/career-context/page.tsx` |
| `/analytics` | Pipeline analytics | `app/(dashboard)/analytics/page.tsx` |
| `/logs` | Activity log | `app/(dashboard)/logs/page.tsx` |
| `/profile` | User profile | `app/(dashboard)/profile/page.tsx` |
| `/billing` | Plan and billing | `app/(dashboard)/billing/page.tsx` |
| `/settings` | Settings | `app/(dashboard)/settings/page.tsx` |

Do not add sidebar routes for legacy concepts unless the route exists and is wired to readiness.

Known non-canonical legacy routes that should not be linked:

- `/jobs/[id]/red-team`
- `/jobs/[id]/interview-prep`
- `/companies`
- `/templates`
- `/manual-entry`

---

## 7. API And Auth Rules

All API routes must authenticate the user and tenant-scope reads/writes with `user_id`.

Preferred pattern:

```ts
import { requireUser } from "@/lib/supabase/require-user"
```

If a route still uses `supabase.auth.getUser()`, it must still:

- reject unauthenticated requests
- filter every user-owned query by `user_id`
- never trust `user_id` from request input

Never silently swallow Supabase errors. Log with:

```ts
console.error("[HireWire] ...", error)
```

---

## 8. Generation Spine

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

---

## 9. Evidence And Truth Rules

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

---

## 10. JSONB Safety

JSONB columns may be `null`, `{}`, or arrays. Guard before `.map()`.

Correct:

```ts
const items = Array.isArray(data.column) ? data.column : []
```

Forbidden:

```ts
const items = data.column || []
```

---

## 11. Column Name Map

| Table | Use | Never use |
|---|---|---|
| `source_resumes` | `file_name` | `filename` |
| `source_resumes` | `parsed_text` | `content_text` |
| `jobs` | `role_title` | `title` |
| `jobs` | `company_name` | `company` |
| `job_analyses` | `title`, `company` | `jobs.title`, `jobs.company` |
| `user_profile` | `website_url`, `github_url` | `linkedin_url`, `portfolio_url` |
| `evidence_library` | `confidence_level` | `confidence_score` as display authority |

---

## 12. Frontend Rules

- Use Tailwind utility classes and existing `hw-*` classes.
- Use `cn()` for conditional class names.
- Use shadcn/ui primitives when available.
- Add `"use client"` only for hooks, browser APIs, or event handlers.
- Prefer Server Components for data fetching.
- Do not use `useEffect` for primary data fetching in new pages.
- Keep empty states actionable.

---

## 13. High-Risk Files

Understand the full flow before changing:

| File | Risk |
|---|---|
| `lib/readiness/evaluator.ts` | Canonical readiness authority |
| `lib/actions/apply.ts` | Only apply mutation path |
| `app/(dashboard)/ready-to-apply/page.tsx` | Apply gate |
| `app/api/generate-documents/route.ts` | Writes generated materials and quality |
| `lib/canonical-evidence.ts` | Evidence normalization |
| `lib/coach/claim-validator.ts` | Claim safety |
| `lib/coach/drift-scorer.ts` | Drift safety |
| `lib/contracts/hirewire.ts` | Billing/product contract |

---

## 14. Build Verification

After readiness, route, API, or document-generation changes, run:

```bash
npx tsc --noEmit
npm run lint
npm run build
```

If one cannot be run, report that clearly.
