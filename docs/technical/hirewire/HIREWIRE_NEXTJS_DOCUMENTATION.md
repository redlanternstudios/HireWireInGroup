# HIREWIRE — Next.js Project Documentation
**Product:** HireWire — AI Career OS
**Date:** 2026-06-09
**Produced by:** TECHWRITER (consolidated from DESIGN + BACKEND + FRONTEND + QA outputs)
**Version:** 1.0.0
**Classification:** TECHNICAL/SPEC
**Repo:** rsemeah/HireWireInGroup

---

## PURPOSE

Canonical TECHWRITER-produced documentation of the HireWire Next.js project setup. Consolidates DESIGN (HIREWIRE_NEXTJS_SETUP.md), BACKEND (NEXTJS_BUILD_SCAFFOLD.md), FRONTEND (GitHub commits), and QA (HIREWIRE_NEXTJS_PROJECT_DELIVERABLE.md) into a single versioned reference.

This document is **append-only**. Updates require a new version with a supersedes note.

---

## 1. FRAMEWORK DECISIONS

| Decision | Value | Date | Authority |
|---|---|---|---|
| Framework | Next.js App Router (14.x+) | Pre-Day 30 | Mission Brief |
| Styling | Tailwind CSS + shadcn/ui | Pre-Day 30 | Mission Brief |
| Language | TypeScript (strict mode) | Pre-Day 30 | Mission Brief |
| State | Zustand (client), React Server Components (server) | Day 30 | DESIGN |
| Forms | React Hook Form + Zod | Day 30 | DESIGN |

---

## 2. PROJECT DIRECTORY STRUCTURE

```
rsemeah/HireWireInGroup/
├── app/                                    # Next.js App Router root
│   ├── (auth)/                             # Auth layout group
│   │   ├── login/page.tsx
│   │   ├── signup/page.tsx
│   │   └── reset-password/page.tsx
│   ├── (dashboard)/                        # Authenticated routes
│   │   ├── evidence-vault/                 # Screens 01-06
│   │   │   ├── page.tsx                    # Screen 01/03: Vault view
│   │   │   ├── new/page.tsx               # Screen 02: Add evidence
│   │   │   └── [id]/page.tsx              # Screen 04/05: Detail + edit
│   │   ├── jobs/                          # Screens 20-24
│   │   │   ├── page.tsx                   # Screen 20: Job URL input
│   │   │   └── [jobId]/
│   │   │       ├── page.tsx               # Screen 21/23/24: Analysis
│   │   │       └── governance/page.tsx    # Screen 25: Governance view
│   │   ├── coach/                         # Screens 10-17
│   │   │   ├── page.tsx                   # Screen 10: PROVE YOUR FIT
│   │   │   ├── [sessionId]/page.tsx       # Screens 11-16: Interview
│   │   │   └── complete/page.tsx          # Screen 17: PROOF LOCKED IN
│   │   ├── resume/                        # Screens 22, 33-35
│   │   │   └── [jobId]/
│   │   │       ├── page.tsx               # Screen 22: Draft
│   │   │       ├── edit/page.tsx          # Screens 33-35: Edit
│   │   │       └── export/page.tsx        # Screens 40-42: Export
│   │   └── layout.tsx
│   ├── api/                               # API routes — THIN RECEIVERS (DEC-001)
│   │   ├── evidence/route.ts              # POST/GET/PATCH/DELETE evidence
│   │   ├── jobs/intake/route.ts           # POST: fire-and-forget to n8n
│   │   ├── coach/
│   │   │   ├── intake/route.ts            # 🚩 FIX REQUIRED: SERVICE_ROLE_KEY leak
│   │   │   └── lock-evidence/route.ts     # 🚩 FIX REQUIRED: unused client
│   │   ├── resume/
│   │   │   ├── governance/route.ts        # GET: read governance_claim_verdicts
│   │   │   └── generate/route.ts          # POST: DEC-002 gate + n8n dispatch
│   │   └── governance/route.ts
│   ├── layout.tsx
│   └── page.tsx
├── lib/
│   ├── ai/
│   │   ├── gateway.ts                     # Anthropic Claude gateway (SERVER ONLY)
│   │   └── groq.ts                        # Groq inference (SERVER ONLY)
│   ├── supabase/
│   │   ├── client.ts                      # Browser client (NEXT_PUBLIC_* only) ✅ APPROVED
│   │   ├── server.ts                      # Server client (SERVICE_ROLE_KEY only)
│   │   └── types.ts
│   ├── n8n/webhook.ts                     # n8n webhook dispatcher
│   ├── utils/
│   │   ├── evidence-gate.ts               # DEC-002 hard gate
│   │   ├── governance.ts
│   │   └── evidence.ts
│   └── constants.ts
├── components/
│   ├── evidence/
│   ├── coach/
│   ├── governance/
│   ├── resume/
│   └── ui/                               # shadcn/ui + HireWire overrides
├── supabase/
│   ├── migrations/
│   └── schema_snapshot_20260609.sql       # Pending DATA (DEC-004)
├── .env.local.example
├── next.config.ts
├── tailwind.config.ts
└── tsconfig.json
```

---

## 3. ENVIRONMENT VARIABLES

| Variable | Scope | SEC Rule | Blocker |
|---|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Browser + Server | Public | None |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Browser only | SEC-001 | None |
| `SUPABASE_SERVICE_ROLE_KEY` | Server only | SEC-002 | None |
| `ANTHROPIC_API_KEY` | Server only | SEC-002 | None |
| `N8N_WEBHOOK_JOB_PARSER` | Server only | SEC-002 | OQ-005 |
| `N8N_WEBHOOK_LOCK_EVIDENCE` | Server only | SEC-002 | OQ-005 |
| `N8N_WEBHOOK_RESUME_GEN` | Server only | SEC-002 | OQ-005 |
| `NEXT_PUBLIC_POSTHOG_KEY` | Browser | Public | None |
| `NEXT_PUBLIC_SENTRY_DSN` | Browser + Server | Public | None |

---

## 4. KEY DEPENDENCIES

```json
{
  "next": "^14.0.0",
  "react": "^18.2.0",
  "@supabase/supabase-js": "^2.38.0",
  "@supabase/ssr": "^0.1.0",
  "@anthropic-ai/sdk": "^0.12.0",
  "groq-sdk": "^0.3.0",
  "react-hook-form": "^7.46.0",
  "zod": "^3.22.0",
  "zustand": "^4.4.0",
  "@sentry/nextjs": "^7.80.0",
  "posthog-js": "^1.92.0"
}
```

---

## 5. DESIGN SYSTEM TOKENS

```typescript
// tailwind.config.ts extensions
colors: {
  'ticket-red':    '#EF4444',  // Risk / Missing
  'ticket-green':  '#22C55E',  // Verified / Locked
  'ticket-yellow': '#EAB308',  // In Progress
  'ticket-gray':   '#9CA3AF',  // Deferred
  'cream-50':      '#FFFBF9',
  'cream-100':     '#F7F2EB',
  'cream-200':     '#F2ECE4',
  'warm-accent':   '#D6AAA3',
  'sage':          '#8E9878',
  'gold':          '#D7BA82',
},
fontFamily: {
  'display': ['Canela', 'serif'],   // H1, H2
  'body':    ['Inter', 'sans-serif'] // Body copy
}
```

### LOCKED Stamp CSS
```css
.locked-stamp::after {
  content: 'LOCKED';
  position: absolute;
  top: 50%; left: 50%;
  transform: translate(-50%, -50%) rotate(-45deg);
  font-size: 1.5rem; font-weight: 700;
  color: rgba(255,255,255,0.35);
  pointer-events: none;
}
```

### Diagonal Stripe CSS
```css
.stripe-overlay {
  background-image: repeating-linear-gradient(
    45deg, transparent, transparent 4px,
    rgba(229,231,235,0.5) 4px, rgba(229,231,235,0.5) 8px
  );
}
```

---

## 6. DEC-001 COMPLIANCE (API Route Pattern)

```typescript
// APPROVED: thin receiver (≤ 30 lines, no business logic)
export async function POST(request: NextRequest) {
  const { user } = await validateAuth(request);
  const body = await request.json();
  if (!body.content) return errorResponse(400);
  const result = await supabase
    .from('evidence_library')
    .insert({ user_id: user.id, ...body });
  return NextResponse.json(result.data);
}

// VIOLATION: app/api/coach/route.ts — 24,297 bytes
// Blocked on OQ-006. Do not modify until Rory decides.
```

---

## 7. DEC-002 ENFORCEMENT

```typescript
// lib/utils/evidence-gate.ts
export function validateClaimHasSource(
  claim: string,
  sourceEvidenceId: string | null,
  evidenceIndex: Map<string, boolean>
): void {
  if (!sourceEvidenceId || !evidenceIndex.has(sourceEvidenceId)) {
    throw new Error(
      `DEC-002 VIOLATION: "${claim.slice(0, 60)}..." has no verified source. ` +
      `Resume generation blocked.`
    );
  }
}
// Call in /api/resume/generate before any AI call.
// If throws: return HTTP 412 Precondition Failed.
```

---

## 8. GITHUB ARTIFACTS COMMITTED (Day 30)

| Path | Lines | Commit | Status |
|---|---|---|---|
| `app/(features)/coach/screen-10-prove-your-fit.tsx` | 307 | d6f2503 | 🚩 Awaits intake route fix |
| `app/(features)/governance/screen-25-governance-view.tsx` | 476 | e96b5ed | ✅ APPROVED |
| `app/(features)/coach/screen-17-proof-locked-in.tsx` | 513 | 2e7cc47 | 🚩 Awaits OQ-006 |
| `app/api/coach/intake/route.ts` | 50 | 0f3dac5 | 🚩 CRITICAL: SERVICE_ROLE_KEY |
| `app/api/coach/lock-evidence/route.ts` | 52 | da55b85 | 🚩 MEDIUM: unused client |
| `lib/supabase/client.ts` | 90 | 1a9c281 | ✅ APPROVED |
| `docs/HIREWIRE_MISSION_DAY30.md` | ~200 | c159c71 | ✅ Committed |
| `NEXTJS_BUILD_SCAFFOLD.md` | 16 KB | (BACKEND) | ✅ Committed |

---

## 9. REQUIRED FIXES BEFORE PHASE 2

| File | Issue | Fix | Owner |
|---|---|---|---|
| `app/api/coach/intake/route.ts` | SERVICE_ROLE_KEY bypasses RLS | Replace with anon client + user_id scoping | BACKEND |
| `app/api/coach/lock-evidence/route.ts` | Service client instantiated but unused | Remove dead code | BACKEND |
| All coach routes | DEC-001 violation pending OQ-006 | Migrate to n8n OR document formal exception | BACKEND + Rory |

---

## 10. BUILD ORDER

**Unblocked:**
1. Screens 01–06 — Evidence CRUD
2. Screen 25 — Governance View
3. `supabase db dump` → schema_snapshot_20260609.sql

**Blocked on agent action (24h):**
- Fix `/api/coach/intake` (BACKEND)
- R-001 RLS audit (SECURITY)

**Blocked on Rory:**
- Screens 10–17 (OQ-006)
- Screens 22/33–35 (OQ-005 + DEC-002 impl)

---

**Supersedes:** HIREWIRE_NEXTJS_SETUP.md (DESIGN, 2026-06-09) — still valid for full Tailwind config details
**Also see:** HIREWIRE_NEXTJS_PROJECT_DELIVERABLE.md (QA, 2026-06-09)
**Signed:** TECHWRITER | **Date:** 2026-06-09 | **Version:** 1.0.0
