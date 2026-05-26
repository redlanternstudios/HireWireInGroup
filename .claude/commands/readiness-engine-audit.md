# Readiness Engine Audit

Audit readiness only. Do not edit files.

Search for:

- readiness
- ready
- apply
- application package
- gate
- evaluator
- score
- requirements
- missing evidence
- override
- eligibility
- status

Determine:

- whether `lib/readiness/evaluator.ts` is the only authority
- where readiness is calculated
- whether readiness is persisted
- which pages consume readiness
- whether apply buttons are actually gated
- whether users can bypass readiness
- whether overrides are logged
- whether evidence, document, and analysis changes retrigger readiness
- whether readiness is consistent across dashboard, job detail, documents, preview, and apply flow

Return one verdict:

- Real readiness engine
- Partially wired readiness engine
- Visual only readiness engine
- No readiness engine

Include exact file references and a P0 fix list.

