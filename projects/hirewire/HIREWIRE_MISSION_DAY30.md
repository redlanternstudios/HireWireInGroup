# HIREWIRE — MISSION BRIEF DAY 30 (FULL VERSION)
**Product:** HireWire — AI Career OS
**Date:** 2026-06-09
**Status:** Phase 1 Kickoff — HOLD on build pending blocker resolution
**Repo:** rsemeah/HireWireInGroup
**Supabase project:** endovljmaudnxdzdapmf
**Produced by:** TECHWRITER (canonical documentation commit)
**Classification:** TECHNICAL/SPEC → /docs/technical/hirewire/

---

## 1. PRODUCT DEFINITION

HireWire is an AI Career OS built around a single non-negotiable principle: **every resume claim must trace to verified user-provided evidence.** No hallucinated experience. No invented bullet points.

**Core loop:**
```
Evidence Vault → Socratic Coach → Resume Generation → Governance View
```

1. **Evidence Vault** — User uploads/logs raw career evidence (achievements, projects, metrics, testimonials)
2. **Socratic Coach** — AI interviews user against a specific job, extracts proof of fit, locks evidence
3. **Resume Generator** — Composes claims *only* from locked evidence items
4. **Governance View** — Every resume bullet is traceable to a source evidence item. LOCKED stamp on confirmed claims.

---

## 2. VERIFIED DB STATE (as of Day 30)

| Metric | Value | Status |
|---|---|---|
| Total Supabase tables | 110 | VERIFIED (prod) |
| Evidence rows | 225 | VERIFIED (prod) |
| Job analyses | 60 | VERIFIED (prod) |
| Governance runs | 40 | VERIFIED (prod) |
| Shared DB (Amina + HireWire) | endovljmaudnxdzdapmf | VERIFIED — RLS is only isolation layer |

**Note:** `jobs` table RLS unverified (R-001). All job-related work halted pending SECURITY audit.

---

## 3. UI SCREEN INVENTORY (51 Total)

**Drive folder:** 1tigojYi9V8h_7LHud1uLWdc2VVLVFrBB
**Master UI Audit v2:** file ID 1dy6iw-pZV6wodG4I0iJZcrrqn4nBxgtJ

### MVP Scope — Evidence Loop

| Screen | Name | Purpose | Build State |
|---|---|---|---|
| 01 | Evidence Vault — Empty State | First-time user entry | CONCEPT ONLY |
| 02 | Add Evidence — Form | Capture raw evidence | CONCEPT ONLY |
| 03 | Evidence Vault — Populated | Browse evidence items | CONCEPT ONLY |
| 04 | Evidence Item — Detail | View single evidence | CONCEPT ONLY |
| 05 | Evidence Edit | Edit existing evidence | CONCEPT ONLY |
| 06 | Evidence Filter/Search | Browse by category | CONCEPT ONLY |
| 10 | PROVE YOUR FIT | Socratic coach entry, job URL | PROTOTYPE |
| 11-16 | Coach Interview Loop | Q&A session flow | CONCEPT ONLY |
| 17 | PROOF LOCKED IN | Coach completion, evidence confirmation | CONCEPT ONLY |
| 20 | Job URL Input | Trigger job analysis | CONCEPT ONLY |
| 21 | Job Analysis — Loading | Analysis in progress | CONCEPT ONLY |
| 23 | Job Analysis — Results | Job requirements breakdown | CONCEPT ONLY |
| 24 | Job Analysis — Requirements | Mapped evidence readiness | CONCEPT ONLY |
| 25 | Governance View | Every bullet → source evidence, LOCKED stamp | CONCEPT ONLY |
| 22 | Resume Draft | AI-generated resume draft | CONCEPT ONLY |
| 33 | Resume Edit — Bullet | Edit individual bullet | CONCEPT ONLY |
| 34 | Resume Edit — Section | Edit resume section | CONCEPT ONLY |
| 35 | Resume Preview | Full resume preview | CONCEPT ONLY |
| 40 | Export — PDF | Generate PDF | CONCEPT ONLY |
| 41 | Export — Submission | Job application submission | CONCEPT ONLY |
| 42 | Submission Confirmation | Post-submission state | CONCEPT ONLY |

### Screens to DELETE (Not in MVP or V2)
- 29, 32, 45, 46, 50, 51

### Screens to Defer to V2
- 38, 39, 49

---

## 4. DESIGN SYSTEM

### Colors (HireWire Ticket Tags — 4-Color System)
- 🔴 **Red (#EF4444)** — Risk / Missing evidence / Not started
- 🟢 **Green (#22C55E)** — Verified / Locked / Confirmed
- 🟡 **Yellow (#EAB308)** — In Progress / Draft / Partial match
- ⬜ **Gray (#9CA3AF)** — Deferred / N/A / Inactive

### Visual Patterns
- **LOCKED Stamp:** Diagonal text overlay "LOCKED" at 45° rotation, semi-transparent white, on confirmed evidence cards
- **Diagonal Stripes:** 45° repeating pattern overlay on draft/incomplete states
- **Card States:** Left border (4px) in ticket tag color + optional LOCKED stamp + optional stripe overlay

### Typography
- **Display:** Canela (warm serif) — H1, H2
- **Body:** Inter (sans-serif) — Body copy, UI labels
- **Weight hierarchy:** 600 (Bold) for headers, 400 (Regular) for body

---

## 5. HARD CONSTRAINTS (NON-NEGOTIABLE)

| ID | Constraint | Current Status |
|---|---|---|
| DEC-001 | n8n owns ALL business logic. Next.js API routes are thin receivers only (≤ 30 lines). | ⛔ **VIOLATED** — `app/api/coach/route.ts` = 24,297 bytes of Next.js business logic |
| DEC-002 | ZERO hallucinated experience. Every resume claim must trace to a verified evidence_library row. | ⚠️ **PARTIAL** — 3 soft prompt guards only, no hard code-level gate |
| SEC-001 | GitHub PAT + Supabase anon token: browser JS injection only | ASSUMED |
| SEC-002 | ANTHROPIC_API_KEY + SUPABASE_SERVICE_ROLE_KEY: server-only, never in browser | ASSUMED |
| SEC-003 | .env.local never committed to git | ASSUMED |

---

## 6. STACK

- **Frontend:** Next.js App Router + Tailwind CSS + shadcn/ui
- **Database:** Supabase (endovljmaudnxdzdapmf) — shared with Amina
- **AI inference:** Anthropic Claude via lib/ai/gateway
- **Job scoring:** Groq
- **Automation:** n8n (job intake pipeline, coach logic target), Make.com (supplementary SaaS-to-SaaS)
- **Repo:** rsemeah/HireWireInGroup (GitHub)
- **Analytics:** PostHog (critical events), Sentry (errors)

---

## 7. OPEN QUESTIONS (Must Answer Before Build)

| ID | Question | Answer (Day 30) | Status |
|---|---|---|---|
| OQ-001 | Does the n8n job parser flow exist and run? | File exists (17KB, 15-node pipeline). NOT deployed — 4 credential placeholders unset. | ⚠️ PARTIAL |
| OQ-002 | Is the shared DB (Amina + HireWire) safe for concurrent use? | RLS on evidence_library + job_scores verified. ~108 other tables NOT audited. | ⚠️ PARTIAL |
| OQ-003 | Is the base migration reproducible? | NO — `20260510210753_remote_schema.sql` = 0 bytes (SHA e69de29). | ✅ CONFIRMED BROKEN |
| OQ-004 | Does the hallucination guard enforce DEC-002 at code level? | NO — 3 soft prompt layers only. No hard gate. | ⚠️ PARTIAL |
| OQ-005 | What is the n8n instance URL / webhook URL? | UNKNOWN — not in repo. | 🔴 **RORY MUST PROVIDE** |
| OQ-006 | DEC-001: migrate coach route to n8n OR revise constraint? | PENDING. | 🔴 **RORY MUST DECIDE** |

---

## 8. PHASE 1 AGENT ASSIGNMENTS & OUTPUTS

| Agent | Task | Output | Status |
|---|---|---|---|
| TRUTH | Repo ingest + feature classification + OQ-001 + OQ-004 | TRUTH_AUDIT_DAY30.md | ✅ COMPLETE |
| PM | Scope lock + user stories | HIREWIRE_SCOPE_LOCK.md | ✅ COMPLETE |
| ARCHITECT | Data flow map + schema audit | HIREWIRE_ARCH_MAP.md | ✅ COMPLETE |
| DESIGN | v0 prompts for Screens 10, 25, 17 | HIREWIRE_DESIGN_V0_PROMPTS.md | ✅ APPROVED |
| BACKEND | RLS audit + migration + spec | HIREWIRE_BACKEND_SPEC.md + HIREWIRE_RECOVERY_MIGRATION.sql | ✅ APPROVED (unblocked routes) |
| FRONTEND | 3 hero screen components + API route stubs | GitHub commits d6f2503, e96b5ed, 2e7cc47 | ⚠️ 2 routes flagged |
| REVIEW | Gate all outputs | REVIEW_PHASE1_FINAL_VERDICT.md | 🚩 GATE ACTIVE |
| QA | Code inspection + final gate | QA_PHASE1_FINAL_VERDICT.md | ⛔ HOLD |
| TECHWRITER | Debrief + decision log | HIREWIRE_PHASE1_DEBRIEF_20260609.md + HIREWIRE_DECISION_LOG_20260609.md | ✅ COMMITTED |

---

## 9. DAY 30 BLOCKERS (TRUTH-VERIFIED)

| # | Blocker | Owner | Severity |
|---|---|---|---|
| 1 | DEC-001 decision — Coach route vs n8n | Rory | 🔴 CRITICAL |
| 2 | Empty base migration — 0 bytes, fresh envs cannot bootstrap | DATA | 🔴 CRITICAL |
| 3 | Hard evidence gate missing — DEC-002 soft-only | BACKEND | 🔴 CRITICAL |
| 4 | `jobs` table RLS unverified (R-001) | SECURITY | 🔴 CRITICAL |
| 5 | n8n webhook URLs not in repo (OQ-005) | Rory/Ops | 🔴 CRITICAL |
| 6 | SERVICE_ROLE_KEY exposed in `/api/coach/intake` | BACKEND | 🔴 CRITICAL |

---

## 10. UNBLOCKED BUILD AREAS (Start Now)

- **Screens 01–06** — Evidence CRUD. RLS verified, API spec approved, v0 prompts ready.
- **Screen 25** — Governance View. Read-only query, REVIEW approved, v0 prompt ready.
- **Schema snapshot** — DATA can run `supabase db dump` immediately.

---

**Canonical path:** `projects/hirewire/HIREWIRE_MISSION_DAY30.md`
**Signed:** TECHWRITER | **Date:** 2026-06-09
