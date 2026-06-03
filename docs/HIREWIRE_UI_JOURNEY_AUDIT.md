# HireWire UI Journey — Complete Audit

**Generated:** June 3, 2026  
**Branch:** v0/rsemeah-841a07b7  
**Status:** LIVE (verified against actual code)

---

## Navigation Structure

### Primary Sidebar (always visible)
| Item | Route | Icon | Status |
|------|-------|------|--------|
| Home | `/dashboard` | Grid2X2 | LIVE |
| Opportunities | `/jobs` | Briefcase | LIVE |
| Coach | `/coach` | Sparkles | LIVE (PRO badge) |
| Documents | `/documents` | FileText | LIVE |
| Applications | `/applications` | Send | LIVE |
| **Add Job** (CTA button) | `/jobs?add=true` | Plus | LIVE |

### Secondary Sidebar
| Item | Route | Icon | Status |
|------|-------|------|--------|
| Career Context | `/evidence` | Library | LIVE |
| Insights | `/analytics` | BarChart3 | LIVE (PRO badge) |
| Activity Log | `/logs` | History | LIVE |

### Footer Sidebar
| Item | Route | Icon | Status |
|------|-------|------|--------|
| Profile | `/profile` | User | LIVE |
| Billing | `/billing` | CreditCard | LIVE |
| Settings | `/settings` | Settings | LIVE |

---

## Core User Journey

### Stage 1: Dashboard (`/dashboard`)

**Purpose:** Hub showing pipeline overview, next actions, recent activity

| Element | Action | Endpoint/Destination | Status |
|---------|--------|---------------------|--------|
| "Add first job" button | Navigate | `/jobs?add=true` | LIVE |
| Re-entry action card | Navigate | `{readiness.nextAction.href}` — dynamic | LIVE |
| "Add another job" button | Navigate | `/jobs?add=true` | LIVE |
| "View all jobs" link | Navigate | `/jobs` | LIVE |
| Job title link (in list) | Navigate | `/jobs/{id}` | LIVE |
| "Ready to apply" section link | Navigate | `/ready-to-apply` | LIVE |
| Activity event links | Navigate | `/jobs/{event.job_id}` | LIVE |
| "View full activity log" | Navigate | `/logs` | LIVE |

---

### Stage 2: Jobs List (`/jobs`)

**Purpose:** Pipeline view of all jobs, quick add

| Element | Action | Endpoint/Destination | Status |
|---------|--------|---------------------|--------|
| Job input form | Server Action | `createJob` (lib/actions/jobs.ts) | LIVE |
| Job card click | Navigate | `/jobs/{id}` | LIVE |
| Status badge | Display only | — | LIVE |
| Pipeline tabs (All/Active/Applied/etc) | Client filter | — | LIVE |

---

### Stage 3: Job Detail (`/jobs/[id]`)

**Purpose:** Single job workspace — analyze, prove fit, generate, apply

| Element | Action | Endpoint/Destination | Status |
|---------|--------|---------------------|--------|
| Back breadcrumb | Navigate | `/jobs` | LIVE |
| "View posting" link | External | `{job.job_url}` | LIVE |
| **AnalyzeJobButton** | POST | `/api/re-analyze` | LIVE |
| **Next Action CTA** | Navigate | Dynamic from `readiness.nextAction.href` | LIVE |
| **GenerateButton** | POST | `/api/generate-documents` | LIVE |
| "Upgrade to Pro" link | Navigate | `/billing` | LIVE |
| View Applications link | Navigate | `/applications` | LIVE |

**AnalyzeJobButton behavior:**
- Calls `POST /api/re-analyze` with `{ jobId }`
- On success: revalidates path, shows success toast
- On error: shows error toast with message

**GenerateButton behavior:**
- Calls `POST /api/generate-documents` with `{ jobId }`
- Returns one of:
  - `{ success: true }` — redirects to `/jobs/{id}/documents`
  - `{ error: "prove_fit_required", ... }` — shows drawer
  - `{ error: "coach_step_required", ... }` — shows drawer
  - `{ error: "generation_limit_reached", ... }` — shows upgrade prompt
  - `{ error: "governance_blocked", ... }` — shows block reason

---

### Stage 4: Evidence Match / Prove Fit (`/jobs/[id]/evidence-match`)

**Purpose:** Dark "trust surface" for matching evidence to requirements

| Element | Action | Endpoint/Destination | Status |
|---------|--------|---------------------|--------|
| Back breadcrumb | Navigate | `/jobs/{id}` | LIVE |
| **RebuildEvidenceMapButton** | POST | `/api/jobs/{id}/rebuild-evidence-map` | LIVE |
| Requirement card expand | Client toggle | — | LIVE |
| "Start Match Interview" button | Opens modal | `MatchInterviewModal` | LIVE |
| "Continue to job" button | Navigate | `/jobs/{id}` | LIVE |
| **AnalyzeJobButton** (if no analysis) | POST | `/api/re-analyze` | LIVE |

**RebuildEvidenceMapButton behavior:**
- Calls `POST /api/jobs/{id}/rebuild-evidence-map`
- Revalidates evidence map and refreshes page

---

### Stage 5: Match Interview Modal (`MatchInterviewModal`)

**Purpose:** Coach-guided evidence confirmation, one requirement at a time

| Element | Action | Endpoint/Destination | Status |
|---------|--------|---------------------|--------|
| Chat input | POST (streaming) | `/api/coach/sessions/{id}/messages` | LIVE |
| "Confirm evidence" tool | POST | `/api/coach/evidence-drafts/{id}/confirm` | LIVE |
| "Skip requirement" tool | POST | `/api/jobs/{id}/coach-step` | LIVE |
| Close modal (X) | Client | — | LIVE |

**Coach session flow:**
1. Creates session via `POST /api/coach/sessions`
2. Streams messages via `POST /api/coach/sessions/{id}/messages`
3. Tool calls handled via `POST /api/coach/confirm-tool-call`

---

### Stage 6: Documents Editor (`/jobs/[id]/documents`)

**Purpose:** Review and edit generated resume/cover letter

| Element | Action | Endpoint/Destination | Status |
|---------|--------|---------------------|--------|
| Back breadcrumb | Navigate | `/jobs/{id}` | LIVE |
| **GenerateButton** (if no docs) | POST | `/api/generate-documents` | LIVE |
| **DocumentsEditor** | Client-side editing | — | LIVE |
| "Export DOCX" button | POST | `/api/export-docx` | LIVE |
| "Check ready to apply" link | Navigate | `/ready-to-apply?jobId={id}` | LIVE |
| "Back to job" link | Navigate | `/jobs/{id}` | LIVE |

**DocumentsEditor behavior:**
- In-place editing of resume_text and cover_letter_text
- Saves via `updateDocuments` server action (lib/actions/documents.ts)
- Package acceptance via `acceptApplicationPackage` (lib/actions/package.ts)

---

### Stage 7: Ready to Apply (`/ready-to-apply`)

**Purpose:** Final gate before application — shows readiness checklist

| Element | Action | Endpoint/Destination | Status |
|---------|--------|---------------------|--------|
| "Add jobs" button | Navigate | `/jobs` | LIVE |
| "Review docs" button | Navigate | `/jobs/{id}/documents` | LIVE |
| **MarkAsAppliedButton** | Server Action | `applyToJob` (lib/actions/apply.ts) | LIVE |
| "Override readiness" button | Server Action | `applyToJob(id, true, reason)` | LIVE |
| Next action CTA (blocked jobs) | Navigate | `{readiness.nextAction.href}` | LIVE |

**MarkAsAppliedButton behavior:**
- Ready jobs: Single click opens confirmation dialog
- Blocked jobs: Opens override dialog with reason field
- Calls `applyToJob(jobId, override?, reason?)`
- On success: updates job status to "applied", redirects to `/applications`

---

### Stage 8: Applications (`/applications`)

**Purpose:** Track applied jobs, outcomes, learnings

| Element | Action | Endpoint/Destination | Status |
|---------|--------|---------------------|--------|
| Application card | Display | — | LIVE |
| "Record outcome" button | Opens dialog | — | LIVE |
| Outcome dropdown | POST | `/api/jobs/{id}/outcome` | LIVE |
| "Add jobs" link | Navigate | `/jobs` | LIVE |

---

## Secondary Screens

### Coach (`/coach`)

| Element | Action | Endpoint/Destination | Status |
|---------|--------|---------------------|--------|
| Chat input | POST (streaming) | `/api/coach/sessions/{id}/messages` | LIVE |
| Pipeline job links | Navigate | `/jobs/{id}` | LIVE |
| Activity event links | Navigate | `/jobs/{id}` | LIVE |
| "View full activity log" | Navigate | `/logs` | LIVE |

---

### Career Context / Evidence (`/evidence`)

| Element | Action | Endpoint/Destination | Status |
|---------|--------|---------------------|--------|
| "Add evidence" button | Opens modal | `AddEvidenceModal` | LIVE |
| Evidence card actions | Server Actions | `lib/actions/evidence.ts` | LIVE |
| Import from LinkedIn | POST | `/api/linkedin/import` | LIVE |
| Import from resume | POST | `/api/resume/upload` | LIVE |
| Export evidence | GET | `/api/evidence/export` | LIVE |

---

### Analytics (`/analytics`)

| Element | Action | Endpoint/Destination | Status |
|---------|--------|---------------------|--------|
| Pipeline summary | Display | — | LIVE |
| Score distribution (PRO) | Display (blur overlay) | — | LIVE |
| Outcomes breakdown (PRO) | Display (blur overlay) | — | LIVE |
| "Upgrade to Pro" link | Navigate | `/billing` | LIVE |
| "Add jobs" link | Navigate | `/jobs` | LIVE |

---

### Billing (`/billing`)

| Element | Action | Endpoint/Destination | Status |
|---------|--------|---------------------|--------|
| "Upgrade to Pro" button | POST | `/api/stripe/checkout` | LIVE |
| "Manage subscription" button | POST | `/api/stripe/portal` | LIVE |
| Plan comparison | Display | — | LIVE |

---

### Integrity Suite (`/integrity/*`)

| Element | Action | Endpoint/Destination | Status |
|---------|--------|---------------------|--------|
| AI Content check | POST | `/api/integrity/ai-content` | LIVE |
| Consistency check | POST | `/api/integrity/consistency` | LIVE |
| Gap analysis | POST | `/api/integrity/gap` | LIVE |
| Verification | POST | `/api/integrity/verification` | LIVE |
| Overall score | POST | `/api/integrity/score` | LIVE |

---

## API Routes Summary

### Core Pipeline
| Route | Method | Purpose | Status |
|-------|--------|---------|--------|
| `/api/analyze` | POST | Initial job analysis | LIVE |
| `/api/re-analyze` | POST | Re-analyze existing job | LIVE |
| `/api/generate-documents` | POST | Generate resume + cover letter | LIVE |
| `/api/export-docx` | POST | Export to Word | LIVE |
| `/api/jobs/[id]/evidence-map` | GET/POST | Get/update evidence map | LIVE |
| `/api/jobs/[id]/rebuild-evidence-map` | POST | Rebuild evidence map | LIVE |
| `/api/jobs/[id]/coach-step` | POST | Complete coach step | LIVE |
| `/api/jobs/[id]/outcome` | POST | Record application outcome | LIVE |

### Coach
| Route | Method | Purpose | Status |
|-------|--------|---------|--------|
| `/api/coach/sessions` | POST | Create coach session | LIVE |
| `/api/coach/sessions/[id]/messages` | POST | Stream coach messages | LIVE |
| `/api/coach/confirm-tool-call` | POST | Confirm tool execution | LIVE |
| `/api/coach/evidence-drafts/[id]/confirm` | POST | Confirm evidence draft | LIVE |
| `/api/coach/evidence-drafts/[id]/reject` | POST | Reject evidence draft | LIVE |

### Evidence
| Route | Method | Purpose | Status |
|-------|--------|---------|--------|
| `/api/evidence/[id]` | DELETE | Delete evidence item | LIVE |
| `/api/evidence/import` | POST | Import evidence | LIVE |
| `/api/evidence/export` | GET | Export evidence | LIVE |
| `/api/evidence/merge` | POST | Merge evidence items | LIVE |
| `/api/evidence/keep-both` | POST | Keep both during conflict | LIVE |

### External Imports
| Route | Method | Purpose | Status |
|-------|--------|---------|--------|
| `/api/linkedin/capture` | POST | Capture LinkedIn profile | LIVE |
| `/api/linkedin/import` | POST | Import LinkedIn data | LIVE |
| `/api/linkedin/pdf-extract` | POST | Extract from LinkedIn PDF | LIVE |
| `/api/resume/upload` | POST | Upload and parse resume | LIVE |
| `/api/parse-github` | POST | Parse GitHub profile | LIVE |

### Billing
| Route | Method | Purpose | Status |
|-------|--------|---------|--------|
| `/api/stripe/checkout` | POST | Create checkout session | LIVE |
| `/api/stripe/portal` | POST | Open customer portal | LIVE |
| `/api/stripe/webhook` | POST | Handle Stripe webhooks | LIVE |

### Integrity
| Route | Method | Purpose | Status |
|-------|--------|---------|--------|
| `/api/integrity/ai-content` | POST | Detect AI-generated content | LIVE |
| `/api/integrity/consistency` | POST | Check claim consistency | LIVE |
| `/api/integrity/gap` | POST | Find evidence gaps | LIVE |
| `/api/integrity/verification` | POST | Full verification run | LIVE |
| `/api/integrity/score` | POST | Calculate integrity score | LIVE |

---

## Server Actions Summary

| Action | File | Purpose |
|--------|------|---------|
| `createJob` | lib/actions/jobs.ts | Create new job |
| `deleteJob` | lib/actions/jobs.ts | Delete job |
| `applyToJob` | lib/actions/apply.ts | Mark job as applied |
| `updateDocuments` | lib/actions/documents.ts | Save document edits |
| `acceptApplicationPackage` | lib/actions/package.ts | Accept package for apply |
| `markPackageNeedsReview` | lib/actions/package.ts | Flag package for review |
| `resetPackageReviewStatus` | lib/actions/package.ts | Reset package status |
| `completeStep` | lib/actions/complete-step.ts | Complete workflow step |
| `recordOutcome` | lib/actions/outcome-learning.ts | Record application outcome |
| `createResumeVersion` | lib/actions/resume-versions.ts | Create resume snapshot |
| `exportResumeDocx` | lib/actions/resume-export.ts | Export resume to DOCX |

---

## Readiness Gate Flow

```
┌─────────────┐
│  Add Job    │
└──────┬──────┘
       │
       ▼
┌─────────────┐    POST /api/re-analyze
│  Analyze    │◄────────────────────────
└──────┬──────┘
       │
       ▼
┌─────────────┐    /jobs/[id]/evidence-match
│  Prove Fit  │◄────────────────────────────
└──────┬──────┘
       │ (Match Interview modal)
       │ POST /api/coach/sessions
       │ POST /api/coach/evidence-drafts/{id}/confirm
       ▼
┌─────────────┐    POST /api/generate-documents
│  Generate   │◄────────────────────────────────
└──────┬──────┘
       │
       ▼
┌─────────────┐    /jobs/[id]/documents
│   Review    │◄────────────────────────
└──────┬──────┘
       │ (DocumentsEditor save)
       │ acceptApplicationPackage
       ▼
┌─────────────┐    /ready-to-apply
│ Ready Gate  │◄─────────────────
└──────┬──────┘
       │ applyToJob (lib/actions/apply.ts)
       ▼
┌─────────────┐
│   Applied   │
└─────────────┘
```

---

## Known Issues / Dead Ends

1. **`/ready-queue`** — Page exists but may be redundant with `/ready-to-apply`
2. **`/jobs/[id]/resume`** — Page exists, unclear if used vs `/jobs/[id]/documents`
3. **`/jobs/[id]/evidence`** — Page exists, unclear if used vs `/jobs/[id]/evidence-match`
4. **`/career-context`** — Separate page that may overlap with `/evidence`

---

## Quick Reference: User Journey Buttons

| Screen | Primary CTA | Endpoint |
|--------|-------------|----------|
| Dashboard | "Add first job" | `/jobs?add=true` |
| Jobs List | Job card click | `/jobs/{id}` |
| Job Detail (no analysis) | "Analyze this job" | `POST /api/re-analyze` |
| Job Detail (analyzed) | Dynamic next action | `{readiness.nextAction.href}` |
| Job Detail | "Generate" | `POST /api/generate-documents` |
| Evidence Match | "Start Match Interview" | Opens `MatchInterviewModal` |
| Evidence Match | "Continue to job" | `/jobs/{id}` |
| Match Interview | Chat + confirm | `POST /api/coach/sessions/{id}/messages` |
| Documents | "Export DOCX" | `POST /api/export-docx` |
| Documents | "Check ready to apply" | `/ready-to-apply?jobId={id}` |
| Ready to Apply | "Mark as applied" | `applyToJob` server action |
| Ready to Apply | "Review docs" | `/jobs/{id}/documents` |
