# Workspace Triage

Date: 2026-05-25

## Verdict

The dirty workspace contains two coherent bundles:

1. Autonomous builder operating layer.
2. Prove Fit / Match Interview convergence across readiness, generation, coach save paths, evidence mapping, provenance, and schema.

The second bundle is high risk but directionally aligned with the Application Readiness Engine. It should be treated as one stabilization task, not as unrelated drift.

## Protected Files Touched

- `app/api/generate-documents/route.ts` — generation gate now requires Prove Fit and records generation trace metadata.
- `lib/readiness/evaluator.ts` — readiness treats skipped requirements as non-blocking and updates next-action language.
- `lib/domain-events/invalidation-map.ts` — new `prove_fit_decision_recorded` event invalidates readiness/package surfaces.
- `lib/canonical-evidence.ts` — fit score now short-circuits to zero when no evidence exists and uses role-aware scoring weights.
- `lib/coach/claim-validator.ts` — Match Interview answers are scored for concrete signals before being saved as user-input proof.
- `lib/truthserum.ts` — confirmed proof usage is tracked so generated packages can flag confirmed proof that was dropped.
- `lib/canonical-evidence.test.ts` / `lib/truthserum.test.ts` / `tests/coach-governance.test.ts` — focused regression tests for zero-evidence fit scoring, confirmed proof usage, and coach-answer signal detection.
- `lib/evidence/**` — proof decision fields, skipped claims, and capability packet behavior.
- `supabase/migrations/20260524090000_prove_fit_v0.sql` — Prove Fit decisions and generation trace persistence.

## Still Forbidden

- `lib/actions/apply.ts`
- `app/(dashboard)/ready-to-apply/page.tsx`
- `lib/supabase/**`

## Review Priorities

1. Verify migration idempotency and RLS policies.
2. Verify Match Interview save/skip writes are user-scoped and do not silently lose critical errors.
3. Verify readiness does not allow skipped requirements to become generated claims.
4. Verify generation blocks unresolved Prove Fit gaps and records provenance.
5. Verify package quality override logs a reason before allowing apply flow.

## Required Commands

```bash
npm run agent:protected
npm run agent:preflight
npm run agent:dead-ui
npm run typecheck
npm run lint
npm run build
```
