# Coach Components

## EmbeddedCoachCard

- Displays a single, high-priority coach recommendation in a card format.

## CoachRecommendation

- Renders a single recommendation, styled for visibility.

## CoachBlocker

- Highlights a current blocker in the workflow.

## CoachInsight

- Shows a strategic or analytical insight.

## CoachMomentum

- Surfaces positive momentum or progress.

## WorkflowCoachPanel

- Aggregates blockers, recommendations, insights, and momentum for a workflow-aware panel.

## Integration Points

Embed `WorkflowCoachPanel` or `EmbeddedCoachCard` in:

- Job Detail (app/(dashboard)/jobs/[id]/page.tsx)
- Evidence Matching (app/(dashboard)/jobs/[id]/evidence-match/page.tsx)
- Gap Resolution (app/(dashboard)/jobs/[id]/documents/page.tsx or gap-specific page)
- Application Package (app/(dashboard)/jobs/[id]/documents/page.tsx)
- Analytics (app/(dashboard)/analytics/page.tsx)
- Post-Application Follow-up (app/(dashboard)/applications/page.tsx)

## Example Usage

```tsx
<WorkflowCoachPanel
  recommendations={exampleRecommendations}
  blockers={["Missing leadership evidence"]}
  insights={["This role aligns strongly with your SAP systems background."]}
  momentum="Interview momentum detected"
/>
```
