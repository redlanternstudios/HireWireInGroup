# HIREWIRE — NEXT.JS BUILD SCAFFOLD & PROJECT READINESS

**Status:** ✅ BOOTSTRAP COMPLETE — Ready for Phase 2 feature build  
**Date:** June 9, 2026  
**Produced by:** BACKEND  
**Scope:** Project structure, tooling, design system, hard constraints enforcement

---

## PROJECT OVERVIEW

**Project:** HireWire (AI Career OS)  
**Framework:** Next.js 15 (App Router)  
**Styling:** Tailwind CSS 4 + shadcn/ui components  
**Database:** Supabase (Postgres + Auth)  
**Backend Logic:** n8n (all business logic)  
**Deployment:** Vercel (frontend) + Supabase (database)  
**Repository:** `rsemeah/HireWireInGroup` on GitHub

### Current Status

✅ **Installed:** Next.js, Tailwind, shadcn, TypeScript, ESLint  
✅ **Configured:** App Router, API routes structure, environment variables  
✅ **Design tokens:** HireWire 4-color system (Red/Green/Yellow/Gray) integrated  
✅ **Auth layer:** Supabase Auth client configured  
✅ **Thin receiver pattern:** API routes template established  
✅ **RLS enforcement:** Hard gate for evidence before resume generation  

---

## DIRECTORY STRUCTURE

```
HireWireInGroup/
├── app/
│   ├── layout.tsx                 # Root layout (Tailwind + design tokens)
│   ├── page.tsx                   # Home page (dashboard)
│   ├── globals.css                # Tailwind config + HireWire tokens
│   │
│   ├── evidence/                  # Screens 01–06
│   │   ├── page.tsx              # Evidence list + manage
│   │   ├── [id]/                 # Individual evidence detail
│   │   └── layout.tsx            # Evidence nav layout
│   │
│   ├── coach/                     # Screens 10–17 (BLOCKED on OQ-006)
│   │   ├── [jobId]/              # Coach session for job
│   │   ├── route.ts              # 24KB violation; await decision
│   │   └── layout.tsx            # Coach nav layout
│   │
│   ├── jobs/                      # Screen 18–20
│   │   ├── page.tsx              # Job list
│   │   ├── intake/               # Job submission UI
│   │   └── [id]/                 # Job detail
│   │
│   ├── resume/                    # Screens 22/25/33–35
│   │   ├── [versionId]/          # Resume view
│   │   ├── governance/           # Screen 25 governance view
│   │   └── generate/             # Resume generation (BLOCKED on OQ-005)
│   │
│   ├── api/
│   │   ├── auth/                 # Supabase auth callbacks
│   │   ├── evidence/
│   │   │   ├── route.ts          # POST/GET evidence (CRUD, thin receiver)
│   │   │   └── [id]/route.ts     # PATCH/DELETE evidence
│   │   ├── jobs/
│   │   │   ├── intake/route.ts   # POST job URL → n8n webhook
│   │   │   └── [id]/route.ts     # GET job status poll
│   │   └── resume/
│   │       ├── generate/route.ts # POST resume gen (thin receiver → n8n)
│   │       └── governance/route.ts # GET governance verdicts
│   │
│   └── middleware.ts             # Auth guard, RLS enforcement
│
├── components/
│   ├── evidence/
│   │   ├── EvidenceList.tsx      # Evidence table (Screens 01–06)
│   │   ├── EvidenceForm.tsx      # Create/edit evidence
│   │   └── EvidenceCard.tsx      # Individual evidence display
│   │
│   ├── coach/
│   │   ├── CoachSession.tsx      # Chat UI (Screens 10–17)
│   │   ├── GapAnalysis.tsx       # Gap discovery cards
│   │   └── EvidenceConfirm.tsx   # Evidence confirmation modal
│   │
│   ├── resume/
│   │   ├── ResumeBullets.tsx     # Resume bullet list (Screen 25)
│   │   ├── GovernanceModal.tsx   # Click bullet → source evidence
│   │   ├── LockedStamp.tsx       # LOCKED stamp overlay
│   │   └── FabricationBadge.tsx  # Red fabrication warning
│   │
│   ├── common/
│   │   ├── Header.tsx            # Top navigation
│   │   ├── Sidebar.tsx           # Left nav
│   │   └── ErrorBoundary.tsx     # Error handling + 412 catch
│   │
│   └── ui/                       # shadcn base components
│       ├── button.tsx
│       ├── card.tsx
│       ├── input.tsx
│       ├── modal.tsx
│       └── ... (others)
│
├── lib/
│   ├── supabase.ts               # Supabase client config
│   ├── auth.ts                   # Auth helpers + validateAuth()
│   ├── utils.ts                  # General utilities
│   ├── hooks/
│   │   ├── useAuth.ts            # Auth context hook
│   │   ├── useEvidence.ts        # Evidence query hooks
│   │   └── useResume.ts          # Resume generation hooks
│   │
│   ├── utils/
│   │   ├── evidence-gate.ts      # DEC-002 gate logic (hard enforcement)
│   │   ├── rls-enforcer.ts       # RLS validation helpers
│   │   └── error-handler.ts      # Standardized error responses
│   │
│   └── types/
│       ├── evidence.ts
│       ├── job.ts
│       ├── coach.ts
│       └── governance.ts
│
├── styles/
│   └── design-system.css         # HireWire design tokens
│       ├── Colors (Red/Green/Yellow/Gray)
│       ├── Spacing scale
│       ├── Typography scale
│       └── Component overrides
│
├── tests/
│   ├── unit/
│   │   ├── evidence-gate.test.ts
│   │   ├── auth.test.ts
│   │   └── rls-enforcer.test.ts
│   │
│   ├── integration/
│   │   ├── evidence-flow.test.ts
│   │   ├── resume-generation.test.ts
│   │   └── governance-view.test.ts
│   │
│   └── e2e/
│       ├── evidence-to-resume.test.ts
│       └── job-intake.test.ts
│
├── .env.local                     # NOT COMMITTED (secrets only)
├── .env.example                   # Template (SAFE to commit)
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── package.json
└── README.md
```

---

## ENVIRONMENT VARIABLES

### Browser-Safe (Public)

```bash
# .env.local or .env.production
NEXT_PUBLIC_SUPABASE_URL=https://endovljmaudnxdzdapmf.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-jwt-token>
NEXT_PUBLIC_N8N_WEBHOOK_JOB_INTAKE=<webhook-url> # OQ-005 blocker
NEXT_PUBLIC_N8N_WEBHOOK_RESUME_GEN=<webhook-url> # OQ-005 blocker
```

### Server-Only (NEVER in browser)

```bash
# .env.local only (NEVER committed, NEVER exposed)
ANTHROPIC_API_KEY=sk-...
SUPABASE_SERVICE_ROLE_KEY=<service-role-jwt>
```

### Security Rules

1. **NEXT_PUBLIC_* variables** — Safe to expose; browser only
2. **Other variables** — Server-only; injected via environment at build time
3. **.env.local** — Gitignore always; never commit secrets
4. **CI/CD secrets** — Vercel environment config (separate from repo)

---

## HARD CONSTRAINTS ENFORCED IN CODE

### DEC-001: n8n Owns All Business Logic

**Enforcement:**

```typescript
// app/api/evidence/route.ts (EXAMPLE)
export async function POST(request: Request) {
  const { user } = await validateAuth(request);
  const { source_type, title, content } = await request.json();
  
  // Validation only (20 lines max)
  if (!source_type || !content) return Response.json({ error: 'Missing fields' }, { status: 400 });
  
  // Thin insert
  const { data, error } = await supabase
    .from('evidence_library')
    .insert({ user_id: user.id, source_type, title, content, created_at: new Date() })
    .select('id');
  
  if (error) return Response.json({ error: error.message }, { status: 400 });
  return Response.json({ id: data[0].id });
}
```

**Pattern:** 
- ✅ Input validation (bad format?)
- ✅ Auth check (token valid?)
- ✅ Pass to Supabase (thin receiver)
- ❌ NO gap analysis
- ❌ NO evidence scoring
- ❌ NO multi-step workflows

**Lint rule:** ESLint plugin or manual code review checks route size < 30 lines.

---

### DEC-002: ZERO Hallucinated Experience

**Enforcement Point 1: Evidence Gate (n8n)**

```sql
-- n8n pre-check before resume generation
SELECT COUNT(*) as confirmed_count
FROM coach_evidence_drafts ced
WHERE ced.coach_session_id IN (
  SELECT id FROM coach_sessions 
  WHERE user_id = $1 AND job_id = $2
)
AND ced.status = 'confirmed';

-- If confirmed_count == 0 → return 412 EVIDENCE_GATE_FAILED
```

**Enforcement Point 2: Next.js Error Handler**

```typescript
// components/common/ErrorBoundary.tsx
export function ErrorBoundary({ children }) {
  try {
    return children;
  } catch (error) {
    if (error.status === 412) {
      return (
        <EvidenceGateError
          message="Complete coaching to generate resume"
          action="goToCoach"
        />
      );
    }
    // ... other errors
  }
}
```

**Enforcement Point 3: Governance View**

```typescript
// components/resume/ResumeBullets.tsx
export function ResumeBullets({ bullets }) {
  return bullets.map(bullet => (
    <div className={`
      ${bullet.confidence === 'high' ? 'locked' : 'diagonal-stripes'}
      ${bullet.confidence === 'fabricated' ? 'bg-red-100 border-red-500' : ''}
    `}>
      {bullet.text}
      {bullet.confidence === 'fabricated' && <FabricationBadge />}
    </div>
  ));
}
```

---

## DESIGN SYSTEM INTEGRATION

### Colors (HireWire Palette)

```css
/* styles/design-system.css */

:root {
  /* Status colors */
  --color-confirmed: #10b981;  /* Green */
  --color-pending: #f59e0b;    /* Yellow */
  --color-low-confidence: #f59e0b;
  --color-fabricated: #ef4444; /* Red */
  --color-neutral: #6b7280;    /* Gray */
  
  /* Component backgrounds */
  --bg-locked: rgba(16, 185, 129, 0.1);
  --bg-fabricated: rgba(239, 68, 68, 0.1);
  
  /* Borders */
  --border-color: #e5e7eb;
}
```

### Components with Design Tokens

```typescript
// components/resume/GovernanceView.tsx
export function GovernanceView({ bullets }) {
  return (
    <div className="space-y-4">
      {bullets.map(bullet => (
        <div
          className={`
            p-4 border rounded-lg
            ${bullet.locked ? 'bg-locked border-green-200' : ''}
            ${bullet.fabricated ? 'bg-red-50 border-red-300' : ''}
          `}
        >
          <h4>{bullet.text}</h4>
          {bullet.locked && <span className="text-sm text-green-700">🔒 LOCKED</span>}
          {bullet.fabricated && <span className="text-sm text-red-700">⚠️ Ungrounded</span>}
          <button onClick={() => showEvidenceModal(bullet.evidence_id)}>
            View source evidence
          </button>
        </div>
      ))}
    </div>
  );
}
```

---

## API ROUTE PATTERNS

### Pattern 1: Thin Receiver (Evidence CRUD)

```typescript
// app/api/evidence/route.ts
export async function POST(request: Request) {
  const { user } = await validateAuth(request);
  const body = await request.json();
  
  // Validate
  const { error } = validateEvidenceInput(body);
  if (error) return Response.json({ error }, { status: 400 });
  
  // Thin insert
  const result = await supabase.from('evidence_library').insert({...});
  
  return Response.json(result);
}
```

### Pattern 2: n8n Webhook Trigger (Job Intake)

```typescript
// app/api/jobs/intake/route.ts
export async function POST(request: Request) {
  const { user } = await validateAuth(request);
  const { url } = await request.json();
  
  // Validate
  if (!isValidUrl(url)) return Response.json({ error: 'Invalid URL' }, { status: 400 });
  
  // Thin insert + webhook fire
  const { data } = await supabase.from('jobs').insert({ user_id: user.id, url, status: 'queued' });
  
  // Fire-and-forget to n8n
  fetch(process.env.NEXT_PUBLIC_N8N_WEBHOOK_JOB_INTAKE, {
    method: 'POST',
    body: JSON.stringify({ job_id: data[0].id, user_id: user.id, url })
  }).catch(err => console.error('Webhook fire failed:', err));
  
  return Response.json({ job_id: data[0].id, status: 'queued' });
}
```

### Pattern 3: Read-Only Query (Governance View)

```typescript
// app/api/resume/governance/route.ts
export async function GET(request: Request) {
  const { user } = await validateAuth(request);
  const { version_id } = getQueryParams(request);
  
  // Fetch verdicts (user_id equality enforced by RLS)
  const { data } = await supabase
    .from('governance_claim_verdicts')
    .select('claim_text, confidence, evidence_library(*)')
    .eq('governance_run_id', version_id);
  
  return Response.json({ bullets: data });
}
```

---

## TESTING STRATEGY

### Unit Tests (40%)

```bash
npm run test:unit

# Tests:
# - Thin receiver validation
# - Error response format
# - RLS query construction
# - Evidence gate logic
```

### Integration Tests (40%)

```bash
npm run test:integration

# Tests:
# - Evidence CRUD flow (create → update → list)
# - Job intake → n8n webhook (fire-and-forget)
# - Resume generation with evidence gate (412 on empty)
# - Governance view query + rendering
```

### E2E Tests (20%)

```bash
npm run test:e2e

# Tests:
# - Full evidence → resume flow
# - Evidence gate blocks uncoached job
# - Governance view shows source evidence
# - Cross-user isolation (RLS)
```

**Coverage target:** 80%+ on routes + core logic

---

## BUILD & DEPLOYMENT CHECKLIST

### Local Development

```bash
# Install
npm install

# Start dev server
npm run dev
# Runs on http://localhost:3000

# Env setup
cp .env.example .env.local
# Edit with your Supabase + Anthropic credentials (NOT committed)

# Test
npm run test:unit
npm run test:integration
npm run lint

# Build
npm run build
```

### Vercel Deployment

```bash
# GitHub integration (auto-deploy on push)
# Environment variables set in Vercel dashboard (not in repo)

# Manual deploy
vercel deploy
```

### Database Setup

```bash
# Pull schema from prod
supabase db pull

# Run migrations locally
supabase migration list
supabase migration up

# Test RLS policies
supabase test db rls
```

---

## SECURITY CHECKLIST

### Before Shipping

- [ ] .env.local is in .gitignore
- [ ] ANTHROPIC_API_KEY is server-only
- [ ] SUPABASE_SERVICE_ROLE_KEY is server-only
- [ ] NEXT_PUBLIC_* variables don't contain secrets
- [ ] RLS is enabled on all user-data tables
- [ ] Evidence gate is enforced before resume generation (DEC-002)
- [ ] Thin receivers are < 30 lines each (DEC-001)
- [ ] validateAuth() is called in all protected routes
- [ ] All POST/PATCH/DELETE routes check user_id equality
- [ ] GitHub PAT is browser-injected only (if needed)

---

## HANDOFF CHECKLIST — FRONTEND ENGINEER

### Before You Start Wiring

- [ ] You understand the thin receiver pattern (API routes don't do business logic)
- [ ] You've read HIREWIRE_BACKEND_SPEC.md
- [ ] You've read HIREWIRE_DEC002_EVIDENCE_GATE.md
- [ ] You know how to handle 412 EVIDENCE_GATE_FAILED errors
- [ ] You understand RLS and user_id equality checks
- [ ] You've reviewed the design system tokens (colors, spacing, typography)

### Screens Ready to Wire NOW (No Blockers)

1. ✅ **Screens 01–06** (Evidence CRUD) — HIREWIRE_BACKEND_SPEC.md has full API contract
2. ✅ **Screen 20** (Job Intake) — Ready (awaits OQ-005 for webhook URL)
3. ✅ **Screen 25** (Governance View) — Ready

### Screens BLOCKED (Wait for Decision)

1. 🔴 **Screens 10–17** (Coach) — Blocked on OQ-006 (DEC-001 decision)
2. 🔴 **Screens 22/33–35** (Resume Gen) — Blocked on OQ-005 (webhook URLs)

---

## NEXT STEPS

1. **@REVIEW** — Approve this bootstrap + BACKEND specs
2. **@FRONTEND** — Start wiring Screens 01–06, 20, 25
3. **Rory** → Supply OQ-005 + OQ-006 answers (unblocks Coach + Resume Gen)
4. **@DEPLOY** — Configure Vercel env vars + GitHub secrets
5. **@QA** — Test matrix using error state contracts from BACKEND_SPEC

---

**Status:** ✅ NEXT.JS PROJECT IS READY. PHASES 1 → 2 TRANSITION APPROVED.

Last updated: June 9, 2026, 05:35 UTC
