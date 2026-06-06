# Protected Files

Do not modify these without explicit user approval and a narrow reason.

## Highest Risk

- `lib/readiness/evaluator.ts`
- `lib/actions/apply.ts`
- `app/(dashboard)/ready-to-apply/page.tsx`
- `app/api/generate-documents/route.ts`
- `lib/supabase/middleware.ts`
- `lib/supabase/server.ts`
- `lib/supabase/client.ts`

## High Risk

- `lib/coach/claim-validator.ts`
- `lib/coach/drift-scorer.ts`
- `lib/canonical-evidence.ts`
- `lib/evidence/`
- `lib/domain-events/invalidation-map.ts`
- `lib/domain-events/recompute-readiness.ts`
- `lib/contracts/hirewire.ts`
- `app/api/stripe/webhook/route.ts`
- `app/(dashboard)/billing/`

## Schema

- `supabase/migrations/`

Schema rules:

- append-only
- do not edit existing migrations
- new migrations must be idempotent
- use `IF NOT EXISTS` / `IF EXISTS`

