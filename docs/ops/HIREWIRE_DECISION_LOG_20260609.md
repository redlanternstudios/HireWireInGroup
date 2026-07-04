# HIREWIRE — DECISION LOG

**Product:** HireWire  
**Date Range:** 2026-06-09  
**Maintained By:** TECHWRITER  
**Last Updated:** 2026-06-09T01:28:46Z

---

## DECISION ENTRIES

### DEC-001

| Field | Value |
|---|---|
| **Date** | 2026-06-09 |
| **Decision** | n8n owns ALL business logic. No exceptions without explicit Rory sign-off. |
| **Made By** | Rory (RedLantern Studios) |
| **Rationale** | Single logic layer prevents drift, enables debugging, centralizes orchestration. |
| **Impact** | All API routes must be thin receivers (≤30 lines). Any route containing business logic is a DEC-001 violation. |
| **Status** | ACTIVE |
| **Supersedes** | N/A |

---

### DEC-002

| Field | Value |
|---|---|
| **Date** | 2026-06-09 |
| **Decision** | Zero hallucinated experience. Resume generation requires verified evidence source for every claim. |
| **Made By** | Rory (RedLantern Studios) |
| **Rationale** | Product integrity — HireWire's value proposition is provable work history. Unverified claims defeat the product. |
| **Impact** | `/api/resume/generate` must return HTTP 412 if `evidence_count = 0` or any claim lacks a verified source. Hard gate, no override. |
| **Status** | ACTIVE — spec complete (HIREWIRE_DEC002_EVIDENCE_GATE.md), implementation PENDING |
| **Supersedes** | N/A |

---

### DEC-003 (Phase 2 Kickoff)

| Field | Value |
|---|---|
| **Date** | 2026-06-09 |
| **Decision** | Move to Phase 2 and beyond. |
| **Made By** | Rory (RedLantern Studios) |
| **Rationale** | Phase 1 artifacts complete. REVIEW gate closed. QA gate closed. Phase 1 exit criteria met. |
| **Impact** | Build streams A (Evidence CRUD, Governance, Export) open immediately. Stream B (Coach, Resume) remains blocked on OQ-006 and OQ-005. Stream C (SEC fix) is pre-requisite. |
| **Status** | ACTIVE |
| **Supersedes** | N/A |

---

## OPEN QUESTIONS (Not Yet Decisions)

| ID | Question | Owner | Status |
|---|---|---|---|
| OQ-006 | Coach route: migrate to n8n or formal DEC-001 exception? | Rory | OPEN — blocks Screens 10–17 |
| OQ-005 | n8n webhook URLs (job-parser, lock-evidence, resume-generation) | Rory/Ops | OPEN — blocks resume gen |
| OQ-003 | Base migration schema dump for fresh dev env | DATA/DEPLOY | PARTIALLY ANSWERED — migration file exists, DEPLOY to run supabase db dump |
| R-001 | Jobs table RLS audit | SECURITY | IN PROGRESS — query provided by DATA |

---

## SECURITY FINDINGS (Active)

| ID | Finding | File | Status |
|---|---|---|---|
| SEC-DAY30-001 | SERVICE_ROLE_KEY exposed, no auth check before mutation | app/api/coach/intake/route.ts | 🔴 LIVE ON MAIN — BACKEND fix pending |
| SEC-DAY30-002 | SERVICE_ROLE_KEY misused in lock-evidence route | app/api/coach/lock-evidence/route.ts | 🔴 LIVE ON MAIN — BACKEND fix pending |

Corrected code in workspace: `REVIEW_PHASE1_CORRECTED_COACH_ROUTES.md`
