# HireWire Alpha — Codex Implementation Handoff v2

> **Generated**: 2026-06-03
> **Source**: Real VS Code repo audit at commit `86575b8`
> **Live Supabase**: 131 tables verified

---

## SECTION 1 — FULL REPO REALITY CHECK

### Core API Routes

| Route | Status | Notes |
|-------|--------|-------|
| `app/api/analyze/route.ts` | **REAL** | Full job analysis with AI, writes `job_analyses`, `job_scores` |
| `app/api/generate-documents/route.ts` | **REAL** | Evidence-grounded generation with TruthSerum, writes `jobs.generated_resume`, `jobs.generated_cover_letter`, `jobs.resume_provenance` |
| `app/api/export-docx/route.ts` | **REAL** | DOCX export working |
| `app/api/jobs/[id]/quality-pass/route.ts` | **MISSING** | Quality gate likely in lib/actions or inline |
| `app/api/re-analyze/route.ts` | **REAL** | Re-analysis flow |

### Coach Routes (hirewire-impl merge check)

| Route | Status | Notes |
|-------|--------|-------|
| `app/api/coach/sessions/route.ts` | **REAL** | Creates/lists coach sessions |
| `app/api/coach/sessions/[id]/messages/route.ts` | **MISSING** | Message streaming route not present |
| `app/api/coach/evidence-drafts/[id]/confirm/route.ts` | **MISSING** | Confirm draft route not present |
| `app/api/coach/evidence-drafts/[id]/reject/route.ts` | **MISSING** | Reject draft route not present |

### Dashboard Pages

| Page | Status | Notes |
|------|--------|-------|
| `app/(dashboard)/jobs/page.tsx` | **REAL** | Job list with pipeline |
| `app/(dashboard)/jobs/[id]/page.tsx` | **REAL** | Job detail with readiness, requirements visible |
| `app/(dashboard)/jobs/[id]/documents/page.tsx` | **REAL** | Documents page exists |
| `app/(dashboard)/jobs/[id]/documents/DocumentsEditor.tsx` | **REAL** | Editor component exists |
| `app/(dashboard)/jobs/[id]/evidence-match/page.tsx` | **REAL** | Full evidence matching UI with RequirementCoachModal, GuidedRequirementCoachFlow |
| `app/(dashboard)/evidence/page.tsx` | **REAL** | Evidence vault |

### Lib Files (Trust System)

| File | Status | Notes |
|------|--------|-------|
| `lib/readiness.ts` | **REAL** | Readiness engine |
| `lib/readiness/evaluator.ts` | **REAL** | Canonical readiness evaluator |
| `lib/claim-safety.ts` | **REAL** | Claim safety taxonomy |
| `lib/coach/claim-validator.ts` | **REAL** | 14KB, full claim validation |
| `lib/coach/drift-scorer.ts` | **REAL** | 11KB, voice drift scoring |
| `lib/truthserum.ts` | **REAL** | 809 LOC, provenance tracking |
| `lib/canonical-evidence.ts` | **REAL** | Evidence model |

### Safety Lib

| File | Status | LOC |
|------|--------|-----|
| `lib/safety/injection-detector.ts` | **REAL** | 38KB |
| `lib/safety/content-moderator.ts` | **REAL** | 6KB |
| `lib/safety/pii-detector.ts` | **REAL** | 4KB |

### Coach Lib

| File | Status | Notes |
|------|--------|-------|
| `lib/coach/buildCoachPrompt.ts` | **REAL** | System prompt construction |
| `lib/coach/claim-validator.ts` | **REAL** | Validates user claims |
| `lib/coach/drift-scorer.ts` | **REAL** | Voice consistency |
| `lib/coach/generation-strategy.ts` | **REAL** | Strategy selection |
| `lib/coach/context/` | **REAL** | Context builders |
| `lib/coach/messaging/` | **REAL** | Message templates |

### Evidence Lib

| File | Status | Notes |
|------|--------|-------|
| `lib/evidence/buildEvidenceMapForJob.ts` | **REAL** | 17KB, builds evidence map |
| `lib/evidence/matchRequirementToEvidence.ts` | **REAL** | AI-scored matching |
| `lib/evidence/unresolved-requirements.ts` | **REAL** | Lists unresolved requirements |
| `lib/evidence/mapConfirmedEvidenceToRequirement.ts` | **REAL** | Maps confirmed evidence |

---

## SECTION 2 — LIVE SUPABASE SCHEMA DELTA

### Tables That EXIST (Alpha-critical)

| Table | Status | Notes |
|-------|--------|-------|
| `jobs` | **REAL** | Has `resume_provenance`, `governance_passed`, `governance_drift_score`, `governance_version`, `last_governance_run_id`, `evidence_map` |
| `job_analyses` | **REAL** | Has `requirements_structured`, `strengths_json`, `gaps_json` |
| `job_scores` | **REAL** | Scoring dimensions |
| `evidence_library` | **REAL** | User evidence with `is_user_approved`, `proof_snippet` |
| `coach_sessions` | **REAL** | Coach session tracking |
| `coach_messages` | **REAL** | Coach message history |
| `coach_evidence_drafts` | **REAL** | Draft evidence from coach |
| `prove_fit_decisions` | **REAL** | User proof decisions with `requirement_id`, `evidence_id`, `decision` |
| `generation_governance_runs` | **REAL** | Governance audit trail |
| `generation_quality_checks` | **REAL** | Quality check results |
| `governance_claim_verdicts` | **REAL** | Individual claim verdicts |
| `document_generation_traces` | **REAL** | Generation provenance |
| `job_requirement_models` | **REAL** | Context engine requirement models |

### Tables That DO NOT EXIST

| Table | Status | Alpha Need |
|-------|--------|------------|
| `job_requirements` | **MISSING** | NOT NEEDED — use `job_analyses.requirements_structured` or `job_requirement_models` |
| `generated_claims` | **MISSING** | NOT NEEDED — use `governance_claim_verdicts` + `jobs.resume_provenance` |

### Key Finding

The repo already has:
- `job_analyses.requirements_structured` → structured requirements from analysis
- `job_requirement_models` → context engine's requirement models
- `governance_claim_verdicts` → per-claim verdicts with `claim_text`, `evidence_exists`, `claim_grounded`
- `jobs.resume_provenance` → bullet → evidence provenance
- `prove_fit_decisions` → user's proof confirmations per requirement

**DO NOT CREATE `job_requirements` or `generated_claims` tables.** The data structures already exist.

---

## SECTION 3 — WHAT IS ACTUALLY MISSING FOR ALPHA

### P0: Critical Path Blockers

| Item | Status | Action |
|------|--------|--------|
| Coach message streaming route | **MISSING** | Add `app/api/coach/sessions/[sessionId]/messages/route.ts` |
| Coach evidence draft confirm/reject | **MISSING** | Add confirm/reject routes |
| GovernancePanel UI component | **PARTIAL** | Governance data exists, UI to display it on bullet click is missing |
| Verification badges on bullets | **MISSING** | DocumentsEditor shows bullets but no verification status badges |

### P1: Proof Loop Visibility

| Item | Current State | Alpha Need |
|------|---------------|------------|
| Requirements list on job detail | Shows via evidence-match link | Already visible |
| Evidence match page | **REAL** — has RequirementCoachModal, GuidedRequirementCoachFlow | Working |
| Bullet → Evidence trace | Data in `resume_provenance` | Need UI to display on click |
| Requirement → Evidence linkage | Data in `prove_fit_decisions` | Need UI to surface |

---

## SECTION 4 — CODEX IMPLEMENTATION SCOPE

### DO NOT TOUCH

- `app/api/generate-documents/route.ts` — already has evidence-grounded generation, TruthSerum
- `jobs.generated_resume`, `jobs.generated_cover_letter`, `jobs.resume_provenance` — canonical fields
- `lib/readiness.ts`, `lib/readiness/evaluator.ts` — canonical readiness
- `lib/truthserum.ts` — provenance tracking
- `lib/claim-safety.ts` — trust taxonomy
- Billing/Stripe integration
- Export unless compatibility required

### TARGETED ADDITIONS

#### 1. Coach Message Streaming Route

**File**: `app/api/coach/sessions/[sessionId]/messages/route.ts`
**Reads**: `coach_sessions`, `coach_messages`, `evidence_library`, `job_analyses`
**Writes**: `coach_messages`, `coach_evidence_drafts`
**User sees**: Streaming coach responses in RequirementCoachModal

#### 2. Coach Evidence Draft Confirm Route

**File**: `app/api/coach/evidence-drafts/[draftId]/confirm/route.ts`
**Reads**: `coach_evidence_drafts`
**Writes**: `evidence_library` (creates confirmed evidence), `prove_fit_decisions`
**User sees**: "Proof locked in" confirmation

#### 3. Coach Evidence Draft Reject Route

**File**: `app/api/coach/evidence-drafts/[draftId]/reject/route.ts`
**Reads**: `coach_evidence_drafts`
**Writes**: Updates draft status to `rejected`
**User sees**: Draft dismissed, can try again

#### 4. GovernancePanel Component

**File**: `components/documents/GovernancePanel.tsx`
**Reads**: `governance_claim_verdicts`, `jobs.resume_provenance`, `evidence_library`
**Displays**: Requirement text, claim text, evidence snippet, source type, verification status
**User sees**: Modal/drawer when clicking a bullet showing full trace

#### 5. Verification Badges in DocumentsEditor

**File**: `app/(dashboard)/jobs/[id]/documents/DocumentsEditor.tsx`
**Reads**: `governance_claim_verdicts` for the job
**Displays**: Green/amber/red badge per bullet based on `claim_grounded`, `evidence_exists`
**User sees**: Visual trust indicators on each resume bullet

---

## SECTION 5 — TRUST AND VERIFICATION RULES

### Existing Trust Statuses (from lib/claim-safety.ts)

Use these, do not invent new ones:
- `source_verified`
- `user_confirmed`
- `normalized_rewrite`
- `plausible_inferred`
- `unsupported_blocked`

### Badge Mapping

| Status | Badge Color | Condition |
|--------|-------------|-----------|
| Green | `status-ready` | `claim_grounded=true` AND `evidence_exists=true` |
| Amber | `status-analyzing` | `claim_grounded=true` AND `evidence_exists=false` |
| Red | `status-blocked` | `claim_grounded=false` |
| Gray | `status-pending` | No verdict record |

### Hard Rules

- Green CANNOT be AI confidence alone — requires source verified or user confirmed
- If `requirement_id` is missing, do NOT show "Requirement Verified"
- If `evidence_id` is missing, do NOT show "Source Verified"
- Never hide broken provenance — show `unsupported` or `missing_trace`

---

## SECTION 6 — CODEX IMPLEMENTATION ORDER

1. **Verify live Supabase schema** — confirm coach tables exist
2. **Add coach message streaming route** — enables coach chat
3. **Add coach evidence draft confirm/reject routes** — enables proof locking
4. **Add GovernancePanel component** — shows trace on bullet click
5. **Add verification badges to DocumentsEditor** — visual trust indicators
6. **Test end-to-end proof loop**

---

## SECTION 7 — WHAT CODEX MUST NOT DO

- Rewrite `generate-documents` from scratch
- Remove TruthSerum logic
- Remove `jobs.resume_provenance`
- Create `job_requirements` table (use existing structures)
- Create `generated_claims` table (use `governance_claim_verdicts`)
- Create `proof_cases` or `proof_statements` tables
- Create `claim_evidence_links` table
- Build Career DNA, Market Fit, Skills Intelligence
- Build Offer Tracking, Outcomes Analytics
- Build Interview Prep Center
- Build duplicate dashboards
- Change billing
- Show green verification without data backing it

---

## SECTION 8 — FINAL CODEX START COMMAND

```
Read docs/HIREWIRE_ALPHA_CODEX_HANDOFF_v2.md, docs/HIREWIRE_ALPHA_FRONTEND_SCOPE.md, and docs/HIREWIRE_ALPHA_SCHEMA_MIGRATIONS.md.

Do not implement yet.

First inspect the repo and live Supabase schema, then return your exact implementation plan with:
- files to create/modify
- routes affected
- UI components
- tests
- risks
- demo path

Do not rewrite generate-documents.
Do not build dashboards.
Do not add new abstractions.
Do not create job_requirements or generated_claims tables.

Make the existing proof loop visible and real by adding:
1. Coach message streaming route
2. Coach evidence draft confirm/reject routes
3. GovernancePanel component for bullet click trace
4. Verification badges in DocumentsEditor
```
