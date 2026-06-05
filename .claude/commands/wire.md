# /wire — Wire a v0 Component

Visual structure is locked. You wire only. You do not redesign.

Rules:
- The visual output of the v0 component must not change
- Do not add, remove, or reposition UI elements
- Wire to existing hooks, actions, and data patterns in the codebase
- Do not create new hooks — use what exists

Step 1: Identify what data the component needs and where it lives in the codebase
Step 2: Map props → existing data sources
Step 3: Replace mock data with live data using project's canonical fetch pattern
Step 4: Verify — TypeScript compiles, all states work, mobile at 375px matches v0

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
