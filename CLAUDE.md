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
import { generateText, Output } from "ai"
import { CLAUDE_MODELS } from "@/lib/adapters/anthropic"

const result = await generateText({
  model: CLAUDE_MODELS.SONNET,  // primary generation
  // CLAUDE_MODELS.OPUS          // complex reasoning only
  // CLAUDE_MODELS.HAIKU         // fast/lightweight tasks
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
import { requirePaidUser } from "@/lib/supabase/require-user"
const { user, supabase } = await requirePaidUser()
```

Do NOT implement custom auth checks inline in routes or pages. New dashboard RSC pages that don't use requireUser must use this pattern instead:

```typescript
const supabase = await createClient()
const { data: { user } } = await supabase.auth.getUser()
if (!user) redirect('/login')
```

---

## 6. Tenant Isolation — Mandatory on Every Query

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

Columns always requiring `Array.isArray()` guards: `user_profile.links`, `user_profile.education`, `user_profile.experience`, `evidence_library.tools_used`, `evidence_library.industries`, `evidence_library.outcomes`, any JSONB column expected to be an array.

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

No page, component, or API route may compute its own readiness logic. Do NOT write `status: "ready"` directly — status is derived from artifacts.

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
The generation spine must stay unbroken: `Generate → Review → Approve → Ready to Apply → Apply`

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
