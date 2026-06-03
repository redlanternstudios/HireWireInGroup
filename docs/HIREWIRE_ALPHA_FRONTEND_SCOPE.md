# HireWire Alpha — Frontend Scope

> **Generated**: 2026-06-03
> **Source**: Real VS Code repo + v0 image classification

---

## SCREEN CLASSIFICATION

### KEEP FOR ALPHA (Wire to existing pages)

| Screen | Maps To | Action |
|--------|---------|--------|
| Screen 10 PROVE YOUR FIT | `app/(dashboard)/jobs/[id]/evidence-match/page.tsx` | **ALREADY EXISTS** — has RequirementCoachModal, GuidedRequirementCoachFlow |
| Screen 11 Top Evidence Matches | Same as above | Integrated into evidence-match page |
| Screen 12 Coach Chat | `components/coach/RequirementCoachModal.tsx` | **EXISTS** — needs streaming route |
| Screen 15 Drafted Proof | `components/coach/GapCoachDrawer.tsx` | **EXISTS** — needs confirm/reject routes |
| Screen 17 PROOF LOCKED IN | Toast/modal on confirm | Add success state to confirm flow |
| Screen 21 Resume Generation | `app/(dashboard)/jobs/[id]/documents/page.tsx` | **EXISTS** — needs verification badges |
| Screen 23 Resume Viewer | `DocumentsEditor.tsx` | **EXISTS** — add GovernancePanel on click |
| Screen 25 Governance View | **NEW**: `GovernancePanel.tsx` | Component to build |
| Screen 40 Evidence Vault Main | `app/(dashboard)/evidence/page.tsx` | **EXISTS** |
| Screen 41 Evidence Item Detail | Evidence detail view | **EXISTS** |

### USE AS SUPPORTING REFERENCE (Don't rebuild)

| Screen | Maps To | Note |
|--------|---------|------|
| Screen 02 Evidence Vault Setup | Part of evidence page | Reference only |
| Screen 03 Vault Processing | Loading states | Reference only |
| Screen 04 Profile Review | Profile page | Reference only |
| Screen 07 Home Dashboard | Dashboard exists | Reference only |
| Screen 20 Evidence Mapping | Evidence-match page | Already built |
| Screen 30 Readiness Dashboard | Readiness checklist on job detail | Already built |
| Screen 31 Strengthen Weak Areas | Coach flow | Reference only |

### PARK FOR LATER

- Screen 01 Career Stage Selection
- Screen 05 Writing Voice
- Screen 06 Goal and Game Plan
- Screen 22 Application Package Overview
- Screen 24 Cover Letter Viewer
- Screen 26 Version History
- Screen 27 Documents Complete
- Screen 28 Completion
- Screen 33 Application Package Review
- Screen 34 Choose Platform
- Screen 35 Submitted Confirmation
- Screen 36 Application Pipeline

### CUT / DO NOT BUILD

- Screen 29 Second Mission Accomplished
- Screen 32 Extra Mission Ready
- Screen 37 Interview Tracker
- Screen 38 Offer Tracking
- Screen 39 Outcomes Analytics
- Screen 44 Market Fit
- Screen 45 Skills Intelligence
- Screen 46 Opportunity Match
- Screen 47 Duplicate Readiness Score
- Screen 48 AI Coach Dashboard
- Screen 49 Interview Prep
- Screen 50 Next Best Move
- Screen 51 Duplicate Job Tracker

---

## FRONTEND ALPHA SCOPE — SMALLEST VIABLE UI

### 1. Evidence Match Page (EXISTS)

**Route**: `/jobs/[id]/evidence-match`
**File**: `app/(dashboard)/jobs/[id]/evidence-match/page.tsx`
**Status**: REAL — fully built with:
- Requirements list from `evidence_map.requirement_matches`
- Status badges (Covered, Needs example, etc.)
- `RequirementCoachModal` integration
- `GuidedRequirementCoachFlow` integration
- `RebuildEvidenceMapButton`

**No changes needed** — page is complete.

### 2. Coach Modal (EXISTS, needs streaming)

**Component**: `components/coach/RequirementCoachModal.tsx`
**Current**: Opens modal, renders coach UI
**Missing**: Streaming route for messages

**Backend dependency**: `POST /api/coach/sessions/[sessionId]/messages`

**Acceptance criteria**:
- User types message
- Coach streams response
- Evidence drafts appear inline
- Confirm/skip buttons work

### 3. Evidence Draft Confirm/Reject (PARTIAL)

**Components**: 
- `components/coach/GapCoachDrawer.tsx`
- `components/coach/GuidedRequirementCoachFlow.tsx`

**Current**: UI exists, calls to backend
**Missing**: Backend routes

**Backend dependency**:
- `POST /api/coach/evidence-drafts/[draftId]/confirm`
- `DELETE /api/coach/evidence-drafts/[draftId]/reject`

**User flow**:
1. Coach proposes evidence draft
2. User clicks "Confirm" → evidence saved to `evidence_library`, `prove_fit_decisions` updated
3. Or user clicks "Skip" → draft rejected, coach asks for different approach

### 4. Documents Page with Verification Badges (NEEDS UPGRADE)

**Route**: `/jobs/[id]/documents`
**File**: `app/(dashboard)/jobs/[id]/documents/DocumentsEditor.tsx`
**Current**: Shows `generated_resume` and `generated_cover_letter` as editable text
**Missing**: Verification badges on bullets

**Data source**: `governance_claim_verdicts` for the job

**UI change**:
```tsx
// Each bullet line in the resume should show:
<span className="inline-flex items-center gap-2">
  {bulletText}
  <VerificationBadge verdict={claimVerdict} />
</span>
```

**Badge states**:
- Green checkmark: `claim_grounded=true && evidence_exists=true`
- Amber warning: `claim_grounded=true && evidence_exists=false`
- Red X: `claim_grounded=false`
- Gray question: No verdict

**Acceptance criteria**:
- Every bullet in generated resume has a badge
- Badge color reflects actual governance data
- No fake green badges

### 5. GovernancePanel Component (NEW)

**File**: `components/documents/GovernancePanel.tsx`
**Trigger**: Click on a bullet in DocumentsEditor
**Display**:

```
┌─────────────────────────────────────────┐
│ Claim Verification                      │
├─────────────────────────────────────────┤
│ Claim:                                  │
│ "Led cross-functional team of 12..."    │
│                                         │
│ Requirement:                            │
│ "Experience leading teams"              │
│                                         │
│ Evidence:                               │
│ "Senior PM at Acme Corp, managed 12     │
│  engineers across 3 teams"              │
│                                         │
│ Source: LinkedIn Profile                │
│                                         │
│ Status: ✓ Source Verified               │
└─────────────────────────────────────────┘
```

**Data sources**:
- `governance_claim_verdicts` for claim text, grounded status
- `jobs.resume_provenance` for evidence linkage
- `evidence_library` for evidence details
- `prove_fit_decisions` for requirement linkage

**Acceptance criteria**:
- Shows full trace: Requirement → Claim → Evidence → Source
- Shows verification status accurately
- If any link is broken, shows "Trace incomplete" not green checkmark

### 6. Success State: Proof Locked In

**Trigger**: After successful confirm of evidence draft
**UI**: Toast notification or inline success message

```tsx
toast({
  title: "Proof locked in",
  description: "This evidence is now confirmed for the requirement.",
})
```

---

## EXISTING COMPONENTS TO REUSE

| Component | Location | Use For |
|-----------|----------|---------|
| `RequirementCoachModal` | `components/coach/` | Coach chat in modal |
| `GuidedRequirementCoachFlow` | `components/coach/` | Guided proof flow |
| `GapCoachDrawer` | `components/coach/` | Drawer-based coach |
| `RebuildEvidenceMapButton` | `components/jobs/` | Re-run matching |
| `AnalyzeJobButton` | Job detail page | Re-analyze |
| `ReadinessChecklist` | Job detail page | Progress tracking |
| Status badge classes | `globals.css` | `status-ready`, `status-analyzing`, etc. |

---

## LOADING, EMPTY, ERROR STATES

### Loading States

- Evidence match page: Skeleton cards for requirements
- Coach modal: "Coach is thinking..." with typing indicator
- GovernancePanel: Skeleton for trace data
- Badges: Gray placeholder while loading

### Empty States

- No requirements extracted: "Analysis needed" with Analyze button
- No evidence matches: "Add evidence to your vault to see matches"
- No governance verdicts: "Generate documents to see verification"

### Error States

- Coach streaming fails: "Coach unavailable. Try again."
- Confirm fails: "Could not save evidence. Please try again."
- Governance data missing: Show trace as "Incomplete" not fake green

---

## WHAT NOT TO COPY FROM V0 IMAGES

- Complex multi-step wizards (use existing linear flows)
- Career DNA visualizations
- Market fit dashboards
- Interview tracking UI
- Offer negotiation UI
- Multiple resume versions UI (park for later)
- Voice profile customization (park for later)
