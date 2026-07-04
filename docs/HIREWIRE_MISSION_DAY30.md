# HIREWIRE — MISSION DAY 30
**Product:** HireWire — AI Career OS  
**Date:** June 9, 2026  
**Status:** Phase 1 Kickoff — HOLD on build pending blocker resolution  
**Repo:** rsemeah/HireWireInGroup  
**Supabase project:** endovljmaudnxdzdapmf  

---

## Product Definition

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

## Verified DB State

| Metric | Value | Status |
|---|---|---|
| Total Supabase tables | 110 | VERIFIED (prod) |
| Evidence rows | 225 | VERIFIED (prod) |
| Job analyses | 60 | VERIFIED (prod) |
| Governance runs | 40 | VERIFIED (prod) |
| Shared DB (Amina + HireWire) | endovljmaudnxdzdapmf | VERIFIED — RLS is only isolation layer |

---

## UI Screen Inventory (51 Total)

**Drive folder:** 1tigojYi9V8h_7LHud1uLWdc2VVLVFrBB  
**Master UI Audit v2:** file ID 1dy6iw-pZV6wodG4I0iJZcrrqn4nBxgtJ

### MVP Scope — Evidence Loop
- **01–06**: Evidence vault entry and management
- **10–17** (compressed): Socratic coach loop (entry → interview → completion)
- **20**: Job URL input / analysis trigger
- **21, 23, 24**: Job analysis results
- **25**: Governance view (source evidence traceability)
- **22, 33–35**: Resume draft and editing
- **40–42**: Export and submission

### Delete (not in MVP, not in V2)
- 29, 32, 45, 46, 50, 51

### Defer to V2
- 38, 39, 49

---

## Design System

- **Ticket tags** — color-coded evidence status labels (Red/Green/Yellow/Gray)
- **LOCKED stamp** — diagonal stamp overlay on confirmed/locked evidence claims
- **Diagonal stripes** — incomplete/draft state indicator
- **4-color system:**
  - 🔴 Red — missing evidence / not started
  - 🟢 Green — verified / locked
  - 🟡 Yellow — partial / in progress
  - ⬜ Gray — deferred / not applicable

---

## Hard Constraints

| ID | Constraint | Status |
|---|---|---|
| DEC-001 | n8n owns ALL business logic. Next.js API routes are thin receivers only. | ⛔ VIOLATED — coach route is 24KB of Next.js logic |
| DEC-002 | ZERO hallucinated experience. Every resume claim must trace to a verified evidence_library row. | ⚠️ PARTIAL — soft prompt guards only, no hard gate |
| SEC-001 | GitHub PAT + Supabase anon token: browser JS injection only | ASSUMED |
| SEC-002 | ANTHROPIC_API_KEY + SUPABASE_SERVICE_ROLE_KEY: server-only | ASSUMED |
| SEC-003 | .env.local never committed | ASSUMED |

---

## Stack

- **Frontend:** Next.js App Router + Tailwind CSS + shadcn/ui
- **Database:** Supabase (endovljmaudnxdzdapmf)
- **AI:** Anthropic Claude via gateway (lib/ai/gateway)
- **Automation:** n8n (job intake pipeline), Make.com (supplementary)
- **Inference (job scoring):** Groq
- **Repo:** rsemeah/HireWireInGroup (GitHub)

---

## Open Questions (Must Answer Before Build)

| ID | Question | Answer | Status |
|---|---|---|---|
| OQ-001 | Does the n8n job parser flow exist and run? | YES as file. NO as deployed service. 4 credential placeholders unset. | ⚠️ PARTIAL — TRUTH AUDIT |
| OQ-002 | Is the shared DB (Amina + HireWire) safe? | RLS on evidence_library + job_scores verified. 100+ other tables NOT audited. | ⚠️ PARTIAL |
| OQ-003 | Is the base migration empty? | YES — 0 bytes confirmed (SHA e69de29). Migration chain non-reproducible. | ✅ CONFIRMED BROKEN |
| OQ-004 | Does the hallucination guard enforce DEC-002 at code level? | NO — 3 soft prompt layers only. No hard evidence count gate before resume generation. | ⚠️ PARTIAL — TRUTH AUDIT |
| OQ-005 | What is the n8n instance URL / webhook URL? | UNKNOWN — not in repo. | ❓ UNKNOWN |
| OQ-006 | DEC-001: migrate coach route to n8n or revise constraint? | **PENDING — needs Rory decision.** | 🔴 BLOCKED |

---

## Phase 1 Agent Assignments

| Agent | Task | Gate |
|---|---|---|
| TRUTH | Repo ingest + feature classification + OQ-001 + OQ-004 | ✅ COMPLETE — see TRUTH_AUDIT_DAY30.md |
| PM | Scope lock + user stories + open questions | HIREWIRE_SCOPE_LOCK.md |
| ARCHITECT | Data flow map + schema audit + drift identification | HIREWIRE_ARCH_MAP.md |
| DESIGN | v0 prompts for Screens 10, 25, 17 | REVIEW gate before FRONTEND |
| BACKEND | Supabase RLS audit + baseline recovery migration | Waiting on ARCHITECT output |
| REVIEW | Gate all outputs before phase transition | Continuous |

---

## Day 30 Blockers (TRUTH-Verified)

1. **🔴 DEC-001 decision** — Coach route vs n8n. Rory must decide before BACKEND or ARCHITECT can finalize data flow.
2. **🔴 Empty base migration** — No new schema work until `20260510210753_remote_schema.sql` is replaced with real content.
3. **🔴 Hard evidence gate** — DEC-002 requires a code-level enforcement boundary, not a prompt instruction.
