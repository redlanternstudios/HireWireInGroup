# HIREWIRE — BUILD DAY 30 FULL MISSION BRIEF

**Status:** FORMAL — All agents read this before build starts  
**Date:** June 9, 2026  
**Produced by:** RUNTIME  
**Upstream:** Product spec, DB audit, UI inventory, hard constraints

---

## PRODUCT DEFINITION

**HireWire** is an AI Career OS that helps job seekers go from **evidence → coached narrative → governed resume → placement**.

### Core Loop

1. **Evidence Vault** — User curates achievements, credentials, projects (Screens 01–06)
2. **Socratic Coach** — AI asks gap-discovery questions to match evidence to job requirements (Screens 10–17)
3. **Evidence-Grounded Resume** — Claude generates resume claims that link back to confirmed evidence (Screens 22/33–35)
4. **Governance Audit** — Every resume claim shows its source evidence with confidence scores + fabrication flags (Screen 25)

**Why it works:** No hallucinated experience. Every claim is traceable to user-confirmed evidence.

---

## VERIFIED DATABASE STATE

**Supabase Project:** endovljmaudnxdzdapmf  
**Database:** PostgreSQL 15+  
**Status:** 110 tables present, RLS partially enforced, migrations up to Day 27

### Verified Data (as of June 9)

| Metric | Count | Status |
|---|---|---|
| Total tables | 110 | ✅ Verified |
| Evidence items | 225 | ✅ User-created + seeded |
| Job analyses | 60 | ✅ Parsed job postings |
| Governance runs | 40 | ✅ Resume validation passes |
| Users (test) | 12 | ✅ RLS isolation tested |

### Critical Schema Gap

**Base migration (20260510210753_remote_schema.sql):** 0 bytes — BLOCKER for fresh dev environment.

**Action required:** @DATA runs `supabase db dump` to replace with authoritative schema snapshot.

---

## UI INVENTORY — 51 SCREENS

**Master folder:** Google Drive `1tigojYi9V8h_7LHud1uLWdc2VVLVFrBB`  
**Audit findings:** Master UI Audit v2 (file ID: 1dy6iw-pZV6wodG4I0iJZcrrqn4nBxgtJ)

### MVP Scope (Evidence Loop + Coach + Resume)

| Feature | Screens | Status |
|---|---|---|
| Evidence Management | 01–06 | ✅ Ready |
| Onboarding | 07–09 | ⏸ Defer to V2 |
| **Socratic Coach** | **10–17** | **⚠️ Blocked on OQ-006** |
| Job Intake | 18–20 | ✅ Ready |
| Coach Summary | 21, 23–24 | ✅ Ready |
| **Resume Generation** | **22/33–35** | **⚠️ Blocked on OQ-005** |
| **Governance View** | **25** | **✅ Ready** |
| Settings | 26–28 | ⏸ Defer to V2 |
| **Screens to DELETE** | **29, 32, 45, 46, 50, 51** | **🗑️** |
| **Defer to V2** | **38, 39, 49** | **📋** |

### Design System

- **Ticket Tags** — 4-color system (Red/Green/Yellow/Gray) for status + confidence
- **LOCKED Stamp** — High-confidence evidence (visual lock icon + diagonal stripes)
- **Diagonal Stripes** — Low-confidence evidence (visual overlay)
- **Fabrication Warning** — Red background + ⚠️ icon for hallucinated claims

---

## HARD CONSTRAINTS (Non-Negotiable)

### DEC-001: n8n Owns ALL Business Logic

**Rule:** All orchestration, AI calls, data transformation → n8n only.  
**What Next.js can do:** Thin receivers (validate input + forward to n8n), read-only queries, error responses.  
**What Next.js CANNOT do:** ML inference, data transformation, decision trees, multi-step workflows.  
**Max line count per route:** 30 lines.  

**Current violation:** `app/api/coach/route.ts` = 24KB of business logic (gap analysis, context engine, evidence scoring).  
**Decision required:** OQ-006 — migrate to n8n or revise constraint.

### DEC-002: ZERO Hallucinated Experience

**Rule:** Every resume claim must trace to verified evidence provided by user.  
**How:** Evidence gate checks confirmed evidence before generation. Genesis claims that cannot be grounded are labeled fabricated.  
**Enforcement:** HTTP 412 EVIDENCE_GATE_FAILED if no evidence for job.  
**Current state:** Soft guard only (prompt instruction). Hard enforcement not yet implemented.  
**Implementation:** BACKEND spec includes full gate logic (n8n pre-check + Next.js error handling).

### Security Rules

1. **GitHub PAT + Supabase anon token** — Browser only (injected via JS)
2. **ANTHROPIC_API_KEY + SUPABASE_SERVICE_ROLE_KEY** — Server only (environment variables)
3. **.env.local** — NEVER committed to repo
4. **RLS** — Every user-data table must have `auth.uid() = user_id` policy

---

## TECH STACK (Non-Negotiable)

| Layer | Tech | Status |
|---|---|---|
| **Frontend** | Next.js App Router + Tailwind + shadcn/ui | ✅ Exists |
| **Database** | Supabase (Postgres 15) | ✅ Exists |
| **Business Logic** | n8n | ⚠️ Partial (job intake), blocked on OQ-006 |
| **Integrations** | Make.com (webhooks) | ⏸ Future |
| **AI** | Claude 3.5 Sonnet (Anthropic API) | ✅ Integrated |
| **Deployment** | Vercel (frontend) + Supabase (database) | ✅ Configured |

### Codebase

**GitHub:** rsemeah/HireWireInGroup  
**Branch:** main  
**Status:** Feature-complete scaffolding, needs Phase 2 build-out

---

## OPEN QUESTIONS (BLOCKING)

### Blocker 1: OQ-006 — DEC-001 Decision

**Question:** Coach route (24KB Next.js logic) — migrate to n8n or revise DEC-001?

**Impact:** Cannot spec coach API (Screens 10–17) until decided.

**Options:**
- **Option A (Recommended):** Migrate coach route to n8n. BACKEND provides thin receiver only.
- **Option B:** Formal amend DEC-001 with coach-route carve-out + migration deadline (e.g., V1.1).

**Owner:** Rory  
**Decision needed by:** Start of Phase 2 build

---

### Blocker 2: OQ-005 — n8n Webhook URLs

**Question:** What are the n8n webhook URLs for:
- Job intake parsing (POST /api/jobs/intake)?
- Resume generation + governance (POST /api/resume/generate)?

**Impact:** Cannot wire thin receivers without real URLs. Currently placeholder-only.

**Owner:** Rory / Operations  
**Decision needed by:** FRONTEND ready to wire job intake (< 2 days)

---

### Blocker 3: OQ-003 — Base Migration

**Question:** Can @DATA run `supabase db dump` and replace `20260510210753_remote_schema.sql` with authoritative schema?

**Impact:** Fresh dev environment cannot bootstrap. CI schema validation cannot run.

**Owner:** @DATA  
**Timeline:** Complete within 24 hours

---

### Critical: R-001 — jobs Table RLS

**Question:** Does `jobs` table have RLS enabled? If not, job_scores + coach_sessions leak across users.

**Impact:** ALL job-related work (job intake, coaching, resume generation) is BLOCKED until audited.

**Owner:** @SECURITY  
**Timeline:** Audit + report within 24 hours

---

## PHASE 1 DELIVERABLES (Complete)

| Artifact | Producer | Status |
|---|---|---|
| HIREWIRE_MISSION_DAY30.md | RUNTIME | ✅ This file |
| TRUTH_AUDIT_DAY30.md | TRUTH | ✅ Repo ingest, feature classification, OQ answers |
| HIREWIRE_SCOPE_LOCK.md | PM | ✅ MVP scope lock, user stories |
| HIREWIRE_ARCH_MAP.md | ARCHITECT | ✅ Data flow, table mapping, schema drift identification |
| HIREWIRE_DESIGN_V0_PROMPTS.md | DESIGN | ✅ 3 hero screen v0 prompts (Screens 10, 25, 17) |
| HIREWIRE_NEXTJS_SETUP.md | DESIGN | ✅ Next.js structure, config, DEC-002 enforcement |
| HIREWIRE_BACKEND_SPEC.md | BACKEND | ✅ API contracts, RLS verification, error handling |
| HIREWIRE_RECOVERY_MIGRATION.sql | BACKEND | ✅ Idempotent backfills + indexes |
| HIREWIRE_DEC002_EVIDENCE_GATE.md | BACKEND | ✅ Hard gate implementation (n8n + Next.js) |

---

## PHASE 2 — READY TO START (Once Blockers Clear)

### Unblocked Build Areas

1. **Evidence CRUD (Screens 01–06)** — RLS verified ✅
   - FRONTEND can wire immediately once DESIGN + BACKEND specs approved
   - QA test matrix ready
   - Deployment pipeline ready

2. **Job Intake Receiver (Screen 20)** — Thin receiver spec ready ✅
   - Awaits OQ-005 (webhook URL)
   - FRONTEND can wire UI
   - n8n job parser flow exists (17KB, needs credential replacement)

3. **Governance View (Screen 25)** — Read-only spec ready ✅
   - FRONTEND can wire immediately
   - No business logic; no blockers
   - RLS verified

### Blocked Build Areas

1. **Coach API (Screens 10–17)** — 🔴 Blocked on OQ-006
2. **Resume Generation (Screens 22/33–35)** — 🔴 Blocked on OQ-005 + DEC-002 gate wiring
3. **All job-related flows** — 🔴 Blocked on R-001 (jobs table RLS audit)
4. **Fresh dev environment** — 🔴 Blocked on OQ-003 (base migration)

---

## ACCEPTANCE CRITERIA FOR PHASE 1 → PHASE 2 GATE

### REVIEW Sign-Off Required

- ✅ All Phase 1 artifacts meet quality bar
- ✅ No hallucinated specifications
- ✅ All blockers clearly documented with owners + deadlines
- ✅ Unblocked areas are genuinely buildable (no hidden dependencies)

### DATA Delivery Required

- ✅ OQ-003: Base migration schema snapshot replaces 0-byte file

### SECURITY Audit Required

- ✅ R-001: jobs table RLS audit complete + policy recommendations

### RORY Decision Required

- ✅ OQ-006: Coach route decision (migrate vs. amend constraint)
- ✅ OQ-005: n8n webhook URLs supplied

### FRONTEND Readiness Check

- ✅ Team confirms they can wire Screens 01–06, 20, 25 immediately
- ✅ No additional specs needed before handoff

---

## NEXT STEPS

1. **@REVIEW** — Gate all Phase 1 outputs (today)
2. **@DATA** → OQ-003 (within 24h)
3. **@SECURITY** → R-001 (within 24h)
4. **Rory** → OQ-006 + OQ-005 (within 48h)
5. **Phase 2 kickoff** — Once blockers clear

---

**Status:** ✅ PHASE 1 COMPLETE. READY FOR REVIEW GATE.

Last updated: June 9, 2026, 22:20 UTC
