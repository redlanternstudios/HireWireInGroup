# TruthSerum Build Reality Audit

Audit what is real versus what only appears real. HireWire has a generation spine that must be unbroken end-to-end.

Check:
1. **UI → API**: Are buttons wired to real API calls, not `console.log` or `alert`?
2. **API → DB**: Do API routes write to Supabase and return real data?
3. **Loading states**: Are they tied to actual async operations?
4. **Error states**: Are errors surfaced to the user or silently swallowed?
5. **Success states**: Is success persisted in DB, not just in component state?
6. **Readiness**: Does `lib/readiness/evaluator.ts` reflect actual DB state, not stale props?
7. **Documents**: Are `jobs.generated_resume` and `jobs.generated_cover_letter` actually populated after generation?
8. **Apply gate**: Does `/ready-to-apply` actually gate on live readiness — not a hardcoded boolean?
9. **Analytics/events**: Are domain events emitted after real mutations?
10. **Empty states**: Do they reflect actual missing data, or do they show even when data exists?

Specific to current generation spine:
- Does `GenerateButton` surface the real error reason from the API response?
- Does governance block UI show the actual block reason?
- Are `generation_governance_runs` and `generation_quality_checks` rows actually inserted?
- Does the job row update to `generation_status: "ready"` after successful generation?

Return:
- **Real and working** — confirmed by code path
- **Fake or cosmetic** — UI exists but nothing behind it
- **Partially wired** — wired but incomplete or unreliable
- **Broken** — code path throws, returns wrong data, or fails silently
- **Dangerous assumptions** — places where the code assumes state that may not exist
- **Required fixes** — ordered by blast radius
- **Proof needed** — what to query in Supabase to verify
- **Test path** — how to manually verify end-to-end
