# HireWire Jobs Pipeline Contract

**Version:** 2026-05-09

---

## Purpose

This document is the canonical, human-readable contract for the `/jobs` page and job pipeline system in HireWire. It defines:
- Core concepts and data flows
- UI architecture and component boundaries
- State machine for job lifecycle
- API/data contract for all job-related actions
- Alignment with CLAUDE.md and repo conventions

---

## 1. Concepts & Data Flows

### **A. Inputs (What populates the pipeline)**
- **Job objects**: Arrive via URL, paste, import, extension, or ATS sync. Normalized to canonical fields.
- **Job enrichment**: AI/async analysis (requirements, fit, evidence, readiness, gaps, next action).
- **User context**: Profile, evidence library, resume/cover letter inventory.
- **System signals**: Quality checks, reminders, analytics counters.

### **B. Outputs (What the pipeline triggers)**
- **Workflow transitions**: All job state changes (with audit trail).
- **Material generation**: Resume/cover letter creation, version binding.
- **Application actions**: Apply, update status, reminders.
- **Analytics/events**: All key actions emit events for insights/coaching.

---

## 2. UI Architecture

### **A. Page Structure**
- **Header**: Title, subtitle, right-side actions (Add Job, Paste Description, Ready Queue)
- **Intake Command Module**: Prominent card for job URL/description intake
- **Pipeline Summary Tiles**: Clickable, filter-oriented tiles (Total, High Fit, Needs Evidence, Ready, Applied)
- **Smart Filters Row**: Filter chips, search, sort dropdown
- **Job Cards**: Rich cards with all key fields, workflow progress, next action, and actions
- **Pipeline Intelligence Panel**: Sticky (desktop) or stacked (mobile) panel for next best actions, blockers, health
- **Empty/Loading/Error States**: Beautiful, actionable, and consistent

### **B. Component Boundaries**
- `JobsPageHeader`
- `JobIntakeCard`
- `PipelineSummaryTiles`
- `JobFiltersBar`
- `OpportunityCard`
- `PipelineIntelligencePanel`
- `WorkflowProgressStrip`

---

## 3. State Machine (Job Lifecycle)

### **A. States**
- `NEW` (just added)
- `PARSED` (basic info extracted)
- `ANALYZED` (AI/requirements/fit computed)
- `EVIDENCE_MAPPED` (evidence matched to requirements)
- `MATERIALS_READY` (resume/cover letter generated)
- `QUALITY_REVIEW` (red team/quality checks passed)
- `READY` (all checks passed, ready to apply)
- `APPLIED` (application sent)
- `ARCHIVED` (no longer active)

### **B. Transitions**
- All transitions must be backend-enforced and auditable.
- Only valid transitions allowed (e.g., cannot skip from NEW to READY).
- Each transition emits an event (for analytics, coaching, audit).
- Each transition can trigger downstream automations (e.g., generate materials, send reminders).

---

## 4. API/Data Contract

### **A. Inputs to Render**
- `Job[]` (canonical job objects)
- `JobEnrichment[]` (analysis, fit, readiness, gaps, next action)
- `UserContext` (profile, evidence, doc inventory)
- `SystemSignals` (quality checks, reminders, analytics)

### **B. Outputs/Mutations**
- `updateJobStatus(jobId, status, reason?)`
- `generateMaterials(jobId, options)`
- `recordApplication(jobId, method, timestamp, docVersionIds)`
- `createReminder(jobId, remindAt, channel)`
- `logEvent(type, payload)`

### **C. Audit Trail**
- Every state change/action is logged with: who, what, when, why

### **D. Prove Fit Drawer Read Contract**

UI drawer/sheet surfaces must not recompute unresolved requirement logic.
Consume the canonical read route instead:

```txt
GET /api/jobs/[id]/evidence-map
```

Response shape:

```ts
type ProveFitEvidenceMapRead = {
  success: true
  matching_complete: boolean
  blocked_requirements: Array<{
    id: string
    text: string
    status: string
    priority: "required" | "preferred" | "keyword"
  }>
  first_unresolved_requirement_id: string | null
  next_action: {
    label: "Prove Fit"
    href: string
    description: string
  } | null
}
```

Contract rules:

- Use `next_action.href` for the primary Prove Fit CTA.
- Do not rebuild requirement anchors in UI when the API provides an href.
- `confirmed` only resolves when backed by `prove_fit_decisions`.
- `auto_mapped` and `skipped` resolve.
- `gap`, `unknown`, `partial`, stale cached `confirmed`, and missing usable
  packet remain unresolved.
- Readiness and apply gates remain owned by `lib/readiness/evaluator.ts` and
  `/ready-to-apply`.

---

## 5. Alignment & Extensibility

- All fields, states, and actions must be present in both TypeScript types and DB schema
- All UI/UX must use these contracts as the single source of truth
- All future features (bulk import, CRM sync, advanced analytics) must extend this contract, not bypass it

---

## 6. Example: Canonical Job Card Data

| Field                | Source                | Required | Notes                                  |
|----------------------|----------------------|----------|----------------------------------------|
| jobId                | jobs table           | Yes      | UUID                                   |
| title                | jobs table           | Yes      |                                        |
| company              | jobs table           | Yes      |                                        |
| location             | jobs table           | No       |                                        |
| sourceType           | jobs table           | Yes      | e.g., LinkedIn, Lever, Manual          |
| sourceUrl            | jobs table           | Yes      |                                        |
| createdAt            | jobs table           | Yes      |                                        |
| status               | jobs table           | Yes      | Enum: see state machine                |
| lastActivityAt       | jobs table           | Yes      |                                        |
| fitScore             | job_scores           | No       | Numeric, 0-100                         |
| fitBand              | job_scores           | No       | Enum: HIGH, MEDIUM, LOW                |
| confidenceScore      | job_scores           | No       | Numeric, 0-1                           |
| gapCount             | job_analyses         | No       | Integer                                |
| readinessStage       | readiness engine     | Yes      | Enum: see state machine                |
| nextAction           | readiness engine     | Yes      | String                                 |
| resumeReady          | jobs/generated_docs  | Yes      | Boolean                                |
| coverLetterReady     | jobs/generated_docs  | Yes      | Boolean                                |
| qualityPassed        | quality_checks       | Yes      | Boolean                                |
| applied              | jobs table           | Yes      | Boolean                                |
| ...                  | ...                  | ...      | ...                                    |

---

## 7. Future-Proofing

- All new intake sources, enrichment, and workflow states must extend this contract.
- All downstream automations (analytics, reminders, coaching) must consume events/actions from this contract.
- All UI/UX changes must reference this doc and the TypeScript types for alignment.

---

*This document is the single source of truth for `/jobs` pipeline logic, data, and UI. All contributors and agents must align to this contract.*
