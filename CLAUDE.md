# HIREWIRE — CLAUDE.md
# Repo-level constitution for Claude Code autonomous sessions.
# Last updated: 2026-05-09
# This file supersedes HIREWIRE_CONSTITUTION.md, HIREWIRE_MASTER_PROMPT.md, MASTERPROMPT.md, and V0_ALIGNMENT_PROMPT.md.
# When in doubt, this wins.

---

## 1. What HireWire Is

Evidence-based job application intelligence system — evolving into a longitudinal Career Operating System.

Takes a user's real resume and verified evidence, matches against job requirements, generates honest tailored materials, tracks outcomes, and compounds intelligence over time.

**Non-negotiable core principle:** Never fabricate. Every output is grounded in verified evidence from evidence_library. Truth is enforced at every layer.

**Product trajectory:** Resume tool → Career OS with outcome intelligence, procedural coaching, adaptive positioning, and longitudinal memory.

---

## 2. Tech Stack (Verified)

| Layer | Tool |
|---|---|
| Framework | Next.js 16.2.0 + TypeScript + App Router |
| Auth + DB + Storage | Supabase — project: `endovljmaudnxdzdapmf` |
| AI | Vercel AI SDK v6 + Anthropic Claude via AI Gateway |
| Billing | Stripe |
| Deployment | Vercel — auto-deploys from `v0/rsemeah-*` branches |
| Analytics | Vercel Analytics (`@vercel/analytics/next`) — sole provider |
<<<<<<< HEAD
=======
# Autonomous build instructions for Claude Code
# Last updated: 2026-05-09
# This file is the single source of truth. It supersedes all other prompt files.

---

## WHO YOU ARE BUILDING FOR

Rory Semeah. Founder of By Red LLC / RedLantern Studios.
HireWire is a truth-based Career OS — not a resume formatter, not an auto-apply bot.
Every architectural decision compounds toward a longitudinal intelligence layer.
Build like you understand the destination, not just the current ticket.

---

## WHAT HIREWIRE IS

Evidence-based job application intelligence system.
Takes a user's real resume and verified evidence.
Matches against job requirements.
Generates honest, tailored application materials.
Tracks outcomes. Learns over time. Compounds intelligence.

**Core principle: never fabricate.**
Every output must be grounded in verified evidence from `evidence_library`.
Truth is enforced at the data model level, not just the prompt level.

---

## TECH STACK

| Layer | Tool |
|---|---|
| Framework | Next.js + TypeScript + App Router |
| Auth + DB | Supabase — project: `endovljmaudnxdzdapmf` |
| AI | Vercel AI SDK v6 + Anthropic Claude via AI Gateway |
| Billing | Stripe |
| Deployment | Vercel — auto-deploys from `v0/rsemeah-*` branches |
| Analytics | Vercel Analytics only |
>>>>>>> 7e1a8af916b56410048e0bfccadd90f00d881991
| UI | shadcn/ui + Tailwind |

---

## 3. Dead Systems — Never Reference, Never Resurrect

| System | Status | Rule |
|---|---|---|
| n8n | DEAD | All orchestration is Next.js API routes |
| Groq | DEAD | Do not import `@ai-sdk/groq` or `lib/adapters/groq.ts` |
| PostHog | DEAD | Vercel Analytics is sole provider |
| `generated_documents` table | DEAD | Always empty. Never read content from it |
| `user_profile.links` JSONB | LEGACY | Do not write to it. Do not read as live source |
| `generateObject()` | FORBIDDEN | Does not exist in AI SDK v6 |
| `pdfjs-dist` import | REMOVED | Do not re-add |

---

## 4. AI Model Usage — Exact Pattern

```typescript
// CORRECT — always use this pattern
<<<<<<< HEAD
=======
## DEAD SYSTEMS — NEVER REFERENCE OR RESURRECT

| System | Status |
|---|---|
| n8n | DEAD — all orchestration is Next.js API routes |
| Groq | DEAD — do not import `@ai-sdk/groq` or `lib/adapters/groq` |
| PostHog | DEAD — Vercel Analytics is sole provider |
| `generated_documents` table | DEAD — always empty, never read from it |
| `user_profile.links` JSONB | LEGACY — do not write to or read as live source |
| `generateObject()` | FORBIDDEN — does not exist in AI SDK v6 |
| `jobs_deprecated` | DEAD — never query |
| `profiles_deprecated` | DEAD — never query |
| `profiles` | DEAD — never query |

---

## AI MODEL USAGE — CORRECT PATTERN

```typescript
>>>>>>> 7e1a8af916b56410048e0bfccadd90f00d881991
import { generateText, Output } from "ai"
import { CLAUDE_MODELS } from "@/lib/adapters/anthropic"

const result = await generateText({
<<<<<<< HEAD
  model: CLAUDE_MODELS.SONNET,   // primary generation
  // CLAUDE_MODELS.OPUS           // complex reasoning only
  // CLAUDE_MODELS.HAIKU          // fast/lightweight tasks
=======
  model: CLAUDE_MODELS.SONNET,  // primary generation
  // CLAUDE_MODELS.OPUS          // complex reasoning only
  // CLAUDE_MODELS.HAIKU         // fast/lightweight tasks
  model: CLAUDE_MODELS.SONNET,   // primary generation
  // CLAUDE_MODELS.OPUS           // complex reasoning only
  // CLAUDE_MODELS.HAIKU          // fast/cheap tasks only
>>>>>>> 7e1a8af916b56410048e0bfccadd90f00d881991
  output: Output.object({ schema: MyZodSchema }),
  prompt: "...",
})
const data = result.experimental_output

// FORBIDDEN
import { generateObject } from "ai"            // does not exist in v6
import { anthropic } from "@ai-sdk/anthropic"  // use CLAUDE_MODELS instead
import { createGroq } from "@ai-sdk/groq"       // Groq is dead
```

---

## 5. Auth Pattern — Mandatory on Every Protected Route

```typescript
// ALL protected routes — use requireUser, never inline auth
import { requireUser } from "@/lib/supabase/require-user"
const { user, supabase } = await requireUser()

// Paid-only routes only
<<<<<<< HEAD
=======
```

Never use raw model strings. Never use `generateObject()`. Never import Groq.

---

## AUTH PATTERN — MANDATORY

```typescript
// All protected routes and server actions
import { requireUser } from "@/lib/supabase/require-user"
const { user, supabase } = await requireUser()

// Paid-only routes
>>>>>>> 7e1a8af916b56410048e0bfccadd90f00d881991
import { requirePaidUser } from "@/lib/supabase/require-user"
const { user, supabase } = await requirePaidUser()
```

<<<<<<< HEAD
Do NOT implement custom auth checks inline in routes or pages.
New dashboard RSC pages that don't use requireUser must use this pattern instead:
=======
Do NOT implement custom auth checks inline in routes or pages. New dashboard RSC pages that don't use requireUser must use this pattern instead:
>>>>>>> 7e1a8af916b56410048e0bfccadd90f00d881991

```typescript
const supabase = await createClient()
const { data: { user } } = await supabase.auth.getUser()
if (!user) redirect('/login')
```

---

## 6. Tenant Isolation — Mandatory on Every Query
<<<<<<< HEAD
=======
Never implement custom auth checks inline. Always use `requireUser()`.

---

## TENANT ISOLATION — MANDATORY ON EVERY QUERY
>>>>>>> 7e1a8af916b56410048e0bfccadd90f00d881991

Every query touching user data must include BOTH filters:

```typescript
.eq("user_id", user.id)    // tenant isolation — never skip
.is("deleted_at", null)    // soft delete filter — jobs table only
```

RLS is a backup safety net, not a replacement for explicit filtering.

---

## 7. JSONB Array Safety — Required Guards

These columns can return `null`, `{}` (empty object), or a proper array. `.map()` on `{}` crashes silently.

```typescript
// CORRECT
const links = Array.isArray(data.links) ? data.links : []
const experience = Array.isArray(profile.experience) ? profile.experience : []

// FORBIDDEN — {} is truthy, .map() still crashes
const links = data.links || []
profile.links.map(...)
```

<<<<<<< HEAD
Columns always requiring `Array.isArray()` guards:
`user_profile.links`, `user_profile.education`, `user_profile.experience`,
`evidence_library.tools_used`, `evidence_library.industries`, `evidence_library.outcomes`,
any JSONB column expected to be an array.
=======
Columns always requiring `Array.isArray()` guards: `user_profile.links`, `user_profile.education`, `user_profile.experience`, `evidence_library.tools_used`, `evidence_library.industries`, `evidence_library.outcomes`, any JSONB column expected to be an array.
>>>>>>> 7e1a8af916b56410048e0bfccadd90f00d881991

---

## 8. Column Name Mapping — Critical

Using wrong column names causes silent DB errors (PostgREST ignores unknown columns on upsert).

| Table | Correct column | Never use |
|---|---|---|
| source_resumes | `file_name` | ~~filename~~ |
| source_resumes | `parsed_text` | ~~content_text~~ |
| source_resumes | `file_type` | (required NOT NULL — always include) |
| jobs | `role_title` | ~~title~~ |
| jobs | `company_name` | ~~company~~ |
| job_analyses | `title`, `company` | (live here, not in jobs) |
| user_profile | `website_url` | ~~linkedin_url~~ |
| user_profile | `github_url` | ~~portfolio_url~~ |
| user_profile_links | canonical links table | ~~user_profile.links JSONB~~ |

---

## 9. Document Content — Source of Truth

- **Canonical:** `jobs.generated_resume` and `jobs.generated_cover_letter`
- **Dead:** `generated_documents` table — always empty, never populated

If you read from `generated_documents` and override `jobs.*`, you null all generated content downstream.

---

## 10. Key Tables

| Table | Always Filter By | Notes |
|---|---|---|
| jobs | `user_id` + `deleted_at IS NULL` | Soft delete only |
| user_profile | `user_id` | |
| user_profile_links | `user_id` | Canonical links storage |
| job_analyses | `user_id` | |
| evidence_library | `user_id` | |
| applications | `user_id` | |

**Never query:** `jobs_deprecated`, `profiles_deprecated`, `profiles`
**Never touch:** `byred_*` tables — separate product on same Supabase project

---

## 11. Readiness Engine — Sole Gate Authority

`lib/readiness.ts` is the ONLY place readiness logic lives.

```typescript
evaluateJobReadiness(jobId, userId)  // per-job detail views
getReadyJobIds(userId)               // list views
```

<<<<<<< HEAD
No page, component, or API route may compute its own readiness logic.
Do NOT write `status: "ready"` directly — status is derived from artifacts.
=======
No page, component, or API route may compute its own readiness logic. Do NOT write `status: "ready"` directly — status is derived from artifacts.
>>>>>>> 7e1a8af916b56410048e0bfccadd90f00d881991

---

## 12. Billing / Plan Types

```typescript
// ONLY valid values — defined in lib/contracts/hirewire.ts
PlanType = "free" | "pro" | "enterprise"
```

Never introduce `"monthly"`, `"lifetime"`, `"starter"`, or any other variant.

---

## 13. High-Risk Files — Never Modify Without Full Understanding

| File | Risk if broken |
|---|---|
| `lib/readiness.ts` | Breaking gates breaks entire workflow |
| `lib/actions/jobs.ts` | Core data access — null-override was catastrophic |
| `app/api/generate-documents/route.ts` | Writes canonical columns |
| `app/api/jobs/[jobId]/quality-pass/route.ts` | Only quality-pass route that should exist |
| `lib/contracts/hirewire.ts` | Billing source of truth |
| `lib/adapters/anthropic.ts` | Model constants for all AI routes |
| `lib/canonical-evidence.ts` | Evidence normalization — truth enforcement |
| `lib/safety/` | Claim detection — do not weaken |

---

## 14. Page and Route Pattern Library

### New Dashboard Page (RSC)
Every new page under `app/(dashboard)/` follows this exact pattern:

```typescript
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

<<<<<<< HEAD
=======
.eq("user_id", user.id)    // tenant isolation
.is("deleted_at", null)    // soft delete (jobs table only)
```

RLS is a backup, not a replacement for explicit filtering.

---

## JSONB ARRAY SAFETY — REQUIRED GUARDS

These columns can return `null`, `{}` (empty object), or a proper array.
`.map()` on `{}` crashes. `|| []` does NOT protect against `{}`.

```typescript
// CORRECT
const items = Array.isArray(data.column) ? data.column : []

// FORBIDDEN — {} is truthy, .map() still crashes
const items = data.column || []
```

Columns requiring guards: `user_profile.links`, `user_profile.education`,
`user_profile.experience`, any JSONB column expected to be an array.

---

## COLUMN NAME MAP — CRITICAL

Using wrong names causes silent DB errors.

| Table | Use | Never use |
|---|---|---|
| `source_resumes` | `file_name` | ~~filename~~ |
| `source_resumes` | `parsed_text` | ~~content_text~~ |
| `jobs` | `role_title` | ~~title~~ |
| `jobs` | `company_name` | ~~company~~ |
| `job_analyses` | `title`, `company` | (these live here, NOT in jobs) |
| `user_profile` | `website_url`, `github_url` | ~~linkedin_url~~, ~~portfolio_url~~ |
| `evidence_library` | `confidence_level` | ~~confidence_score~~ |

---

## DOCUMENT CONTENT — SOURCE OF TRUTH

- **Canonical:** `jobs.generated_resume` and `jobs.generated_cover_letter`
- **Dead:** `generated_documents` table — always empty

Never read from `generated_documents`. Never override `jobs.generated_resume` with null.

---

## RESUME PROVENANCE — CRITICAL STRUCTURE

`jobs.evidence_map` is a freeform JSONB blob. Do NOT assume key names.

What generation actually writes to `jobs.evidence_map`:
- `matching_complete` (boolean)
- `matched_skills`, `matched_tools`, `matched_experiences`
- Does NOT contain `selected_evidence_ids`

Evidence IDs used in generation are tracked at bullet level via:
`jobs.resume_provenance` — array of objects, each with `source_evidence_id`

**Core evidence detection query:**
```typescript
// Fetch all jobs for user, extract source_evidence_id from resume_provenance
const { data: jobs } = await supabase
  .from("jobs")
  .select("resume_provenance")
  .eq("user_id", user.id)
  .is("deleted_at", null)
  .not("resume_provenance", "is", null)

const coreIds = new Set<string>()
for (const job of jobs ?? []) {
  const provenance = Array.isArray(job.resume_provenance) ? job.resume_provenance : []
  for (const entry of provenance) {
    if (entry?.source_evidence_id) coreIds.add(entry.source_evidence_id)
  }
}
```

**Core evidence definition:**
`confidence_level === "high"` AND `id` appears in `coreIds`
Everything else = Extended Memory.

---

## CAREER CONTEXT PAGE — SPEC

The Evidence Library page (`/evidence`) is being rebuilt as **Career Context**.

### Page title
"Career Context" — not "Evidence Library"

### Architecture
Server RSC (`page.tsx`) — fetches in parallel:
1. All `evidence_library` items for user
2. All `jobs.resume_provenance` for user (Core ID computation)
3. All `source_resumes` for user (Documents tab)

Passes typed props to:
- `CareerContextOverview.tsx` — summary card (new component)
- `EvidenceList.tsx` — tabbed list with Core/Extended toggle (rewrite)

Preserves untouched:
- `EvidenceCard.tsx`
- `AddEvidenceModal.tsx`

### Overview card metrics — all computed server-side, no new tables
- Total items by source_type
- Years experience: earliest work_experience date_range start → today
- Top industries: aggregate `industries[]` across all rows, rank by frequency
- Top skills: aggregate `tools_used[]` across all rows, rank by frequency
- Profile strength %: (work rows with outcomes) × 0.30 + (skills count capped at 20) × 0.20 + (certs) × 0.15 + (education) × 0.15 + (is_user_approved rate) × 0.20
- ATS readiness band: approved_keywords count → "Strong" ≥15 / "Medium" ≥8 / "Building" <8
- Core count: size of coreIds set

### Tab taxonomy maps to source_type values
| Tab | source_type values |
|---|---|
| Experience | `work_experience` |
| Skills | `skill` |
| Projects | `project`, `portfolio_entry`, `shipped_product`, `live_site`, `open_source` |
| Education | `education` |
| Certifications | `certification` |
| Achievements | `achievement` |
| Documents | source_resumes table |

### Experience tab behavior
Group by `company_name`. Collapsible accordions per company.
Show Core count badge per company group.
Core badge on individual items across all tabs.

### Core/Extended toggle
Global toggle above tabs. Default: show All.
Core = `confidence_level === "high"` AND id in coreIds.
Extended = everything else.

---

## DUPLICATE DETECTION — INTERCEPT AT IMPORT TIME

Duplicates are detected at upload/import time, not as a background job.
The moment LinkedIn PDF or resume lands → detect overlap against existing evidence →
show one-time deduplication review before items appear in library.

Logic lives in `lib/duplicate-detection.ts`.
Intercept must happen in the LinkedIn import flow and resume upload flow.
After user confirms once, items are merged permanently.

Use `source_resume_id` on evidence rows to trace origin for dedup comparison.

---

## BILLING — PLAN TYPES

Defined in `lib/contracts/hirewire.ts`:
`PlanType = "free" | "pro" | "enterprise"`

Never introduce "monthly", "lifetime", "starter", or any variant.
Free users capped at 5 generations/month via `generation_limit_reached` error.

---

## HIGH-RISK FILES — DO NOT MODIFY WITHOUT FULL READ

| File | Risk |
|---|---|
| `lib/readiness.ts` | Breaking gates breaks entire workflow |
| `lib/actions/jobs.ts` | Core data access |
| `app/api/generate-documents/route.ts` | Writes canonical columns |
| `app/api/jobs/[jobId]/quality-pass/route.ts` | Only quality-pass route |
| `lib/contracts/hirewire.ts` | Billing source of truth |
| `lib/adapters/anthropic.ts` | Model constants for all AI routes |

---

## PAGE PATTERNS — TEMPLATES TO FOLLOW EXACTLY

### New RSC dashboard page
```typescript
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
>>>>>>> 7e1a8af916b56410048e0bfccadd90f00d881991
export const dynamic = "force-dynamic"
export const revalidate = 0

export default async function PageName() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  // fetch data here with .eq("user_id", user.id)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Page Title</h1>
        <p className="text-sm text-muted-foreground">Page subtitle.</p>
      </div>
      {/* content */}
    </div>
  )
}
```

### Empty State Pattern
```tsx
<div className="flex flex-col items-center justify-center py-16 text-center">
  <p className="text-muted-foreground text-sm">Nothing here yet.</p>
  <a href="/link" className="mt-2 text-sm text-primary underline">Action</a>
</div>
```

### New API Route (protected)
<<<<<<< HEAD
=======
  // queries here with .eq("user_id", user.id)

  return <div>...</div>
}
```

### New API route
>>>>>>> 7e1a8af916b56410048e0bfccadd90f00d881991
```typescript
import { requireUser } from "@/lib/supabase/require-user"
import { NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
  try {
    const { user, supabase } = await requireUser()
    const body = await req.json()
    // logic here
    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
  }
}
```

---

## 15. Sidebar Routes — Current State

| Route | Status | File |
|---|---|---|
<<<<<<< HEAD
| `/dashboard` | ✅ Working | `app/(dashboard)/dashboard/page.tsx` |
| `/coach` | ✅ Working | `app/(dashboard)/coach/page.tsx` |
| `/jobs` | ✅ Working | `app/(dashboard)/jobs/page.tsx` |
| `/jobs/new` | ✅ Working | `app/(dashboard)/jobs/new/page.tsx` |
| `/jobs/[id]` | ✅ Working | `app/(dashboard)/jobs/[id]/page.tsx` |
| `/jobs/[id]/documents` | ✅ Working | `app/(dashboard)/jobs/[id]/documents/page.tsx` |
| `/jobs/[id]/evidence-match` | ✅ Working | `app/(dashboard)/jobs/[id]/evidence-match/page.tsx` |
| `/evidence` | ✅ Working | `app/(dashboard)/evidence/page.tsx` — display name: "Career Context" |
| `/ready-queue` | ✅ Working | `app/(dashboard)/ready-queue/page.tsx` |
| `/applications` | ✅ Working | `app/(dashboard)/applications/page.tsx` |
| `/documents` | ✅ Working | `app/(dashboard)/documents/page.tsx` |
| `/analytics` | ✅ Working | `app/(dashboard)/analytics/page.tsx` |
| `/logs` | ✅ Working | `app/(dashboard)/logs/page.tsx` |
| `/settings` | ✅ Working | `app/(dashboard)/settings/page.tsx` |
| `/profile` | ✅ Working | `app/(dashboard)/profile/page.tsx` |
| `/billing` | ✅ Working | `app/(dashboard)/billing/page.tsx` |
=======
| `/dashboard` | Working | `app/(dashboard)/dashboard/page.tsx` |
| `/coach` | Working | `app/(dashboard)/coach/page.tsx` |
| `/jobs` | Working | `app/(dashboard)/jobs/page.tsx` |
| `/jobs/new` | Working | `app/(dashboard)/jobs/new/page.tsx` |
| `/jobs/[id]` | Working | `app/(dashboard)/jobs/[id]/page.tsx` |
| `/jobs/[id]/documents` | Working | `app/(dashboard)/jobs/[id]/documents/page.tsx` |
| `/jobs/[id]/evidence-match` | Working | `app/(dashboard)/jobs/[id]/evidence-match/page.tsx` |
| `/evidence` | Working | `app/(dashboard)/evidence/page.tsx` — display name: "Career Context" |
| `/ready-queue` | Working | `app/(dashboard)/ready-queue/page.tsx` |
| `/applications` | Working | `app/(dashboard)/applications/page.tsx` |
| `/documents` | Working | `app/(dashboard)/documents/page.tsx` |
| `/analytics` | Working | `app/(dashboard)/analytics/page.tsx` |
| `/logs` | Working | `app/(dashboard)/logs/page.tsx` |
| `/settings` | Working | `app/(dashboard)/settings/page.tsx` |
| `/profile` | Working | `app/(dashboard)/profile/page.tsx` |
| `/billing` | Working | `app/(dashboard)/billing/page.tsx` |
>>>>>>> 7e1a8af916b56410048e0bfccadd90f00d881991

**Score and gap data flow:**
- After `/api/analyze`: scores → `job_scores` table, gaps → `job_analyses.known_gaps`
- After `/api/generate-documents`: scores → `jobs.score` + `jobs.fit`, gaps → `jobs.score_gaps`
- `jobs/[id]/page.tsx` reads `job_scores.overall_score` first, falls back to `jobs.score`

---

## 16. Career Context Page — Spec (formerly "Evidence Library")

### Rename
- Page title: **Career Context**
- Sidebar label: **Career Context**
- Route: `/evidence` (keep route, change display name only)
- DB table: `evidence_library` (unchanged)

### Overview Summary Card — Computed on Page Load
All values derived from `evidence_library` rows. Zero new tables required.

| Metric | Source |
|---|---|
| Total items | `COUNT(*)` from evidence_library |
| Years experience | Earliest work_experience `date_range` start to today |
| Top industries | Aggregate `industries[]` arrays, rank by frequency |
| Top skills | Aggregate `tools_used[]` arrays, rank by frequency |
| Profile Strength % | Formula below |
| ATS Readiness band | `approved_keywords` count mapped to Strong/Medium/Weak |

**Profile Strength formula (computed, not stored):**
```
(work_experience rows with outcomes filled) × 0.30
+ (skills count > 5) × 0.20
+ (certifications count > 0) × 0.15
+ (education rows present) × 0.15
+ (is_user_approved rate) × 0.20
```

<<<<<<< HEAD
### Core vs Extended Memory Split
- **Core:** `confidence_score >= 0.8` AND (appears in any `jobs.evidence_map`) → proven generation signal
- **Extended:** everything else
- **Override:** `is_user_approved = true` manually promotes any item to Core
- Computed from existing columns — zero schema changes needed

### Duplicate Detection
- Trigger: immediately after LinkedIn PDF or resume import completes
- Mechanism: compare incoming items against existing `evidence_library` rows on `(source_title, source_type, company_name)` similarity
- UX: one-time deduplication review modal before items enter the library
- Logic lives in: `lib/duplicate-detection.ts` (already exists — wire to upload flow)
- After user confirms once: auto-merge is acceptable

### Tab Taxonomy (replaces All/Work Experience/Education/Skill/Certification)
| New Tab | Maps to source_type |
|---|---|
| Experience | work_experience |
| Skills | skill |
| Projects | project, shipped_product, portfolio_entry |
| Education & Learning | education |
| Certifications | certification |
| Achievements | achievement |
| Documents | source_resumes (uploaded files) |

### Visual Direction
- Cards not flat rows
- Company-grouped sections under Experience tab
- Collapsible accordions per company
- Confidence indicator on each item (High/Medium/Low badge)
- Source file visible on each item
- Actions per item: Pin to Core, Hide, Edit, Use in resume
- No flat dumps — progressive disclosure throughout

=======
>>>>>>> 7e1a8af916b56410048e0bfccadd90f00d881991
---

## 17. Autonomous Audible Rules

These rules tell Claude Code what to do when it hits an ambiguous situation during `--dangerously-skip-permissions` sessions. No stopping to ask — follow these.

### Page Creation
- If sidebar links to a route and no `page.tsx` exists → create it using the RSC pattern from Section 14
- If a page shows zeros or empty state on first load → always include a meaningful empty state with a CTA, never show raw zeros
- If creating a list page → always include grouping, empty state, and a "no items" message

### Schema Ambiguity
- If a column name is ambiguous → check Section 8 of this file first, then query Supabase schema, never guess
- If a column doesn't exist and the code references it → fix the reference to match the real column, do not add a new column
- If unsure whether a table exists → check `scripts/` migration files before assuming

### Component Reuse
- If a UI pattern already exists in another page → reuse it, don't create a parallel version
- If shadcn/ui has a component for it → use it, don't build from scratch
- If a new component is needed → put it in `components/` not inline in the page

### API Routes
- If an API route already exists for the operation → use it, don't create a duplicate
- If creating a new route → always include `requireUser()` auth guard and `user_id` filter on all queries
- Never create a second quality-pass route

### AI Generation
- Always use `CLAUDE_MODELS.*` constants, never raw model strings
- Always use `generateText + Output.object()`, never `generateObject()`
- Never import from Groq

### Evidence and Truth
- Never let AI generate content that isn't grounded in evidence_library rows
- If `is_user_approved = false` on an evidence item → do not use it in generation without surfacing the flag
- If `confidence_score < 0.5` → flag it visually, do not silently use it

### Styling
- Use Tailwind utility classes only — no inline styles
- Use `cn()` from `lib/utils.ts` for conditional classes
- Follow the existing visual language: soft, modern, operational — not enterprise grid/table heavy
- Use `text-muted-foreground` for secondary text, `text-foreground` for primary

### When Something Would Break the Spine
<<<<<<< HEAD
The generation spine must stay unbroken:
`Generate → Review → Approve → Ready to Apply → Apply`
=======
The generation spine must stay unbroken: `Generate → Review → Approve → Ready to Apply → Apply`
>>>>>>> 7e1a8af916b56410048e0bfccadd90f00d881991

If a change would break any link in this chain → stop and log a comment explaining why, then skip that change and continue with everything else.

### v0 Drift Prevention
- If a file exists in v0 preview but NOT in local repo → note it in a comment at the top of any file that depends on it
- Never assume a page is "built" without confirming the file exists locally
- The local repo is the source of truth, not v0's preview

---

## 18. Career OS North Star — Build Trajectory Context

Every decision should compound toward this:

**By week 3-4 of a user's first month, HireWire should:**
- Know what resume structures convert for this specific user
- Know which industries respond to their positioning
- Know which evidence has been selected in real generations
- Surface "your callback rate increased after changing positioning" — not "you applied to 57 jobs"
- Feel like a calm professional operating system, not a desperate job board dashboard

**What this means for every build decision:**
- Prefer event-driven over static — every action should leave a traceable record
- Prefer computed intelligence over stored vanity metrics
- Prefer progressive disclosure over data dumps
- Prefer outcome-weighted signals over volume signals
- Any analytics, coaching, or insight feature should answer: "what should I do next?" — not just "here's what happened"

**The UI should feel:** premium, intelligent, operational, emotionally stabilizing
**The UI should NOT feel:** flat, administrative, dashboard-heavy, enterprise ugly

---

## 19. Never Do These

| Action | Why It Breaks |
|---|---|
| Import from `@ai-sdk/groq` | Groq removed — breaks imports |
| Use `generateObject()` | Does not exist in AI SDK v6 |
| Read from `generated_documents` table | Always empty — nulls downstream content |
| Override `jobs.generated_resume` with null | Breaks entire review spine |
| Write `status: "ready"` to gate quality | Readiness is derived, not written |
| Create a second quality-pass route | Duplicate with conflicting logic |
| Call `.map()` on JSONB without `Array.isArray()` guard | Crashes on `{}` return |
| Use `data.links \|\| []` for JSONB arrays | `{}` is truthy — `.map()` still crashes |
| Add plan values not in `lib/contracts/hirewire.ts` | DB constraint violation |
| Query without `user_id` filter | Tenant isolation failure |
| Query jobs without `deleted_at IS NULL` | Returns soft-deleted records |
| Inline auth check instead of `requireUser()` | Inconsistent auth enforcement |
| Assume v0 preview = local repo | They drift — always verify locally |
| Build charts before events exist | Events are more important than charts |
| Reward application volume | HireWire rewards truth-weighted momentum, not spam |

---

## 20. Before Any Code Change — Reality Check

- [ ] Reading document content from `jobs.generated_resume` (not `generated_documents`)?
- [ ] `Array.isArray()` guards on every JSONB column being mapped?
- [ ] Using `generateText + Output.object()` — NOT `generateObject()`?
- [ ] `user_id` AND `deleted_at` filters on every jobs query?
- [ ] Using `CLAUDE_MODELS.*` — not a raw model string?
- [ ] No Groq reference?
- [ ] Readiness computed by `lib/readiness.ts` — not inline?
- [ ] Column names match Section 8 mapping?
- [ ] Does this file already exist locally before I reference it?

---

## 21. Source of Truth Links

- Notion main: https://www.notion.so/3448b52899a4814eba79c8355b98547a
- Decision Log: https://www.notion.so/34a8b52899a4818bbd88c84c03bc7f01
- Supabase project: `endovljmaudnxdzdapmf`
- Local repo: `~/Desktop/HireWireInGroup`
- v0 project: https://v0.app/chat/hirewire2-9xhFGPed9mT

---

*This is the constitution. It is read before every session. When in doubt, this wins.*
<<<<<<< HEAD
=======
export async function POST(request: NextRequest) {
  const { user, supabase } = await requireUser()
  // ...
}
```

---

## SIDEBAR ROUTES — ALL 13 PAGES

These all exist under `app/(dashboard)/`:

| Route | Folder |
|---|---|
| `/dashboard` | `dashboard/` |
| `/coach` | `coach/` |
| `/jobs` | `jobs/` |
| `/jobs/new` | `jobs/new/` |
| `/jobs/[id]` | `jobs/[id]/` |
| `/ready-queue` | `ready-queue/` |
| `/applications` | `applications/` |
| `/documents` | `documents/` |
| `/evidence` | `evidence/` ← Career Context |
| `/analytics` | `analytics/` |
| `/logs` | `logs/` |
| `/profile` | `profile/` |
| `/billing` | `billing/` |
| `/settings` | `settings/` |

---

## AUTONOMOUS AUDIBLE RULES

When something unexpected happens, do not stop and ask. Use these rules:

**Page doesn't exist but sidebar links to it:**
Create it using the RSC page pattern above. Basic functional page.
Do not create placeholder "coming soon" pages — always query real data.

**Column name is ambiguous:**
Check section "COLUMN NAME MAP" in this file first.
Then read the actual table definition via Supabase MCP.
Never guess a column name.

**JSONB key doesn't exist:**
Check what the generation route actually writes before assuming key names.
Read `app/api/generate-documents/route.ts` to confirm structure.
Use optional chaining and Array.isArray() guards always.

**Merge conflict on a component:**
Take the v0/incoming version (`git checkout --theirs`) for UI components.
Take the local version for API routes and lib files unless the conflict is a bug fix.

**v0 says something shipped but file doesn't exist locally:**
Do not trust the v0 description. Check `ls app/(dashboard)/` and component directories.
If missing, build it fresh using the spec in this file.

**Test fails due to missing env var:**
Log the missing var name. Do not add fake values. Note it in a comment.
Do not block the build over missing Stripe vars in dev.

**Quality check fails on generation:**
Auto-retry once (already implemented in generate-documents route).
Do not lower quality thresholds. Do not skip the check.

**New evidence tab/feature needs a source_type not in the DB enum:**
Check the actual CHECK constraint on `evidence_library.source_type` before adding.
Do not invent new source_type values without a migration.

---

## V0 ↔ LOCAL SYNC — REQUIRED PROTOCOL

v0 builds in a cloud sandbox. Local repo is the source of truth for deployment.
After any v0 session, sync before building further:

```bash
cd ~/Desktop/HireWireInGroup
git fetch --all
git merge origin/v0/rsemeah-[BRANCH_HASH] --no-edit
# If conflict on UI components: git checkout --theirs [file] && git add [file]
# If conflict on API/lib files: resolve manually, keep correct logic
git commit -m "merge: v0 sync"
```

Never assume v0 output landed locally. Always verify with `ls app/(dashboard)/`.

---

## CAREER OS NORTH STAR

HireWire is being built toward a longitudinal Career Operating System.
Every architectural decision should compound toward this:

- **Week 1-2:** Foundation works — no 404s, core flow complete
- **Week 3-4:** Outcome loop closes — application confirmation, state machine, aging
- **Week 5-8:** Intelligence activates — resume_provenance drives Core evidence, analytics shows real signal, coach uses longitudinal memory

When making a local decision, ask: does this compound toward the intelligence layer?

The intelligence loop requires:
1. Outcome data (application confirmation, state transitions)
2. Evidence provenance (resume_provenance tracked per generation)
3. Pattern detection (user_intelligence computed from jobs × evidence)

Never build features that bypass this loop. Never store fake data to make metrics look good.
Never celebrate application volume — only outcome quality matters.

---

## NEVER DO THESE

| Action | Why |
|---|---|
| Import from `@ai-sdk/groq` | Groq removed |
| Use `generateObject()` | Doesn't exist in AI SDK v6 |
| Read from `generated_documents` | Always empty |
| Override `jobs.generated_resume` with null | Breaks review spine |
| Call `.map()` on JSONB without `Array.isArray()` | Crashes on `{}` |
| Use `data.column \|\| []` for JSONB arrays | `{}` is truthy, still crashes |
| Add billing plan values not in `lib/contracts/hirewire.ts` | DB constraint violation |
| Query without `user_id` filter | Tenant isolation failure |
| Query jobs without `deleted_at IS NULL` | Returns soft-deleted records |
| Assume `jobs.evidence_map` has `selected_evidence_ids` | It doesn't |
| Build a second quality-pass route | Duplicate with conflicting logic |
| Write `status: "ready"` to gate quality approval | Readiness is derived |
| Compute readiness inline in a page | Must use `lib/readiness.ts` |
| Trust v0 "shipped" description without verifying local files | Always verify |
| Build the Career OS intelligence layer before outcome data exists | Events first, charts second |

---

## REALITY CHECK BEFORE ANY CHANGE

- [ ] Reading document content from `jobs.generated_resume` (not `generated_documents`)?
- [ ] `Array.isArray()` guards on every JSONB column being mapped?
- [ ] Using `generateText + Output.object()` not `generateObject()`?
- [ ] `user_id` AND `deleted_at` filters on every jobs query?
- [ ] Using `CLAUDE_MODELS.SONNET/OPUS/HAIKU` not a raw model string?
- [ ] No Groq reference?
- [ ] Readiness computed by `lib/readiness.ts` not inline?
- [ ] Column names verified against COLUMN NAME MAP above?
- [ ] JSONB keys verified against actual route source before assuming?
- [ ] v0 files verified locally before building on top of them?

---

*This file is the constitution. When in doubt, this wins.*
*Rory's build philosophy: correctness before elegance, truth before speed, spine unbroken.*
>>>>>>> 7e1a8af916b56410048e0bfccadd90f00d881991
