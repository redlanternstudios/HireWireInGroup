# HireWire — Copilot / AI Coding Instructions

This is the canonical prompt file for GitHub Copilot, Cursor, and any AI coding
assistant working in this repository. Read this fully before generating any code.

---

## What HireWire Is

HireWire is a truth-based job application intelligence platform. It turns real
user experience (stored as `evidence_library` records) into evidence-grounded
application packages (resume + cover letter) for specific job postings.

The core product promise: every word in a generated document is traceable to
real, user-approved evidence. No hallucination. No inflation. No fabrication.

---

## Tech Stack

| Layer | Tech |
|---|---|
| Framework | Next.js 16 App Router (TypeScript) |
| Database | Supabase (Postgres) |
| Auth | Supabase Auth |
| Styling | Tailwind CSS v4 |
| Components | shadcn/ui + custom `hw-*` design system |
| AI | Vercel AI SDK v6 (via AI Gateway) |
| Storage | Vercel Blob |
| Payments | Stripe |

---

## Project Structure

```
app/
  page.tsx         — public splash / marketing page (unauthenticated)
  (auth)/          — login, signup
  (dashboard)/     — all authenticated pages
    dashboard/     — Command Center (home)
    jobs/          — job list (All Jobs hub)
    jobs/[id]/     — job detail + workflow
    jobs/[id]/evidence-match/
    jobs/[id]/documents/
    coach/         — AI coaching chat
    evidence/      — evidence library CRUD
    analytics/     — pipeline analytics
    ready-to-apply/ — canonical apply gate
    ready-queue/   — compatibility redirect to Ready to Apply
  api/             — all API route handlers
    analyze/       — analyze a job by URL
    re-analyze/    — re-analyze an existing job by job_id
    generate-documents/ — resume + cover letter generation
    coach/         — coaching chat stream
lib/
  types.ts         — canonical Job, EvidenceRecord, UserProfile types
  readiness/evaluator.ts — readiness authority (SINGLE SOURCE OF TRUTH)
  readiness.ts     — DB-backed readiness helpers that delegate to evaluator
  job-workflow.ts  — visual progress helper only; never gates actions
  analyze/         — job analysis core logic
  coach/           — governance layer (types, validator, drift-scorer, renderer)
  jobs/            — display-stage, priority, staleness helpers
  ai/prompts/      — all AI system prompts
  safety/          — content moderator, PII detector, injection detector
  queries/jobs.ts  — Supabase query helpers
  actions/jobs.ts  — server actions for job mutations
docs/
  COACH_CONSTITUTION.md  — immutable generation governance rules
  GENERATION_STRATEGY.md — strategy decision tree
  TRUTH_AND_CLAIM_SAFETY_VALIDATION.md
components/
  jobs/jobs-pipeline-client.tsx — All Jobs page client component
```

---

## The Workflow Pipeline (NEVER bypass this)

Jobs move through exactly these stages in order:

```
job_ingested → job_parsed → evidence_mapped → fit_scored → materials_generated → ready → applied
```

### Readiness authority rules

`lib/readiness/evaluator.ts::evaluateReadiness()` is the **only** pure function
that may determine whether a job is ready, blocked, applyable, or next-action
eligible. No component, page, action, or API route may compute readiness locally.

`lib/readiness.ts::evaluateJobReadiness()` is the DB-backed helper for per-job
readiness. It must delegate readiness truth to `evaluateReadiness()`.

`lib/job-workflow.ts` may be used for visual progress only. It must never gate
generate/apply actions or override readiness.

### What makes each stage true

| Stage | Gate condition (all must be true) |
|---|---|
| `job_ingested` | Default — job row exists |
| `job_parsed` | `job.qualifications_required.length > 0` OR `job.responsibilities.length > 0` |
| `evidence_mapped` | `job.evidence_map` has requirement keys AND `matching_complete = true` |
| `fit_scored` | `job.score !== null` |
| `materials_generated` | `job.generated_resume && job.generated_cover_letter` |
| `ready` | materials generated AND `job.quality_passed === true` |
| `applied` | `job.applied_at !== null` OR `job.status === "applied"` |

### Critical: `job_description` is NOT an analysis gate signal

`job.job_description` is raw scraped text — it proves the page was fetched, not
that requirements were extracted. `hasJobAnalysis()` must only check
`qualifications_required` and `responsibilities`.

---

## Database Backfill Rule

When `analyzeJobCore` completes, it MUST write `qualifications_required`,
`responsibilities`, `score`, `fit`, `score_gaps`, `score_strengths` back to the
`jobs` row (not only to `job_analyses`). This is required because workflow
functions read from the `jobs` row directly for performance.

If you add a new analysis step that produces data needed by workflow gates, you
MUST backfill the result to the `jobs` row.

---

## Coach Governance — Hard Rules (see docs/COACH_CONSTITUTION.md)

These are enforced in `lib/coach/claim-validator.ts` and `lib/coach/drift-scorer.ts`.
They are NOT style guidelines — violating them causes a 400 block.

1. **Evidence Primacy**: Every bullet must cite a real `evidence_library` row.
2. **Metric Non-Inflation**: Numbers may not exceed 2× the largest figure in the cited evidence.
3. **Scope Non-Expansion**: Role scope may not exceed `evidence.what_not_to_overstate`.
4. **Drift Gate**: `drift.score >= 40` blocks generation regardless of other checks.
5. **Strategy Gate**: `strategy = "do_not_generate"` (coverage < 25%) = no documents, no DB write.

### Strategy tiers

| Coverage | Evidence Quality | Strategy |
|---|---|---|
| ≥80% | ≥70% | `full_match` |
| ≥65% | any | `strong_match` |
| 40–64% | any | `partial_match` |
| 25–39% | any | `honest_stretch` |
| <25% | any | `do_not_generate` |

### Banned phrases (never generate these)

results-driven, dynamic professional, seasoned leader, proven track record,
team player, spearheaded, passionate about, self-starter, go-getter, synergize,
leverage (as verb), best-in-class, thought leader, move the needle, circle back,
hard-working, detail-oriented, out-of-the-box, game changer.

---

## UI / Design System

### Layout classes (use these, do not re-invent)

```css
.hw-page          — main page wrapper (px-6 py-8, max-w-1200, centered)
.hw-workspace     — two-column flex layout (main + rail)
.hw-workspace-main — flex-1 main column
.hw-workspace-rail — shrink-0 272px right rail
.hw-card          — white card surface with shadow
.hw-panel         — panel/rail background
.hw-btn-primary   — red primary button with shadow
.hw-stat          — metric display card
.hw-stat-value    — large tabular-nums number
.hw-stat-label    — small uppercase label
.hw-section-label — 11px uppercase tracking-widest label
.hw-empty         — centered empty state with dashed border
.hw-next-action   — red left-border next action banner card
```

### Status badge classes

```css
.status-draft      — stone
.status-analyzing  — amber
.status-ready      — emerald
.status-applied    — blue
.status-offered    — violet
.status-rejected   — rose
```

### Design tokens (globals.css)

- Primary: `hsl(var(--primary))` = Supreme Red `#BD0A0A`
- Background: warm off-white `#ede9e3`
- Card: near-white `#faf9f7`
- Muted: `hsl(var(--muted))`
- Font: Inter (sans), Playfair Display (serif), JetBrains Mono (mono)
- Use `--radius-lg` for cards, `--radius-md` for buttons, `--radius-sm` for badges

### Spacing rules

- Tailwind spacing scale only — no arbitrary `p-[16px]` values
- Section gaps: `space-y-3` or `space-y-4` inside pages
- Card interiors: `px-4 py-3` for dense, `px-5 py-4` for normal
- Section labels always use `hw-section-label` class with `mb-2`
- No `space-*` classes for gap — use `gap-*` only

---

## API Route Conventions

All API routes in `app/api/` follow this pattern:

```ts
export async function POST(request: Request) {
  // 1. Auth check — always first
  const { user, error } = await requireUser()
  if (error || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  // 2. Input validation (Zod)
  const body = await request.json()
  const parsed = SomeSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  // 3. Supabase operation with user_id isolation
  const supabase = await createClient()
  // Always .eq("user_id", user.id) — never skip tenant isolation

  // 4. Response
  return NextResponse.json({ success: true, data: result })
}
```

### Tenant isolation rule

Every Supabase query MUST include `.eq("user_id", userId)`. No exceptions.
Never query across users. RLS is configured but defense-in-depth requires
the application layer to also scope by user.

---

## Server vs Client Components

- Pages in `app/(dashboard)/` are **Server Components** by default — they fetch data and pass it to client components.
- Interactive components (buttons with state, tabs, modals) are `"use client"` components in `components/` or co-located as `ComponentName.tsx` beside the page.
- **Never** use `useEffect` for data fetching. Use SWR for client-side sync or pass server-fetched data as props.
- Server components may import client components. Client components may NOT import server-only modules.

---

## Data Fetching Pattern

```tsx
// page.tsx (Server Component)
export default async function JobDetailPage({ params }) {
  const { id } = await params  // Next.js 16: params must be awaited
  const { user } = await requireUser()
  const supabase = await createClient()

  const { data: job } = await supabase
    .from("jobs")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .single()

  return <JobDetailClient job={job} />
}

// JobDetailClient.tsx ("use client")
"use client"
export function JobDetailClient({ job }: { job: Job }) {
  // Interactive UI here
}
```

---

## Key Type: `Job`

The `Job` interface is in `lib/types.ts`. Key fields:

```ts
interface Job {
  id: string
  title: string        // DB: role_title — normalized by getJobById
  company: string      // DB: company_name — normalized by getJobById
  job_url: string | null
  status: JobStatus
  fit: "HIGH" | "MEDIUM" | "LOW" | null
  score: number | null
  qualifications_required: string[] | null
  responsibilities: string[] | null
  score_gaps: string[] | null
  score_strengths: string[] | null
  generated_resume: string | null
  generated_cover_letter: string | null
  quality_passed: boolean | undefined
  evidence_map: Record<string, unknown> | null
  job_description: string | null  // raw scraped text — NOT an analysis signal
}
```

Column name mapping (DB → TypeScript):
- `role_title` in DB → `title` in `Job` (normalized in `queries/jobs.ts`)
- `company_name` in DB → `company` in `Job`
- Always use `job.title` / `job.company` in UI. Never `job.role_title`.

---

## Evidence Library

`EvidenceRecord` in `lib/types.ts`. Key fields for generation:

```ts
interface EvidenceRecord {
  id: string
  source_title: string
  source_type: "work_experience" | "project" | ...
  outcomes: string[]                    // real outcomes — may appear in bullets
  tools_used: string[]
  approved_achievement_bullets: string[] // pre-approved bullets — prefer these
  what_not_to_overstate: string | null   // USER constraint — must be honored
  confidence_level: "high" | "medium" | "low"
  is_user_approved: boolean
  team_size: number | null               // must not be exceeded >50% in bullets
  budget_scope: string | null
}
```

Only `is_user_approved = true` records may be used as primary evidence.
Only `confidence_level = "high"` records may support metric claims.

---

## Naming Conventions

| Pattern | Convention |
|---|---|
| Page files | `page.tsx` (Next.js convention) |
| Client components | `PascalCase.tsx` co-located with page OR in `components/` |
| API routes | `app/api/[kebab-case]/route.ts` |
| Lib modules | `kebab-case.ts` |
| Server actions | `lib/actions/[domain].ts`, exported as `async function verbNoun()` |
| Zod schemas | `lib/schemas/[domain].ts`, exported as `PascalCaseSchema` |
| Types | `lib/types.ts` for domain types, inline for component-local types |

---

## Error Handling

```ts
// API routes: always return structured errors
return NextResponse.json(
  { error: "Specific message", details: optionalContext },
  { status: 400 | 401 | 403 | 404 | 500 }
)

// Supabase: always check error before using data
const { data, error } = await supabase.from("jobs").select("*")...
if (error) {
  console.error("[HireWire] jobs query error:", error)
  return NextResponse.json({ error: "Failed to load jobs" }, { status: 500 })
}
```

Never silently swallow Supabase errors. Always log with `console.error("[HireWire] ...")`.

---

## Logo Rendering Rules

The HireWire logo lives at `/brand/hirewire-logo.png` and is rendered via
`components/hirewire-logo.tsx` (`HireWireLogo`) or the inline `Logo` helper in
`app/page.tsx`.

Rules that must NEVER be broken:

1. **Always use `style={{ width: Npx, height: "auto" }}`** — never set both `width` and `height` as fixed px values or the image will compress.
2. **Pass `width` and `height` props to `<Image>` for layout reservation only** (prevents CLS). The CSS `height: auto` overrides the rendered height.
3. **Desktop navbar logo width: 230px. Mobile: 160px.**
4. **Never add `max-height` to the logo container** — it will crop or compress the logo.
5. **Navbar height: 84px desktop, horizontal padding: 48px desktop / 20px mobile.**
6. **The logo glow treatment is `drop-shadow(0 0 18px rgba(216, 0, 0, 0.08))`** — ultra subtle. Never increase opacity above 12%.

---

## Things You Must Never Do

1. **Never compute readiness locally.** Always use `evaluateReadiness()` or the DB-backed readiness helper.
2. **Never use `job.job_description` as an analysis gate.** It is raw scraped text, not an analysis result.
3. **Never query without `.eq("user_id", userId)`.** Every query must be tenant-scoped.
4. **Never write `qualifications_required` or `responsibilities` only to `job_analyses`** — always backfill the `jobs` row too.
5. **Never generate documents without checking readiness through the canonical evaluator/helper.**
6. **Never use `localStorage` for persistence.** All state lives in Supabase.
7. **Never use `useEffect` for data fetching.** Use RSC data flow or SWR.
8. **Never `@apply` a custom class inside another custom class in globals.css** (Tailwind v4 restriction — only real utility classes in `@apply`).
9. **Never add banned phrases to generated documents** (see COACH_CONSTITUTION.md list).
10. **Never skip the governance check** in `app/api/generate-documents/route.ts` — `validateAllClaims()` and `scoreDrift()` must run on every generation.

---

## Things You Must Always Do

1. Use `requireUser()` from `lib/supabase/require-user.ts` at the top of every API route.
2. Await `params` and `searchParams` in Server Components (Next.js 16).
3. Add `"use client"` to any component that uses hooks, browser APIs, or event handlers.
4. Use `hw-*` design system classes instead of re-implementing card/button/layout styles.
5. Use `getWorkflowState()` only for visual workflow progress.
6. Use `evaluateReadiness()` or `evaluateJobReadiness()` for any UI that gates actions (generate, apply, next action, etc.).
7. Import types from `lib/types.ts` — do not define local duplicates of `Job` or `EvidenceRecord`.
8. Use semantic Tailwind tokens (`bg-background`, `text-foreground`, `text-muted-foreground`) — never hardcoded colors.
9. Use `gap-*` for spacing between elements — never `space-x-*` / `space-y-*`.
10. After any job analysis completes, call the `jobs` row backfill update (see `analyzeJobCore.ts`).
