# HireWire SightEngine UI Cohesion Pass

Version: 1.0
Date: 2026-05-21
Owner: Product + Engineering
Audience: v0 (design/code generation), implementation agents, UI reviewers

## Purpose

Catch v0 up to the current HireWire plan so generated UI aligns with live architecture, readiness contracts, and SightEngine product direction.

This pass is UI cohesion only. It standardizes layout, hierarchy, and component usage across key dashboard surfaces without changing backend behavior.

## Non-Negotiables

- Do not change route behavior, API contracts, auth flow, or DB schema.
- Do not compute readiness locally. Use canonical readiness outputs only.
- Do not invent fake data in UI.
- Do not add new sidebar routes.
- Do not bypass apply gate. All apply actions route through `/ready-to-apply`.
- Use existing design system classes and tokens from `app/globals.css` (`hw-*`, semantic tokens).

## Decisions (Resolved)

1. Job Detail width/layout: Choose Option A.
- Move job detail from narrow single-column (`max-w-3xl`) to a desktop workspace layout aligned with dashboard rhythm.
- Use `hw-workspace` with main content + right intelligence/action rail.
- Keep mobile single-column.

2. Shared wrappers vs raw classes: Choose Option B for this pass.
- Do not introduce new React shell components (`HwPageShell`, etc.) in this pass.
- Standardize existing CSS classes (`hw-page`, `hw-workspace`, `hw-card`, `hw-panel`, `hw-section-label`, `hw-stat`, `hw-next-action`).

3. Dashboard inline styles: Convert in this pass.
- Replace inline layout/surface styles with Tailwind + existing `hw-*` classes where possible.
- Keep visual parity while removing style drift.

4. Page priority: Core flow first.
- Primary scope: Dashboard -> Jobs list -> Job detail -> Evidence Match -> Documents -> Ready to Apply.
- Secondary sweep: Applications, Evidence, Analytics, Logs, Profile.

5. Mobile: Included.
- Every touched page must preserve clean single-column mobile behavior.

## Layout Contract

Apply this contract on all scoped pages:

1. Page shell
- Use `hw-page` as primary wrapper.
- Desktop target width: approximately 1200px visual rhythm.
- Avoid page-specific random `max-w-*` unless content-specific and justified.

2. Workspace
- Use `hw-workspace` where page benefits from side intelligence/actions.
- Left: `hw-workspace-main` for primary task content.
- Right: `hw-workspace-rail` for intelligence, health, next actions, or guardrails.

3. Surfaces
- Primary cards use `hw-card`.
- Secondary contextual areas use `hw-panel`.
- Next step blocks use `hw-next-action`.

4. Metrics
- Use `hw-stat`, `hw-stat-value`, `hw-stat-label` for summary strips.
- Avoid one-off metric tile patterns unless unavoidable.

5. Labels and spacing
- Section labels use `hw-section-label`.
- Internal section rhythm: `gap-*` classes only (no `space-*` classes for inter-block layout).
- Prefer consistent interior spacing (`px-5 py-4` normal, `px-4 py-3` dense).

## Visual Direction

- Keep HireWire brand language: Supreme red accents, warm off-white page ground, near-white cards.
- Increase contrast between page background, cards, panels, and inputs.
- Avoid flat gray blocks and repetitive centered mobile-card-on-desktop composition.
- Side rails must carry useful intelligence, never filler.

## Scope: Required Page Outcomes

1. Dashboard
- Keep command-center structure.
- Remove inline style drift; align to class-based surfaces.
- Preserve Hero + metrics + next action clarity.

2. Jobs list
- Keep pipeline utility.
- Ensure card rhythm matches dashboard and detail surfaces.
- Keep guided modal integration unchanged.

3. Job detail
- Upgrade to workspace layout with right rail.
- Improve desktop density while preserving existing action logic.

4. Evidence Match
- Keep requirement cards, coach entry, and confirm mapping flow.
- Improve hierarchy and readability; no behavior changes.

5. Documents
- Avoid narrow empty-state layout jumps.
- Keep Generate -> Review -> Ready to Apply flow obvious.

6. Ready to Apply
- Keep gate semantics explicit.
- Preserve blocking/override explanation patterns.

## Setup Instructions for v0

When generating or editing UI in this pass, v0 must:

1. Read first:
- `app/globals.css`
- `V0_ALIGNMENT_PROMPT.md`
- `.ai/prompts/v0-ui-alignment.md`
- `CLAUDE.md`
- `.github/copilot-instructions.md`

2. Work mode:
- UI-only edits.
- Preserve component props and data dependencies.
- Do not alter API calls or server actions.

3. File touch order (recommended):
- `app/(dashboard)/dashboard/page.tsx`
- `components/jobs/jobs-pipeline-client.tsx`
- `app/(dashboard)/jobs/[id]/page.tsx`
- `app/(dashboard)/jobs/[id]/evidence-match/page.tsx`
- `app/(dashboard)/jobs/[id]/documents/page.tsx`
- `app/(dashboard)/ready-to-apply/page.tsx`

4. Verification gates:
- `npx tsc --noEmit`
- `npm run lint`
- `npm run build`

## Guardrails for This Pass

- No readiness rule changes.
- No `lib/readiness/evaluator.ts` edits.
- No `lib/actions/apply.ts` behavior changes.
- No generation governance logic changes.
- No new endpoint creation for visual-only tasks.

## Acceptance Criteria

The pass is complete when:

1. Core flow pages share one cohesive desktop rhythm.
2. Job detail no longer feels cramped at desktop widths.
3. Dashboard no longer depends on one-off inline style layout primitives.
4. Empty states explain purpose + next action.
5. Mobile remains clean and stacked.
6. Build, typecheck, and lint pass.

## Implementation Phases

Phase 1: Foundation consistency
- Normalize wrappers/surfaces/spacing on scoped pages.

Phase 2: Core flow cohesion
- Desktop workspace alignment across dashboard -> jobs -> detail -> evidence -> docs -> ready gate.

Phase 3: Secondary pages
- Bring applications/evidence/analytics/logs/profile into same visual system.

Phase 4: QA and regression sweep
- Responsive checks, contrast checks, route smoke tests.

## Definition of Done (v0 handoff)

v0 output must include:

1. Files changed list.
2. Visual-only confirmation (no backend changes).
3. Props/API preservation confirmation.
4. Build/lint/typecheck status.
5. Any assumptions explicitly listed.
