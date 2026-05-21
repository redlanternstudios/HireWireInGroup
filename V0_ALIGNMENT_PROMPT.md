# HireWire v0 Alignment Prompt
## Canonical Contract for Every v0 Build Session

**Version**: 1.3.0
**Last Updated**: 2026-05-19

---

## Required Companion Spec (UI Cohesion)

Before any UI-focused pass, also read:

- `hire-wire-sight-engine-ui-cohesion-pass.md`

If there is any conflict on visual/layout guidance, follow this precedence order:

1. `.github/copilot-instructions.md`
2. `CLAUDE.md`
3. `hire-wire-sight-engine-ui-cohesion-pass.md`
4. `V0_ALIGNMENT_PROMPT.md`
5. `.ai/prompts/v0-ui-alignment.md`

---

## Your Role

You are building features for HireWire, a job application intelligence product.
You are not a blank-slate AI. You are operating inside an established codebase
with live production contracts, a running Supabase database, active RLS policies,
and a specific AI SDK version. Every change you make must respect these contracts
or the build breaks.

Before writing any code, read this document fully. Do not assume anything not
stated here. If something is undefined, say so — do not invent a default.

---

## Mandatory Orientation: What This System Is

HireWire is a multi-step job application workflow:

```
Onboarding → Resume Upload → Job Add → Analyze → Evidence Match →
Coach → Ready Queue → Generate Documents → Red Team Review → Apply
```

Each step is gated. A job cannot advance to a later stage without the
prior stage producing real artifacts in the database. The readiness engine
in `lib/readiness.ts` is the single source of truth for workflow gates.
**No page or component may compute readiness locally.**

---

## The 10 Canonical Contracts You Must Never Break

### 1. Document Content Source of Truth
`jobs.generated_resume` and `jobs.generated_cover_letter` are the canonical
columns for all generated document content.

- `generate-documents/route.ts` writes to these columns.
- Every consumer (red-team page, ready queue, export routes, job detail) must
  read from these columns — not from the `generated_documents` relation.
- `generated_documents` is a secondary history/versioning table. It is NEVER
  populated by the generation path. Do not query it for content.

**The bug this prevents:** `generated_documents` always returns empty, so
any code that reads from it and overrides `jobs.*` values will null out
all generated content downstream.

### 2. AI SDK Pattern
This codebase uses Vercel AI SDK v6 through `@/lib/ai/gateway`.
For structured JSON, use `generateStructuredText()` so providers that reject
`json_schema` never receive schema-mode requests.

```typescript
// CORRECT
import { generateStructuredText, CLAUDE_MODELS } from "@/lib/ai/gateway"

const data = await generateStructuredText({
  model: CLAUDE_MODELS.SONNET,
  schema: MyZodSchema,
  schemaDescription: `{
    "items": string[]
  }`,
  prompt: "...",
})

// FORBIDDEN — these patterns break the build
import { generateObject } from "ai"                    // ❌ does not exist in v6
import { anthropic } from "@ai-sdk/anthropic"          // ❌ use CLAUDE_MODELS instead
import { Output } from "ai"                            // ❌ do not use Output.object
import { createGroq } from "@ai-sdk/groq"              // ❌ Groq is dead code
model: anthropic("claude-sonnet-4-20250514")           // ❌ wrong pattern
output: Output.object({ schema: MyZodSchema })         // ❌ can trigger json_schema 400s
```

Model constants live in `lib/ai/gateway.ts`:
- `CLAUDE_MODELS.SONNET` — primary generation model
- `CLAUDE_MODELS.OPUS` — complex reasoning
- `CLAUDE_MODELS.HAIKU` — fast/simple tasks

### 3. Groq Is Dead
Groq has been fully removed from all active code paths. `lib/adapters/groq.ts`
and `lib/ai/service.ts` are dead files — do not import from them.
Do not add `GROQ_API_KEY` references. Do not add Groq fallbacks.
If you see a Groq comment in an existing file, update it to say Claude.

### 4. JSONB Array Safety
These Supabase columns can return `null`, `{}` (empty object), or a proper array.
Calling `.length` or `.map()` on them without a guard **crashes the page**.

Columns requiring `Array.isArray()` guards:
- `user_profile.links`
- `user_profile.education`
- `user_profile.experience`
- Any JSONB column you interact with that is expected to be an array

```typescript
// CORRECT
const links = Array.isArray(data.links) ? data.links : []
const education = Array.isArray(data.education) ? data.education : []

// FORBIDDEN — these crash when Supabase returns {}
const links = data.links || []       // ❌ {} is truthy, stays {}
profile.links.map(...)               // ❌ crashes if {} returned
```

### 5. Tenant Isolation — Mandatory Query Pattern
Every query touching user data must include both filters:

```typescript
.eq("user_id", user.id)     // ALWAYS — tenant isolation
.is("deleted_at", null)     // ALWAYS on jobs — soft delete filter
```

Never omit either. RLS is a backup, not a replacement for explicit filtering.

### 6. Auth Pattern
Use `lib/supabase/require-user.ts` for route auth:

```typescript
// API routes
import { requireUser } from "@/lib/supabase/require-user"
const { user, supabase } = await requireUser()

// Paid-only routes
import { requirePaidUser } from "@/lib/supabase/require-user"
const { user, supabase } = await requirePaidUser()
```

Do not implement custom auth checks inline in routes. The central helper
handles unauthorized redirect and error responses consistently.

### 7. Quality Pass Route
The canonical quality-pass endpoint is:
`app/api/jobs/[id]/quality-pass/route.ts`

- POST: approve (sets `quality_passed=true`, `quality_passed_at`, audit event)
- DELETE: revoke

All job API routes use `[id]` as the dynamic segment (standardized in PR #67).
Do not add a competing route that writes `status: "ready"`.
Status is derived from artifacts by the readiness engine — never written directly
to gate a job into "ready".

### 8. Billing Contract
`lib/contracts/hirewire.ts` is the source of truth for all plan/subscription types.

```typescript
PlanType = "free" | "pro" | "enterprise"
```

The live DB `public.users` table uses these exact values.
Do not introduce `"monthly"`, `"lifetime"`, `"starter"`, or any other variant.
If you touch billing logic, check `lib/contracts/hirewire.ts` first.

### 9. SQL Migration Order for CHECK Constraints
When writing migrations that change a CHECK constraint:

```sql
-- CORRECT ORDER
ALTER TABLE jobs DROP CONSTRAINT jobs_status_check;  -- 1. Drop first
UPDATE jobs SET status = 'new_value' WHERE ...;      -- 2. Then update data
ALTER TABLE jobs ADD CONSTRAINT jobs_status_check    -- 3. Then add new constraint
  CHECK (status IN (...));
```

Never put UPDATE before DROP in the same migration script. Supabase executes
statements in order — the CHECK violation fires immediately.

### 10. Readiness Engine Is Sole Gate Authority
`lib/readiness/evaluator.ts` is the canonical readiness authority (not the legacy `lib/readiness.ts`).

No page, component, or API route may compute its own readiness logic.
No component may locally derive whether a job "can generate" or "can apply".
Call the readiness engine. Trust its output.

### 12. Governance Is Part of Generation — Not a Side Feature
Every document generation run produces a `generation_governance_runs` row and per-claim `governance_claim_verdicts` rows. These are written by `app/api/generate-documents/route.ts` and must not be bypassed.

Governance columns on `jobs`:
- `governance_passed` — whether the latest run passed all checks
- `governance_drift_score` — 0–100; score ≥ 65 blocks persistence
- `last_governance_run_id` — FK to `generation_governance_runs.id`
- `governance_version` — e.g. `"1.0.0"`

**Do not read governance state from anywhere other than `jobs` or `generation_governance_runs`.** Do not recompute drift or claim validation locally.

`confidence` values in `governance_claim_verdicts`: `high | medium | low | fabricated`. A `fabricated` verdict means the claim has no grounding in `evidence_library` — never suppress or hide these.

### 11. Profile Links — Canonical Storage and CRUD Path

External profile links (LinkedIn, GitHub, Portfolio, Website, Other) are stored
in `user_profile_links`. This is the live canonical table — not `user_profile.links` JSONB.

**CRUD path**: `lib/actions/profile-links.ts` server actions only.

- `getProfileLinks()` — read all links for user
- `addProfileLink({ link_type, url, label? })` — create with URL validation
- `updateProfileLink({ id, url?, label?, link_type? })` — update own link
- `removeProfileLink(id)` — delete own link
- `setPrimaryLink(id)` — set is_primary true (trigger handles unset on others)

**Rules that must be enforced:**

- Multiple links per type are allowed
- One `is_primary = true` per link_type per user
- URL must pass `isValidUrl()` before insert or update
- Duplicate exact URLs must be blocked before insert
- No link write may go through `/api/profile` POST
- `/api/profile` handles `user_profile` core fields only (name, title, email, etc.)

**What `user_profile.links` JSONB is:**
Legacy column. Contains migration fodder from old scalar URL fields.
`migrateLegacyLinks()` in `profile-links.ts` reads it to backfill `user_profile_links`.
Do not write to `user_profile.links`. Do not read it as live link truth.

**Scalar URL fields (`linkedin_url`, `github_url`, `website_url`):**
Still written by `/api/profile` for backward compatibility. Treated as migration source only.
Do not add new consumers that read these as the primary link source.

---

## Live Schema Quick Reference

### Tables You Will Touch Most

| Table | Critical Columns | Always Filter |
|---|---|---|
| `jobs` | `generated_resume`, `generated_cover_letter`, `quality_passed`, `evidence_map`, `deleted_at`, `governance_passed`, `governance_drift_score`, `last_governance_run_id` | `user_id` + `deleted_at IS NULL` |
| `user_profile` | `education(jsonb)`, `experience(jsonb)`, `skills[]` — core professional identity | `user_id` |
| `user_profile_links` | `link_type`, `url`, `is_primary`, `label`, `source`, `parse_status` — **canonical link storage** | `user_id` |
| `job_analyses` | `qualifications_required`, `qualifications_preferred`, `keywords` | `user_id` |
| `job_scores` | `overall_score`, `skills_match`, `experience_relevance` | via jobs RLS subquery |
| `evidence_library` | `source_type`, `outcomes[]`, `tools_used[]`, `is_active` | `user_id` |
| `audit_events` | `event_type`, `outcome`, `metadata(jsonb)` | `user_id` |
| `generation_governance_runs` | `strategy`, `drift_score`, `drift_is_blocking`, `governance_passed`, `failed_at_phase`, `governance_version` | `user_id`, `job_id` |
| `governance_claim_verdicts` | `document_type`, `claim_text`, `confidence`, `evidence_exists`, `claim_grounded`, `failure_reason` | `user_id`, `run_id` |

### Tables That Are Read-Only for Most Features
- `companies` — lookup only unless explicitly managing companies
- `source_resumes` — written by resume upload route only
- `generated_documents` — do not write to this; do not read content from it

### Deprecated — Never Query
- `jobs_deprecated`, `profiles_deprecated`, `profiles`

---

## PostHog Funnel Events — All 6 Must Fire

Import from `@/lib/analytics`:

```typescript
import {
  trackJobAdded,           // Stage 1: job added to pipeline
  trackJobAnalyzed,        // Stage 2: analysis complete
  trackEvidenceMatchCompleted, // Stage 3: evidence matching done
  trackDocumentsGenerated, // Stage 4: resume + cover letter generated
  trackQualityPassed,      // Stage 5: red team approved
  trackApplied,            // Stage 6: user applied
} from "@/lib/analytics"
```

These must fire on every code path where the event occurs — including
the ready-queue's Mark Applied path, not just job-detail.
Do not add a new tracking function that calls `posthog.capture()` directly —
always go through `@/lib/analytics`.

---

---

## What v0 Must Do Before Submitting Any PR

### 1. Reality Check — Ask These Questions
- Does my code read document content from `jobs.generated_resume` (not `generated_documents`)?
- Do I have `Array.isArray()` guards on every JSONB column I'm mapping?
- Am I using `generateStructuredText()` for structured JSON, never `Output.object()` or `generateObject()`?
- Did I include `user_id` and `deleted_at` filters on every jobs query?
- Am I using `CLAUDE_MODELS.SONNET` not a raw model string?
- Did any Groq reference slip in?
- Did I add a route that competes with `[jobId]/quality-pass`?
- Am I computing readiness locally instead of calling `lib/readiness.ts`?

### 2. Wiring Check
- Every new page has a route in `app/`
- Every new API route has `requireUser()` at the top
- Every new client component with events has PostHog tracking
- Every new server action has a try/catch with Sentry capture

### 3. State and Truth Check
- New data state reads from DB, not from stale client state
- Loading, empty, and error states are all handled
- No fake success messages — only confirm what actually happened in the DB

---

## What v0 Must Never Do

| Forbidden Action | Why |
|---|---|
| Import from `@ai-sdk/groq` or `lib/adapters/groq` | Groq removed; breaks imports |
| Use `generateObject()` | Does not exist in AI SDK v6 |
| Use `Output.object()` / `experimental_output` | Can trigger provider `json_schema` failures |
| Read content from `generated_documents` relation | Always empty; nulls downstream |
| Override `jobs.generated_resume` with null from dead relation | Breaks entire review spine |
| Write `status: "ready"` to gate quality approval | Readiness is derived, not written |
| Create a second quality-pass route under `[id]/` | Duplicate with conflicting logic |
| Bypass governance writes in generate-documents | Governance must run and persist on every generation, including fallback |
| Recompute drift or claim validation outside the governance pipeline | `generation_governance_runs` is the canonical record |
| Suppress or hide `fabricated` confidence verdicts | These are claim safety signals — always surface them |
| Call `.map()` on JSONB without `Array.isArray()` guard | Crashes on `{}` return |
| Use `data.links || []` pattern for JSONB arrays | `{}` is truthy, .map() still crashes |
| Add billing plan values not in `lib/contracts/hirewire.ts` | DB constraint violation |
| Query without `user_id` filter | Tenant isolation failure |
| Query jobs without `deleted_at IS NULL` | Returns soft-deleted records |

---

## File Ownership — Do Not Modify Without Understanding These

| File | What It Does | Risk If Mishandled |
|---|---|---|
| `lib/readiness.ts` | Sole workflow gate authority | Breaking gates breaks entire workflow |
| `lib/actions/jobs.ts` | Core data access layer | `getJobById` null-override bug was catastrophic |
| `app/api/generate-documents/route.ts` | Core generation path | Writes canonical columns; catch block must not write nonexistent columns |
| `app/api/jobs/[jobId]/quality-pass/route.ts` | Canonical approve/revoke | Only quality-pass route that should exist |
| `lib/contracts/hirewire.ts` | Billing type source of truth | Diverging from this breaks DB constraints |
| `lib/adapters/anthropic.ts` | Model constant definitions | Changing model IDs breaks all AI routes |
| `components/posthog-provider.tsx` | PostHog initialization + user identity | Wraps the entire app; changes affect all events |
| `lib/readiness/evaluator.ts` | Canonical readiness authority (replaces legacy `lib/readiness.ts`) | Breaking gates breaks the entire workflow |
| `lib/coach/claim-validator.ts` | Per-claim grounding checks against evidence_library | False negatives allow fabricated content through |
| `lib/coach/drift-scorer.ts` | Drift score computation; ≥65 blocks persistence | Wrong threshold lets high-drift docs persist |

---

## Current Spine Status (as of 2026-05-19)

All stages of the workflow spine are wired and unblocked:

| Stage | Route/Page | Status |
|---|---|---|
| Job Add + Analyze | `/api/analyze` | ✅ |
| Evidence Match | `/jobs/[id]/evidence-match` | ✅ |
| Generate Documents | `/api/generate-documents` | ✅ |
| Governance Audit | auto-runs inside generation | ✅ E2E verified |
| Document Review | `/jobs/[id]/documents` | ✅ |
| Ready Gate | `lib/readiness/evaluator.ts` + `/ready-to-apply` | ✅ |
| Apply | `lib/actions/apply.ts` | ✅ |

E2E verified on 2026-05-19: `governance_passed=true`, `drift_score=0`,
15 claim verdicts all `high` confidence, `quality_passed=true`, `generation_status=ready`.

All 6 PostHog funnel events are wired. Sentry capture is wired on
`analyze` and `generate-documents`. `lib/analytics.ts`, `lib/audit.ts`,
and `app/providers/posthog-provider.tsx` are all on remote.

**One known caveat**: `/api/ai/health` reports AI Gateway unconfigured on preview.
The governance pipeline is proven correct on the fallback path. Once `AI_GATEWAY_API_KEY`
is wired in Vercel env, live generation will exercise the same pipeline.

---

## When You Are Unsure

State it explicitly. Do not silently fill gaps. Label your uncertainty as:
- **DEFINED** — explicitly confirmed in this document or the codebase
- **ASSUMED** — reasonable inference not yet verified
- **MISSING** — required but not yet defined
- **RISKY** — defined but fragile or likely to break

Prefer a working, honest build over a polished, broken one.

---

## Build Philosophy for HireWire

1. **Correctness before elegance.** If it's elegant but wrong, it ships broken.
2. **No fake completeness.** A spinner is not a feature. A mock is not a capability.
3. **Single source of truth per domain.** One canonical column, one canonical route, one canonical lib.
4. **Fail loudly, fail safely.** Errors surface to Sentry. Users see recoverable messages.
5. **Tenant safety is non-negotiable.** Every query is scoped. Every write is owned.
6. **The spine must stay unbroken.** Generate → Review → Approve → Ready → Apply.
   Any change that nulls, bypasses, or short-circuits this flow is a regression.
