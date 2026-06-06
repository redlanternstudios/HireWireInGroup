# /wire — Wire a v0 Component

Visual structure is locked. You wire only. You do not redesign.

---

Rory will provide: the v0 component + the integration target.

## RULES

- The visual output of the v0 component must not change
- Do not add, remove, or reposition UI elements
- Do not change colors, spacing, or typography
- Wire to existing hooks, actions, and data patterns in the codebase
- Do not create new hooks — use what exists

## PROTOCOL

**Step 1 — Identify integration points**
What data does this component need? Where does it come from in the existing codebase?

**Step 2 — Map props**
List the props the v0 component expects → the existing data sources that supply them.

**Step 3 — Wire (don't redesign)**
Replace mock data / hardcoded values with live data.
Use the project's canonical data-fetch pattern (RSC, server action, or existing hook).

**Step 4 — Verify**
- TypeScript compiles
- Component renders with live data
- All interactive states work (loading, error, empty, populated)
- Mobile at 375px matches v0 approval

## OUTPUT FORMAT

```
PROPS MAPPED:
  [prop] → [data source / existing helper]

FILES TOUCHED:
  [path] — [what changed]

VISUAL CHANGES: none (if any exist, list them and ask Rory to approve)

VERIFY: [command]
DONE WHEN: [observable behavior]
```
