# HireWire BUILD_CONSTITUTION.md
# Single source of truth for all build sessions.
# Last updated: 2026-06-03
# Drop this file at /workspaces/HireWireInGroup/BUILD_CONSTITUTION.md

---

## 1. What HireWire Is

**One-liner:** Verified career proof engine — evidence-grounded document generation with TruthSerum claim validation and a governance layer. Every output is grounded in user evidence. Nothing is fabricated.

**Core principle:** Never fabricate. Every generated output must trace to verified evidence from the user's `evidence_library`. If evidence doesn't exist, the output doesn't ship.

---

## 2. Dead Systems — Do Not Reference, Do Not Resurrect

| System / Pattern | Status | What Replaced It | Action |
|---|---|---|---|
| `@ai-sdk/groq` | DEAD | Anthropic via AI SDK v6 | Never import. Never add GROQ_API_KEY. |
| `lib/adapters/groq.ts` | DEAD | `lib/adapters/anthropic.ts` | Dead file — do not import from it |
| `lib/ai/service.ts` | DEAD | Direct AI SDK v6 calls | Dead file — do not import from it |
| `generateObject()` | DEAD | `generateText + Output.object()` | Does not exist in AI SDK v6 |
| `generated_documents` table | LEGACY | `jobs.generated_resume` / `jobs.generated_cover_letter` | Never read from. Never write to. Always empty. |
| `user_profile.links` JSONB | LEGACY | `user_profile_links` table | Do not write. Do not read as live source. |
| `jobs_deprecated` | DEAD | `jobs` | Never query. |
| `profiles_deprecated` | DEAD | `user_profile` | Never query. |
| `profiles` | DEAD | `user_profile` | Never query. |
| PostHog | REMOVED (2026-04-22) | Vercel Analytics (`@vercel/analytics/next`) | Removed. Do not re-add. |
| `@ai-sdk/anthropic` direct import | FORBIDDEN | `CLAUDE_MODELS` from `lib/adapters/anthropic.ts` | Use the constants, not the raw provider. |

---

## 3. Tech Stack (Verified)

| Layer | Tool | Notes |
|---|---|---|
| Framework | Next.js + TypeScript + App Router | Strict mode |
| Auth + DB + Storage | Supabase | Project: `endovljmaudnxdzdapmf` — 131 tables live |
| AI | Vercel AI SDK v6 (`ai ^6.0.0`, locked 6.0.182) + Anthropic | See Section 4 |
| Billing | Stripe | Live in Vercel |
| Deployment | Vercel | Production live |
| Analytics | Vercel Analytics (`@vercel/analytics/next`) | Sole provider — no duplicates |
| UI | shadcn/ui + Tailwind | |
| Export | DOCX export — REAL and working | |

---

## 4. AI Models — All in `lib/adapters/anthropic.ts`

```typescript
// CORRECT
import { generateText, Output } from "ai"
import { CLAUDE_MODELS } from "@/lib/adapters/anthropic"

const result = await generateText({
  model: CLAUDE_MODELS.SONNET,    // primary generation
  // CLAUDE_MODELS.OPUS            // complex reasoning
  // CLAUDE_MODELS.HAIKU           // fast/simple tasks
  output: Output.object({ schema: MyZodSchema }),
  prompt: "...",
})
const data = result.experimental_output

// FORBIDDEN
import { generateObject } from "ai"               // does not exist in v6
import { anthropic } from "@ai-sdk/anthropic"     // use CLAUDE_MODELS instead
import { createGroq } from "@ai-sdk/groq"          // Groq is dead
```

---

## 5. Phase Structure

```
Phase 1–3  — Core evidence + generation loop     ✅ DONE
Phase 4    — Governance layer                     ✅ DONE (40 runs live in DB)
Phase 5    — Alpha completion (3 items remaining) 🔴 IN PROGRESS
Phase 6    — Post-alpha                           🚫 Deferred
```

### Active Phase 5 Tasks

| ID | Task | Status |
|---|---|---|
| 5.1 | `generated_claims` table + write from generate route | Pending |
| 5.2 | `GovernancePanel` component (`components/documents/GovernancePanel.tsx`) | Pending |
| 5.3 | Verification badges in `DocumentsEditor` | Pending |

**Estimated:** 2–4 days. These are the only remaining items for Alpha.

---

## 6. Key API Routes

```
POST  /api/generate-documents           — canonical document generation route
POST  /api/coach/sessions               — create coach session
POST  /api/coach/sessions/[id]/messages — add message to coach session
POST  /api/coach/sessions/[id]/confirm  — confirm coach output
POST  /api/coach/sessions/[id]/reject   — reject coach output
POST  /api/jobs/[id]/quality-pass       — approve quality (singleton — no second route)
DELETE /api/jobs/[id]/quality-pass      — revoke quality approval
GET   /api/profile                      — user_profile core fields only
```

---

## 7. Auth Pattern

```typescript
// All protected routes
import { requireUser } from "@/lib/supabase/require-user"
const { user, supabase } = await requireUser()

// Paid-only routes
import { requirePaidUser } from "@/lib/supabase/require-user"
const { user, supabase } = await requirePaidUser()

// Admin (bypasses RLS — server only)
import { createAdminClient } from '@/lib/supabase/admin'

// Error format (all routes)
return NextResponse.json(
  { success: false, error: 'error_code', user_message: 'Human readable' },
  { status: 400 }
)
```

**Do NOT** implement custom auth checks inline in routes.

---

## 8. Tenant Isolation — Mandatory on Every Query

Every query touching user data must include BOTH:

```typescript
.eq("user_id", user.id)   // tenant isolation — ALWAYS
.is("deleted_at", null)   // soft delete filter — jobs table only
```

RLS is a backup, not a replacement for explicit filtering.

---

## 9. Unsafe Column Types — Required Guards

These columns can return `null`, `{}` (empty object), or a proper array. `.map()` on `{}` crashes.

```typescript
// CORRECT
const links = Array.isArray(data.links) ? data.links : []

// FORBIDDEN — {} is truthy, .map() still crashes
const links = data.links || []
profile.links.map(...)
```

Columns requiring `Array.isArray()` guards:
`user_profile.links`, `user_profile.education`, `user_profile.experience`, any JSONB column expected to be an array.

---

## 10. Canonical Data Sources

| Domain | Canonical Source | Dead / Legacy Source | Risk If Wrong |
|---|---|---|---|
| Generated resume content | `jobs.generated_resume` | `generated_documents` (always empty) | Nulls all generated content downstream |
| Generated cover letter | `jobs.generated_cover_letter` | `generated_documents` | Same |
| External profile links | `user_profile_links` table | `user_profile.links` JSONB | Stale / missing data |
| Job title + company | `jobs.role_title`, `jobs.company_name` | `job_analyses.title`, `job_analyses.company` | Wrong fields, DB errors |
| Proof chain | `prove_fit_decisions` (21 columns) | — | Loss of evidence trail |
| Per-claim verdicts | `governance_claim_verdicts` | — | Loss of governance audit |

---

## 11. Readiness Engine — Sole Gate Authority

`lib/readiness.ts` is the ONLY place readiness logic lives.

```typescript
evaluateJobReadiness(jobId, userId)  // per-job detail views
getReadyJobIds(userId)               // list views
```

No page, component, or API route may compute its own readiness logic.
Do NOT write `status: "ready"` directly — status is derived from artifacts, not written.

---

## 12. Billing / Plan Types

Defined in `lib/contracts/hirewire.ts`:

```typescript
PlanType = "free" | "pro" | "enterprise"
```

Do NOT introduce `"monthly"`, `"lifetime"`, `"starter"`, or any other variant.
Live DB `public.users` uses these exact values.
Free users: limited generation count (check `lib/contracts/hirewire.ts` for current limit).

---

## 13. Canonical Storage Patterns

| Entity | Canonical Table / Column | CRUD Path | Do Not Use |
|---|---|---|---|
| External profile links | `user_profile_links` | `lib/actions/profile-links.ts` server actions only | `user_profile.links` JSONB |
| User core fields | `user_profile` via `/api/profile` | `/api/profile` route | `generated_documents` |
| Coach sessions | `coach_sessions` | `/api/coach/sessions` | — |
| Evidence | `evidence_library` | — | — |

---

## 14. Singleton Routes

These routes must exist exactly once. Duplicates cause conflicting logic.

| Route | File | Allowed Methods | Notes |
|---|---|---|---|
| Quality pass | `app/api/jobs/[jobId]/quality-pass/route.ts` | POST, DELETE | POST = approve, DELETE = revoke. No second route. |
| Document generation | `app/api/generate-documents/route.ts` | POST | Writes canonical columns. No competing route. |

---

## 15. Column Name Mapping — Critical

Using wrong names causes silent DB errors.

| Table | Use | Do NOT Use |
|---|---|---|
| `source_resumes` | `file_name` | ~~`filename`~~ |
| `source_resumes` | `parsed_text` | ~~`content_text`~~ |
| `source_resumes` | `file_type` (required NOT NULL) | — |
| `jobs` | `role_title` | ~~`title`~~ |
| `jobs` | `company_name` | ~~`company`~~ |
| `job_analyses` | `title`, `company` | (these live here, not on `jobs`) |

---

## 16. Key Tables

| Table | Always Filter By |
|---|---|
| `jobs` | `user_id` + `deleted_at IS NULL` |
| `user_profile` | `user_id` |
| `user_profile_links` | `user_id` |
| `job_analyses` | `user_id` |
| `evidence_library` | `user_id` |
| `coach_sessions` | `user_id` |
| `prove_fit_decisions` | `user_id` (via job) |

**Never query:** `jobs_deprecated`, `profiles_deprecated`, `profiles`, `generated_documents`

---

## 17. SQL Migration Order for Constraint Changes

```sql
ALTER TABLE jobs DROP CONSTRAINT jobs_status_check;    -- 1. Drop first
UPDATE jobs SET status = 'new_value' WHERE ...;         -- 2. Update data
ALTER TABLE jobs ADD CONSTRAINT jobs_status_check       -- 3. Add new
  CHECK (status IN (...));
```

---

## 18. High-Risk Files — Do Not Modify Without Full Understanding

| File | Risk | Why |
|---|---|---|
| `lib/readiness.ts` | CRITICAL | Breaking gates breaks the entire job workflow |
| `lib/actions/jobs.ts` | CRITICAL | Core data access — `getJobById` null-override was catastrophic |
| `app/api/generate-documents/route.ts` | HIGH | Writes canonical columns — wrong writes null all content |
| `app/api/jobs/[jobId]/quality-pass/route.ts` | HIGH | Only quality-pass route that should exist |
| `lib/contracts/hirewire.ts` | HIGH | Billing source of truth — wrong values = DB constraint violation |
| `lib/adapters/anthropic.ts` | HIGH | Model constants for all AI routes — breakage = all generation fails |
| `middleware.ts` | HIGH | Auth redirect — breakage = no auth on protected routes |

---

## 19. Before Any Code Change — Reality Check

- [ ] Reading document content from `jobs.generated_resume` (NOT `generated_documents`)?
- [ ] `Array.isArray()` guards on every JSONB column being mapped?
- [ ] Using `generateText + Output.object()` — NOT `generateObject`?
- [ ] `user_id` AND `deleted_at IS NULL` filters on every `jobs` query?
- [ ] Using `CLAUDE_MODELS.SONNET/HAIKU/OPUS` — not a raw model string?
- [ ] No Groq reference slipped in?
- [ ] Gate/readiness computed by `lib/readiness.ts` — not inline?
- [ ] Not touching a High-Risk file without full understanding?
- [ ] TypeScript compiles clean after the change?

---

## 20. Never Do These

| Action | Why It Breaks |
|---|---|
| Import from `@ai-sdk/groq` or `lib/adapters/groq` | Groq removed — breaks imports |
| Use `generateObject()` | Does not exist in AI SDK v6 |
| Read content from `generated_documents` | Always empty — nulls downstream content |
| Override `jobs.generated_resume` with null from dead relation | Breaks entire review spine |
| Write `status: "ready"` to gate quality approval | Readiness is derived, not written |
| Create a second quality-pass route | Duplicate with conflicting logic |
| Call `.map()` on JSONB without `Array.isArray()` guard | Crashes on `{}` return |
| Use `data.links \|\| []` for JSONB arrays | `{}` is truthy — `.map()` still crashes |
| Add billing plan values not in `lib/contracts/hirewire.ts` | DB constraint violation |
| Query without `user_id` filter | Tenant isolation failure |
| Query `jobs` without `deleted_at IS NULL` | Returns soft-deleted records |
| Use PostHog | Removed April 22 2026 — use Vercel Analytics |
| Write to `user_profile.links` JSONB | Legacy — use `user_profile_links` table |
| Use raw model strings | Use `CLAUDE_MODELS` constants only |

---

## 21. Scope Control Rules (Non-Negotiable)

1. Every build task must name at least one file path from the repo
2. Phase 5 (Alpha) cannot close until all 3 items (5.1, 5.2, 5.3) are marked Done
3. No new DB tables or API routes without a Decision Record first
4. "Done" = specific observable behavior in the running app — not "works" or "looks right"
5. Phase structure changes require Rory approval

---

## 22. Build Philosophy

1. Correctness before elegance
2. No fake completeness — a spinner is not a feature
3. Single source of truth per domain — one canonical column, one canonical route
4. Fail loudly, fail safely
5. Tenant safety is non-negotiable — every query is scoped
6. **The spine must stay unbroken:** Generate → Review → Approve → Ready → Apply

---

## 23. Testing

**Status:** DEFERRED — post-Alpha scope

When added: Playwright e2e first (user journey), vitest second (unit logic in readiness + governance).

---

## 24. Source of Truth Links

| Resource | Path |
|---|---|
| Repo | `/workspaces/HireWireInGroup` |
| Supabase project | `endovljmaudnxdzdapmf` |
| Handoff doc (v2) | `docs/HIREWIRE_ALPHA_CODEX_HANDOFF_v2.md` |
| Frontend scope | `docs/HIREWIRE_ALPHA_FRONTEND_SCOPE.md` |
| Schema migrations | `docs/HIREWIRE_ALPHA_SCHEMA_MIGRATIONS.md` |
| Codex active task | `.agent/CODEX_TASK.md` |

---

**This document is the constitution. When in doubt, this wins.**
