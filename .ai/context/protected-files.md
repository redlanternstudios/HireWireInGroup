# Protected Files — HireWire

Do not modify these without an explicit, dedicated audit session.
Cloud model (Claude) must review before any change to these files.

## Readiness Authority (highest risk)

- `lib/readiness/evaluator.ts` — canonical readiness authority; no alternate logic anywhere
- Risk: any change can silently break apply eligibility for all users

## Apply Path (highest risk)

- `lib/actions/apply.ts` — only apply mutation path
- `app/(dashboard)/ready-to-apply/page.tsx` — apply gate
- Risk: any bypass creates an unlogged, ungated apply path

## Generation Spine (high risk)

- `app/api/generate-documents/route.ts` — all AI calls and DB writes for generation
- `lib/ai/gateway.ts` — AI provider resolution; model capability assumptions here
- Risk: changes can break structured output, governance, or evidence mapping

## Governance / Claim Safety (high risk)

- `lib/coach/claim-validator.ts` — fabrication detection
- `lib/coach/drift-scorer.ts` — drift detection
- Risk: weakening these creates compliance/truth exposure

## Auth and Middleware (high risk)

- `lib/supabase/middleware.ts` — session refresh and route protection
- `lib/supabase/server.ts` — server-side Supabase client with session
- `lib/supabase/client.ts` — browser-side Supabase client
- Risk: auth bugs leak user data or break all authenticated routes

## Billing / Contract (high risk)

- `lib/contracts/hirewire.ts` — product tier definitions and feature gates
- `app/api/stripe/webhook/route.ts` — Stripe event handler
- `app/(dashboard)/billing/` — billing UI
- Risk: contract changes can enable features for wrong tiers or break Stripe sync

## Schema (append-only)

- `supabase/migrations/` — never edit existing migration files
- New migrations: use `IF NOT EXISTS` / `IF EXISTS` everywhere
- Risk: editing existing migrations breaks environments that have already applied them

## Evidence Normalization

- `lib/canonical-evidence.ts` — evidence normalization
- `lib/evidence/` — matching, synonyms, normalization
- Risk: changes alter what evidence counts as valid, affecting readiness scores

## Domain Events

- `lib/domain-events/invalidation-map.ts` — what events invalidate what
- `lib/domain-events/recompute-readiness.ts` — readiness recompute triggers
- Risk: removing events leaves readiness stale after mutations
