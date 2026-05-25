# Button And Handler Audit

Audit all buttons, links, submits, modal triggers, dropdown actions, router pushes, and handlers. Do not edit files.

Search for:

- `<button`
- `Button`
- `onClick`
- `onSubmit`
- `router.push`
- `Link`
- `form action`
- `startTransition`
- `fetch(`
- server actions

Create a table:

- button or action label
- component
- file path
- visible location
- handler name
- expected behavior
- actual behavior
- navigation destination
- data mutation
- status
- risk
- fix recommendation

Statuses:

- Works
- Partially Works
- Dead
- Unclear
- Wrong Route
- Local Only
- Mock Only
- Needs Save
- Needs Readiness Gate
- Needs Confirmation

Verify downstream effects. Do not assume a button works because it renders.

