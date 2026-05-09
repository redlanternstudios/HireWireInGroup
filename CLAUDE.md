# HIREWIRE — CLAUDE.md
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
| UI | shadcn/ui + Tailwind |

---

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
import { generateText, Output } from "ai"
import { CLAUDE_MODELS } from "@/lib/adapters/anthropic"

const result = await generateText({
  model: CLAUDE_MODELS.SONNET,   // primary generation
  // CLAUDE_MODELS.OPUS           // complex reasoning only
  // CLAUDE_MODELS.HAIKU          // fast/cheap tasks only
  output: Output.object({ schema: MyZodSchema }),
  prompt: "...",
})
const data = result.experimental_output
```

Never use raw model strings. Never use `generateObject()`. Never import Groq.

---

## AUTH PATTERN — MANDATORY

```typescript
// All protected routes and server actions
import { requireUser } from "@/lib/supabase/require-user"
const { user, supabase } = await requireUser()

// Paid-only routes
import { requirePaidUser } from "@/lib/supabase/require-user"
const { user, supabase } = await requirePaidUser()
```

Never implement custom auth checks inline. Always use `requireUser()`.

---

## TENANT ISOLATION — MANDATORY ON EVERY QUERY

Every query touching user data must include BOTH filters:

```typescript
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
export const dynamic = "force-dynamic"
export const revalidate = 0

export default async function PageName() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  // queries here with .eq("user_id", user.id)

  return <div>...</div>
}
```

### New API route
```typescript
import { requireUser } from "@/lib/supabase/require-user"
import { NextRequest, NextResponse } from "next/server"

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
