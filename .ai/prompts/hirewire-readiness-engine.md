# HireWire Readiness Engine Audit

HireWire is an Application Readiness Engine. The canonical loop:

```
job → ready → applied → outcome
```

State model:
```
materials missing → evidence blocked → quality review → ready → applied/outcome
```

Full authority: `lib/readiness/evaluator.ts` — do not modify without a dedicated audit session.

Rules enforced:
- No page, component, or API route may independently decide if a job is ready, applyable, or blocked
- All apply CTAs must route through `/ready-to-apply`
- `jobs.status` is outcome/history only — never use it as readiness truth
- `lib/job-workflow.ts` is visual progress only — it must not gate actions

Audit checklist:
1. Does this file use the centralized `lib/readiness/evaluator.ts` for any readiness decision?
2. Does it compute or short-circuit readiness independently? (violation)
3. Can the user bypass the apply gate from this page? (violation)
4. Does evidence mapping affect the readiness score displayed?
5. Do document updates trigger readiness recompute?
6. Is readiness state fetched fresh (from DB) or potentially stale (from props/cache)?
7. Are blocked reasons shown honestly to the user?
8. Are overrides explicitly logged?
9. Are domain events emitted after mutations that affect readiness?
10. Are downstream pages (jobs list, dashboard, coach) consistent with this page's state?

Return:
- **Current readiness behavior** (what drives the shown state)
- **Bypass risks** (ways the user or code can skip the gate)
- **Missing event triggers** (mutations that should emit but don't)
- **Files to patch** (exact list)
- **Minimal implementation plan**
- **Test cases** (manual paths to verify gate integrity)
