# v0 Prompt - Build Day 25 Prove Fit Drawer Alignment

Paste this prompt into v0 after attaching or referencing `.agent/V0_LIVE_HANDOFF.md`.

```txt
You are working in the HireWire repo after the Build Day 25 Codex pass.

Your lane:
- UI only.
- Improve the Prove Fit drawer/sheet/card experience so it consumes the stable unresolved-requirements read contract.
- Do not change Supabase schema, API semantics, generation behavior, apply behavior, readiness authority, or proof-decision logic.

Source of truth:
- Use `.agent/V0_LIVE_HANDOFF.md` for the current changed-file surface.
- Use `GET /api/jobs/[id]/evidence-map` as the only drawer/sheet read contract for unresolved Prove Fit state.
- Use existing readiness outputs and existing route/action wiring. Do not recompute readiness locally.

Backend contract available to UI:
GET `/api/jobs/[id]/evidence-map`

Returns:
{
  success: true,
  matching_complete: boolean,
  blocked_requirements: Array<{
    id: string,
    text: string,
    status: string,
    priority: "required" | "preferred" | "keyword"
  }>,
  first_unresolved_requirement_id: string | null,
  next_action: {
    label: "Prove Fit",
    href: string,
    description: string
  } | null
}

Important behavior:
- `confirmed` is resolved only when backed by `prove_fit_decisions`.
- `auto_mapped` and `skipped` are resolved.
- `gap`, `unknown`, `partial`, stale cached `confirmed`, and missing usable packet are unresolved.
- The API is already authenticated and scoped by `user_id`; do not add client-provided user ids.

UI goals:
1. Make the Prove Fit blocked state easy to scan.
2. Show the first unresolved requirement as the primary next step when present.
3. Use `next_action.href` for the primary CTA instead of rebuilding href logic in UI.
4. Show `blocked_requirements` as a compact list suitable for a drawer/sheet.
5. Preserve existing HireWire language: Prove Fit, Match Interview, Career Context, Application Package, Ready to Apply.

Allowed files:
- Prefer existing UI/client files that already render Prove Fit, generation blocked requirements, or job next-step surfaces.
- Do not edit `lib/readiness/evaluator.ts`, `lib/evidence/proofCoverage.ts`, `lib/evidence/unresolved-requirements.ts`, `app/api/generate-documents/route.ts`, or `app/api/jobs/[id]/evidence-map/route.ts`.

Hard constraints:
- No new Supabase tables, columns, migrations, or RLS assumptions.
- No fake success states.
- No local readiness engine.
- No alternate apply path.
- No generation/apply behavior changes.
- No new top-level routes.
- No invented API routes.
- If data is unavailable, render a restrained loading/error/empty state rather than fabricating requirements.

Design system:
- Use existing shadcn/ui and HireWire `hw-*` classes.
- Keep cards at existing radius and density.
- Use clear CTAs with existing button patterns.
- Mobile must stack cleanly.
- Do not add marketing hero treatment.

Acceptance criteria:
- UI consumes `GET /api/jobs/[id]/evidence-map` for drawer/sheet unresolved state.
- Primary CTA uses `next_action.href`.
- Blocked requirement rows show text, status, and priority without database language.
- Readiness/apply/generation gates remain honest.
- No backend files are changed.
- `npx tsc --noEmit`, `npm run lint`, and `npm run build` pass.

Return:
1. Files changed.
2. UI behavior summary.
3. Confirmation no backend/Supabase contracts changed.
4. Validation results.
```
