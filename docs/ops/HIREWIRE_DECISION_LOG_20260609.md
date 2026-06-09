# DECISION LOG — HIREWIRE BUILD DAY 30

**Product:** HireWire  
**Session:** Build Day 30 — Phase 1  
**Date:** 2026-06-09  
**Produced by:** TECHWRITER  
**Classification:** KNOWLEDGE/DECISION

---

## DEC-001 — n8n Owns ALL Business Logic

| Field | Value |
|---|---|
| **Date** | Pre-Day 30 (existing constraint) |
| **Decision** | All business logic in HireWire lives in n8n. API routes in Next.js are thin receivers only (≤ 30 lines). |
| **Made By** | Rory (via mission brief) |
| **Rationale** | Single source of truth for logic. Prevents split-brain architecture. n8n provides visibility, retry, and orchestration. |
| **Impact** | `app/api/coach/route.ts` (24,297 bytes) is a LIVE VIOLATION. Must be migrated or formally scoped as exception. |
| **Supersedes** | Nothing — original constraint. |
| **Status** | ⚠️ VIOLATED — OQ-006 decision required from Rory before coach route work proceeds. |

---

## DEC-002 — ZERO Hallucinated Experience

| Field | Value |
|---|---|
| **Date** | Pre-Day 30 (existing constraint) |
| **Decision** | Every resume claim must trace to user-provided, verified evidence. No AI invention of experience. |
| **Made By** | Rory (via mission brief) |
| **Rationale** | Legal/ethical risk of fabricated credentials. Product trust depends on evidence traceability. |
| **Impact** | Hard gate required: `COUNT(coach_evidence_drafts WHERE status='confirmed' AND job_id=?) > 0` before any resume generation. Current implementation is soft-only (prompt instruction). |
| **Supersedes** | Nothing — original constraint. |
| **Status** | ⚠️ PARTIAL — Soft controls exist. Hard code-level gate NOT yet implemented. BACKEND must build before Screen 22. |

---

## DEC-003 — Shared DB Isolation via RLS

| Field | Value |
|---|---|
| **Date** | 2026-06-09 (Day 30) |
| **Decision** | Supabase project `endovljmaudnxdzdapmf` is shared by Amina and HireWire. RLS (`auth.uid() = user_id`) is the only isolation layer. All HireWire tables must have RLS enabled before any data touches prod. |
| **Made By** | ARCHITECT (HIREWIRE_ARCH_MAP.md v1.0.0) |
| **Rationale** | Amina user data must never be readable by HireWire queries or vice versa. RLS is the enforcement boundary. |
| **Impact** | SECURITY must audit all 110 tables before Phase 2. `jobs` table (R-001) is highest priority — unverified as of Day 30. |
| **Supersedes** | Nothing. |
| **Status** | ⚠️ PARTIAL — `evidence_library` + `job_scores` RLS verified. `jobs` and ~108 other tables unaudited. |

---

## DEC-004 — Migration Chain Integrity (No Empty Base)

| Field | Value |
|---|---|
| **Date** | 2026-06-09 (Day 30) |
| **Decision** | Do NOT modify base migration `20260510210753_remote_schema.sql` (0 bytes). Instead, run `supabase db dump` from prod and store as read-only reference artifact `supabase/schema_snapshot_20260609.sql`. Migration chain continues forward from Day 27 backfill. |
| **Made By** | ARCHITECT (ADR-004 in HIREWIRE_ARCH_MAP.md) |
| **Rationale** | Modifying history is risky. A canonical dump as reference artifact solves the reproducibility problem without touching the chain. |
| **Impact** | DATA must run the dump. Unblocks local dev and CI schema validation. |
| **Supersedes** | Nothing. New decision. |
| **Status** | ⏳ PENDING — DATA must execute. |

---

## DEC-005 — Governance Drift Threshold = 65

| Field | Value |
|---|---|
| **Date** | Pre-Day 30 (verified in migration comments, Day 30) |
| **Decision** | `drift_score >= 65` blocks document persistence. `drift_score < 65` = PASSED. |
| **Made By** | Verified in `20260518120000_harden_generation_governance_persistence.sql` (ARCHITECT) |
| **Rationale** | Canonical threshold for acceptable evidence-to-claim drift. |
| **Impact** | Resume generation n8n flow must check this before persisting. Screen 25 displays drift_score with RED badge at >= 65. |
| **Supersedes** | Nothing — pre-existing in schema. |
| **Status** | ✅ VERIFIED AND CANONICAL — do not change without formal ADR update. |

---

## OPEN QUESTIONS — REQUIRING RORY DECISION

| ID | Question | Why It Blocks | Target |
|---|---|---|---|
| OQ-006 | DEC-001: Migrate `app/api/coach/route.ts` to n8n (RECOMMENDED) OR formally carve an exception? | ALL coach-related build. BACKEND cannot finalize API surface. ARCHITECT cannot complete data flow. FRONTEND cannot wire Screens 10–17. | Before Phase 2 |
| OQ-005 | Provide n8n instance URL + webhook URLs (job-parser, lock-evidence, resume-generation) | Cannot wire any thin receivers without real webhook URLs | Within 48h |

---

**Signed:** TECHWRITER  
**Date:** 2026-06-09  
**Next review:** After Rory decisions on OQ-006 + OQ-005
