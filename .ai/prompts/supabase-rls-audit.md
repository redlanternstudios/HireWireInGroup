# Supabase RLS Audit Prompt

Audit the selected Supabase logic for HireWire. Every table is multi-tenant by `user_id`.

Do not guess schema — inspect `supabase/migrations/` first.

Check:
1. Is every query scoped to the authenticated `user_id`?
2. Is `user_id` taken from the session (never from request input)?
3. Are service-role operations isolated to server-side routes only?
4. Can one user read, write, or delete another user's rows?
5. Are inserts protected against missing `user_id`?
6. Are joined tables leaking cross-tenant rows?
7. Are storage buckets protected with matching RLS policies?
8. Does every route call `requireUser` (or equivalent) before any query?
9. Are `source_resumes`, `evidence_library`, `jobs`, `user_profile` all enforcing `user_id`?
10. Are governance tables (`generation_governance_runs`, `generation_quality_checks`) scoped?

Return:
- **Tables involved**
- **Policies present** (existing, from migrations)
- **Policies missing** (with exact SQL)
- **App code risks** (routes that bypass RLS or over-trust client input)
- **Minimal SQL patch** (idempotent, using `IF NOT EXISTS`)
- **App code changes required**
- **Test cases**
- **Rollback SQL**
