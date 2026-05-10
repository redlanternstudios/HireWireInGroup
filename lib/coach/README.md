# HireWire Coach Layer

This directory contains the solution-wide governance, validation, and rendering logic for all career artifacts (resume, cover letter, outreach, interview prep, etc). All logic is strictly governed by the Coach Constitution and quality gates.

- Types: see `types.ts`
- Constants: see `constants.ts`
- Zod Schemas: see `schemas.ts`
- Validators: see `validators.ts`
- Strategy profiles: see `strategy.ts`
- Deterministic renderer: see `renderer.ts`
- Drift scoring: see `drift.ts`

## Usage
Import from `lib/coach` for all core logic. Do not duplicate types or validation logic elsewhere.
