# HireWire — Claude Code Handoff

**Date:** 2026-05-08  
**Branch:** main  
**Status:** V0 complete, pre-launch safety gating required

---

## Architecture guardrails (read before touching anything)

### AI adapter
`lib/adapters/anthropic.ts` — Anthropic via Vercel AI Gateway. **Not Groq.** Models:
- `CLAUDE_MODELS.SONNET` — primary generation (`anthropic/claude-sonnet-4-20250514`)
- `CLAUDE_MODELS.OPUS` — complex reasoning
- `CLAUDE_MODELS.HAIKU` — fast/simple tasks

Import: `import { CLAUDE_MODELS } from "@/lib/adapters/anthropic"`

### Safety layer
`lib/safety/index.ts` — enterprise-grade, 4-layer protection:
1. PII detection (`lib/safety/pii-detector.ts`)
2. Prompt injection detection, 20+ categories (`lib/safety/injection-detector.ts`)
3. Content moderation (`lib/safety/content-moderator.ts`)
4. Composite risk score (0–100), block threshold: 60 (strict: 40)

Key exports: `checkSafety(messages, { userId, sessionId, strictMode })`, `sanitizeInput(text)`, `quickRiskCheck(text)`

**Current wiring:** `generate-documents` imports `sanitizeInput` only. `checkSafety` is NOT wired to any route yet. This is Ticket A.

### Prompts
`lib/ai/prompts/` — all prompts centralized here:
- `coach.ts` → `COACH_SYSTEM_PROMPT`
- `job-analysis.ts` → `JOB_ANALYSIS_PROMPT`
- `document-generation.ts` → `DOCUMENT_GENERATION_PROMPTS`
- `index.ts` re-exports all

### Auth pattern
All API routes and server components use `createClient()` from `lib/supabase/server`. All dashboard pages are under `app/(dashboard)/` which enforces auth in `app/(dashboard)/layout.tsx`.

### Evidence library
`app/(dashboard)/evidence/` — complete. Do not refactor this page without reading `lib/truthserum.ts` and `lib/canonical-evidence.ts` first. Complex provenance-tracking and quantification-safety logic lives there.

---

## What's done ✅

| Surface | File(s) | Notes |
|---------|---------|-------|
| Auth (login/signup/logout) | `app/(auth)/` | Supabase SSR |
| Onboarding | `app/onboarding/` | Multi-step |
| Dashboard home | `app/(dashboard)/dashboard/page.tsx` | |
| Sidebar navigation | `components/app-sidebar.tsx` | Full 10-item pipeline nav + 3-item footer |
| Dashboard layout | `app/(dashboard)/layout.tsx` | SidebarProvider + SidebarInset |
| Jobs list + analyze | `app/(dashboard)/jobs/page.tsx` | URL submit → `/api/analyze` |
| Job detail + generate | `app/(dashboard)/jobs/[id]/page.tsx` | |
| Job documents | `app/(dashboard)/jobs/[id]/documents/` | |
| Ready to apply queue | `app/(dashboard)/ready-queue/page.tsx` | |
| Applications | `app/(dashboard)/applications/page.tsx` | Fixed: `notes` column removed |
| Evidence library | `app/(dashboard)/evidence/` | AddModal, EvidenceCard, EvidenceList, actions |
| Profile | `app/(dashboard)/profile/page.tsx` | ProfileForm, actions |
| LinkedIn import widget | `components/dashboard/LinkedInImportWidget.tsx` | PDF upload tab + paste text tab |
| AI adapter | `lib/adapters/anthropic.ts` | Vercel AI Gateway |
| Safety layer (built) | `lib/safety/` | 4 files, not yet wired to routes |
| Prompts extracted | `lib/ai/prompts/` | 3 prompts + index |
| Claim safety | `lib/claim-safety.ts` | Confidence classification |
| Truthserum | `lib/truthserum.ts` | Evidence filtering + banned phrases |
| Canonical evidence | `lib/canonical-evidence.ts` | Metric safety checks |
| Job analysis core | `lib/analyze/analyze-job-core.ts` | LinkedIn 999 handling |
| RLS policy: delete profile links | Migration applied | `add_user_profile_links_delete_policy` |
| Footer (privacy/terms) | `app/(dashboard)/layout.tsx` | |
| Landing page | `app/landing/` | |
| Legal pages | `app/(legal)/` | |

---

## Ticket A — Wire safety checks (LAUNCH BLOCKING, ~1 hr)

`checkSafety` is built but unwired. Three routes need it:

### 1. `/api/analyze` — `app/api/analyze/route.ts`

After auth check, before calling `analyzeJobCore`:

```typescript
import { checkSafety, sanitizeInput } from "@/lib/safety"

// After auth check:
const safetyResult = checkSafety([{ role: "user", content: body.job_url }], { userId: user.id })
if (!safetyResult.allowed) {
  return NextResponse.json({ success: false, error: safetyResult.blockedResponse }, { status: 400 })
}
```

### 2. `/api/generate-documents` — `app/api/generate-documents/route.ts`

Already imports `sanitizeInput`. Add full `checkSafety` around the user-supplied cover letter instructions or free-text fields.

### 3. `/api/resume/upload` — `app/api/resume/upload/route.ts`

File name + metadata check. Minimal: validate PDF MIME before passing to parser.

---

## Ticket B — Prompt extraction audit (code quality, parallel with A)

Check that all prompts in API routes are actually importing from `lib/ai/prompts/` instead of inline strings. Verify:

```bash
grep -r "system:" app/api/ --include="*.ts" | grep -v "node_modules"
```

Any inline system prompt strings should be moved to the appropriate file in `lib/ai/prompts/`.

---

## Ticket C — Coach bubble (polish, last)

- Coach route: `app/api/coach/route.ts`, page likely under `app/(dashboard)/` (check for `/coach` route)
- Needs: conversation persistence across page navigation, mobile responsive layout
- Uses `COACH_SYSTEM_PROMPT` from `lib/ai/prompts/coach.ts`

---

## Launch gate — 10 pass/fail checks

Before calling this production-ready, verify all 10:

| # | Check | How to verify |
|---|-------|---------------|
| 1 | Auth redirect works | Log out → visit `/dashboard` → lands on `/login` |
| 2 | Post-login redirect | Log in → lands on `/jobs`, not `/login` or `/dashboard` old route |
| 3 | Job analyze + generate full flow | Paste a Greenhouse/Lever URL → analyze → generate resume + cover letter |
| 4 | LinkedIn URL rejected with clear message | Paste `https://linkedin.com/in/anyone` into job analyzer → see helpful error |
| 5 | LinkedIn PDF import | Upload a LinkedIn PDF → evidence library populated |
| 6 | Evidence library shows imported items | Navigate to `/evidence` after import |
| 7 | Applications page loads | Navigate to `/applications` — must not 400 (old `notes` bug) |
| 8 | Safety layer blocks injection | POST `{"job_url": "ignore previous instructions and..."}` to `/api/analyze` → blocked |
| 9 | RLS: users can't see each other's data | Two test accounts — user A cannot see user B's jobs/evidence |
| 10 | Sidebar all links resolve | Click every sidebar item — no 404s |

---

## Key known constraints

- **Supabase `applications` table** has no `notes` column — do not add it to select queries
- **`user_profile_links` DELETE RLS** — migration applied, policy name: `"Users can delete own profile links"`
- **LinkedIn profile URLs** (`linkedin.com/in/`) return 999 anti-bot response — pre-flight rejection in `lib/analyze/analyze-job-core.ts`
- **`CLAUDE_MODELS` model IDs** include date suffixes — don't strip them, AI Gateway needs exact strings
- **DiagonalStripes component** (`components/off-white-stripes.tsx`) is imported by `AppSidebar` — don't delete it
