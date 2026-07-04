# SYNC SITUATION — What's Out of Date and Why

## The Core Problem

Your **local machine** (`main` branch, commit `03f2b0b`) is **~80 commits behind** `origin/main`
(commit `591ddd3`). You did heavy UI redesign inside v0.app, those changes got merged into
`origin/main` via PRs #79 and #80, but you never pulled them down locally.

Everything you showed me in the screenshots — the Command Center dashboard, Career Context /
Proof Vault, Pipeline Intelligence sidebar, coach with live stats, Integrity section — that all
exists on `origin/main`. It does NOT exist on the code sitting on your Desktop right now.

---

## Exact Gap: Numbers

| What | State |
|---|---|
| Local HEAD | `03f2b0b` (May 10, "add CLAUDE.md") |
| origin/main HEAD | `591ddd3` (May 13, "merge PR #80") |
| Newest v0 branch | `origin/v0/rsemeah-2362fb4c` (May 13, "fix: clear stale cache") |
| Files changed between local and origin/main | **215 files** |
| Lines added/removed | **+18,701 / -1,570** |

This is a significant gap. The audit I ran described the old code on your machine.
The screenshots you showed me are the current `origin/main`. Two different states.

---

## What's on origin/main That Isn't Local

### New Pages (don't exist locally at all)
- `app/(dashboard)/career-context/` — The "Proof Vault" page with tabs by category,
  profile strength score, ATS readiness indicator, 37 proof points organized view
- `app/(dashboard)/integrity/` — Full integrity section with sub-pages:
  - `/integrity` — Overview
  - `/integrity/ai-content` — AI content detection
  - `/integrity/consistency` — Consistency checker
  - `/integrity/gap` — Gap analyzer
  - `/integrity/verification` — Verification simulator
  - `/integrity/history` — History view
- `app/(dashboard)/jobs/[id]/evidence-match/` — The evidence-match page that the
  `matching_complete` gate references (this fixes Priority Fix #1 from the audit!)
- `app/api/stripe/portal/` — The Stripe billing portal route (fixes Priority Fix #7)
- `app/api/re-analyze/` — Re-analyze a job
- `app/api/integrity/*` — All integrity API routes
- `app/api/evidence/export/` and `app/api/evidence/import/`

### Rebuilt Pages (exist locally but completely rewritten)
- `app/(dashboard)/dashboard/page.tsx` — Now has Command Center with greeting,
  "Your Next Move" card, Today's Queue tiles, Pipeline Overview stats, Recent Pipeline
  with Apply buttons, Pipeline Intelligence sidebar, Quick Actions, Momentum tracker
- `app/(dashboard)/jobs/page.tsx` — Now uses `JobsPipelineClient` with tab filters
  (Active/Needs Action/Ready/Applied/Closed/Archived), sub-filters, Pipeline Intelligence
- `app/(dashboard)/analytics/page.tsx` — Now shows 52% avg fit score correctly
  (fixed the `overall_score` column issue)
- `app/(dashboard)/ready-queue/page.tsx` — Now has Readiness Rules checklist sidebar,
  Next Best Action card
- `app/(dashboard)/logs/page.tsx` — Now has 4 stat cards and "What Gets Logged" sidebar
- `app/(dashboard)/coach/page.tsx` — Now has coach context sidebar with live pipeline
  counts, categorized quick prompts (Pipeline / Resume & Package / Career Context /
  Interview & Follow Up), Next Best Actions panel
- `app/(dashboard)/evidence/page.tsx` — Now is "Career Context" branded as Proof Vault
- `app/(dashboard)/billing/page.tsx` — Now has `ManageBillingButton` component

### New Components
- `components/coach/` — Full coach component system:
  - `EmbeddedCoachCard.tsx`
  - `WorkflowCoachPanel.tsx` + `WorkflowCoachPanelClient.tsx`
  - `CoachBlocker.tsx`, `CoachInsight.tsx`, `CoachMomentum.tsx`, `CoachRecommendation.tsx`
- `components/error/` — Proper error components:
  - `empty-with-action.tsx`, `error-card.tsx`, `form-error.tsx`
  - `inline-error.tsx`, `retry-panel.tsx`
- `components/integrity/ResumeIntegrityFlags.tsx`
- `components/jobs/jobs-pipeline-client.tsx` — The full pipeline board component

### New Lib Modules
- `lib/coach/` — Full coach engine: recommendations, signals, renderer, schemas,
  strategy, tone, validators, types
- `lib/comms/` — Notifications, templates, tone, types
- `lib/errors/` — Error factory, correlation IDs, logger, response helpers
- `lib/integrity/` — AI content detector, consistency checker, gap analyzer, scorer,
  verification simulator
- `lib/jobs/display-stage.ts`, `priority.ts`, `staleness.ts`

### Fixed Issues (fixed in origin/main, still broken locally)
- `jobs.fit` is now written during analysis (your audit Priority Fix #4) — DONE
- `overall_score` column query in analytics — DONE  
- Stripe billing portal route exists (`/api/stripe/portal`) — DONE (Priority Fix #7)
- Evidence-match page exists at `/jobs/[id]/evidence-match` — DONE (Priority Fix #1 partial)
- Sidebar now correctly points "Career Context" to `/career-context` not `/evidence`
- `app/api/coach/route.ts` — model may be updated, check after pull

### New DB Scripts (need to run if not already applied)
- `scripts/001_create_career_integrity_scores.sql`
- `scripts/002_create_candidate_resume_versions.sql`
- `scripts/003_create_career_consistency_flags.sql`
- `scripts/004_create_career_verification_checks.sql`
- `scripts/005_create_career_ai_content_flags.sql`
- `scripts/006_create_career_applications.sql`
- `scripts/007_create_career_activity_log.sql`
- `scripts/008_create_career_daily_briefs.sql`
- `scripts/009_create_career_import_batches.sql`
- `scripts/031_create_coach_governance_tables.sql`
- `scripts/999_add_user_id_to_job_scores.sql`

---

## The Sidebar Mismatch (Important)

On **origin/main**, the sidebar still routes "Career Context" to `/evidence`
(the old route). The new `career-context` page lives at `/career-context`.
In the screenshots the sidebar shows "Career Context" → `/evidence` but renders
the new Proof Vault UI — this works because `/evidence/page.tsx` was ALSO rewritten
to be the Career Context view on origin/main.

The dedicated `/career-context/` route is a separate, more feature-complete version.
You may have two versions of this page — check after pulling.

---

## What To Do Right Now

### Step 1 — Pull origin/main into local
```bash
cd /Users/rorysemeah/Desktop/HireWireInGroup
git pull origin main
```
This is a fast-forward or will need a merge commit since your local has 1 commit
(`03f2b0b` — the CLAUDE.md addition) that isn't on origin yet.

If there are conflicts:
```bash
git pull origin main --no-ff
# resolve any conflicts (likely just CLAUDE.md vs origin's CLAUDE.md)
git add .
git commit -m "merge: pull origin/main UI redesign into local"
```

### Step 2 — Check for the newest v0 branch delta
After pulling origin/main, check if the newest v0 branch (`rsemeah-2362fb4c`)
has anything beyond origin/main:
```bash
git diff --name-only origin/main origin/v0/rsemeah-2362fb4c
```
From what I saw, it's only 1 commit ahead ("fix: clear stale cache") — likely
just a build fix, nothing UI-related. But verify.

### Step 3 — Run any new DB migrations
Check which scripts in `/scripts/` are numbered 001–009 with "career_" prefix —
those are new. Run them against your Supabase instance in order if you haven't already.

### Step 4 — Check .env.local for any new required vars
The integrity system and coach engine may need new env vars. After pulling, run:
```bash
npm run dev
```
and watch for missing env var errors on startup.

### Step 5 — Verify the matching_complete gate
After pulling, check whether `/jobs/[id]/evidence-match/page.tsx` actually sets
`matching_complete = true` and whether generation unblocks. This was the #1 priority
fix. The page now exists in origin/main but I haven't confirmed it wires the flag correctly.

---

## Summary

The code on your Desktop is 80 commits and 215 files behind what you built in v0.
The screenshots you showed me reflect the current state of the repo on GitHub.
Your local machine has none of that. One `git pull origin main` fixes it.

The audit I ran was accurate for the old local code. Most of the bugs I identified
(analytics score, Stripe portal, career context page, coach context sidebar) are
**already fixed** in origin/main. The `matching_complete` gate issue is partially fixed
(the page now exists). The coach model string may still be wrong — check after pulling.
