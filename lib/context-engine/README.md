# ContextEngine

ContextEngine is HireWire's ATS-safe evidence backbone. It mirrors existing profile,
resume, evidence, job, coach, and generation data into a provenance model without
replacing the current tables on day one.

## Contract

1. Parse only facts present in user-supplied or system-owned artifacts.
2. Normalize extracted facts into canonical entities with ambiguity flags.
3. Infer capabilities only from evidence IDs.
4. Match job requirements against evidence, entities, and capabilities.
5. Validate generated claims before save.
6. Keep a source-to-claim graph for every generated claim.

## Rollout

The runtime wiring is guarded by:

- `CONTEXT_ENGINE_ENABLED=true`
- or `NEXT_PUBLIC_CONTEXT_ENGINE_ENABLED=true`

When disabled, pure functions remain importable for tests and future flows, but
routes avoid best-effort mirror writes.

## Trust Rules

- `resume`, `linkedin`, `portfolio`, `github`, `website`, `certification`,
  `education`, `project`, `evidence_library`, and `user_profile` may support
  resume claims when evidence is strong.
- `prior_generated_doc` is lower trust and cannot be sole support for a new claim.
- `coach_memory` defaults to `coach_only` or `interview_only` until user approval.

## Extension

Add new source adapters by producing `ContextSource` and `ContextEvidenceItem`
records, then run:

1. `normalizeProfile`
2. `inferCapabilities`
3. `buildEvidenceGraph`

Generation code should call `validateGeneratedClaims` before saving output and
persist the verdicts where migrations are available.
