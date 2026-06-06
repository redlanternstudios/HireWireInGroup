# v0 Execution Prompt: HireWire + Supabase Alignment

Use this exact prompt in v0 when executing a full HireWire alignment pass.

## Prompt Start

You are implementing UI and wiring-safe improvements in an existing production codebase.

Project: HireWire (Next.js 16 + Supabase + Tailwind v4 + shadcn/ui)

Primary mission:
- Execute UI cohesion and workflow clarity upgrades while preserving all backend contracts.
- Cover all canonical pages, core components, buttons, clicks, route transitions, and Supabase safety requirements.
- Align every touched surface with canonical readiness, apply gate, coach flow, evidence flow, generation flow, and tenant isolation rules.

Read in this exact order before writing code:
1. `.github/copilot-instructions.md`
2. `CLAUDE.md`
3. `hire-wire-sight-engine-ui-cohesion-pass.md`
4. `docs/HIREWIRE_UP_DOWNSTREAM_TOTALITY.md`
5. `V0_ALIGNMENT_PROMPT.md`
6. `.ai/prompts/v0-ui-alignment.md`
7. `docs/v0-supabase-system-prompt.md`

Your job is not just to restyle pages. Your job is to preserve and clarify the entire HireWire loop:

job intake -> analysis -> evidence mapping -> generation -> quality review -> ready-to-apply -> apply -> outcome tracking

Hard constraints (must obey):
1. Do not change route behavior, auth semantics, DB schema, or API contracts unless the task explicitly requires it.
2. Do not compute readiness locally. Use canonical readiness outputs only.
3. Do not create alternate apply paths. Apply must remain routed through `/ready-to-apply` and canonical apply action.
4. Preserve existing component props and data dependencies unless a change is required for safe visual refactor and does not alter logic.
5. Keep tenant isolation intact on all touched data access patterns.
6. Generated document truth remains `jobs.generated_resume` and `jobs.generated_cover_letter`.
7. No fake data, no invented analytics, no placeholder readiness, no fabricated application states.
8. No new sidebar routes.
9. No new business logic branches unless explicitly requested.

Pages that must be covered in the pass:
1. `/dashboard`
2. `/jobs`
3. `/jobs/new`
4. `/jobs/[id]`
5. `/jobs/[id]/evidence-match`
6. `/jobs/[id]/documents`
7. `/ready-to-apply`
8. `/applications`
9. `/evidence`
10. `/analytics`
11. `/logs`
12. `/profile`
13. `/coach`

Component and click-path coverage required:
1. Dashboard hero CTA and next-step entry.
2. Jobs list row actions, filters, sort, overflow menu, and guided modal entry.
3. Job detail analyze, re-analyze, generate, evidence-match, docs, and ready-gate links.
4. Evidence-match confirm mapping form, rebuild map button, gap coach drawer, coach chat, and continue-to-job CTA.
5. Documents page empty-state generate action, editor shell, review/apply actions.
6. Ready-to-apply ready cards, blocked cards, docs review links, and apply buttons.
7. Applications rows and their job-detail navigation.
8. Evidence add-entry dialog, search, accordion toggles, and delete actions.
9. Analytics upgrade and next-action links.
10. Logs timeline links and quick links.
11. Profile save, upload resume, skill editing, and outbound helper widgets.
12. Coach send/confirm flows and any tool-confirm interactions.

For each touched page/component, preserve:
1. Entry conditions
2. Read sources
3. Mutation paths
4. Downstream route transitions
5. Existing action semantics

Supabase alignment checks during edits:
1. Every user-owned query remains scoped by `user_id`.
2. Jobs queries retain `deleted_at is null` where applicable.
3. JSONB array fields are guarded with `Array.isArray()` before map/length usage.
4. No readiness/apply/generation-governance contract drift is introduced.
5. No canonical content columns are replaced by secondary tables.

Canonical Supabase domains to respect:
1. `jobs`
2. `job_analyses`
3. `job_scores`
4. `evidence_library`
5. `coach_sessions`
6. `coach_messages`
7. `coach_evidence_drafts`
8. `applications`
9. `domain_events`
10. `generation_governance_runs`
11. `governance_claim_verdicts`
12. `user_profile`
13. `users`

Implementation expectations:
1. Use existing `hw-*` classes and semantic tokens.
2. Prefer `hw-page`, `hw-workspace`, `hw-card`, `hw-panel`, `hw-stat`, `hw-next-action`.
3. Preserve mobile-safe stacking.
4. Keep right rails useful, not decorative.
5. Empty states must explain purpose + next step.

Implementation plan:
1. Start with canonical core flow pages.
2. Then align secondary pages to the same shell/workspace rules.
3. Reduce inline style drift where practical.
4. Do not churn already-correct code unnecessarily.
5. Validate after each substantial batch.

Validation gates (must run):
- `npx tsc --noEmit`
- `npm run lint`
- `npm run build`

Required review checklist before finishing:
1. No competing workflow introduced.
2. No competing apply path introduced.
3. No fake data introduced.
4. All major page CTAs still point to correct downstream routes.
5. Supabase user scoping preserved.
6. Build/lint/typecheck all pass.

Deliverable format:
1. Files changed
2. Page-by-page summary of visual changes
3. Confirmation that backend logic/contracts were untouched or explicitly noted
4. Confirmation that major clicks/buttons/routes remain aligned with `docs/HIREWIRE_UP_DOWNSTREAM_TOTALITY.md`
5. Supabase alignment confirmation (`user_id`, `deleted_at`, JSONB safety, canonical columns)
6. Validation results
7. Assumptions or follow-ups

If any requested UI change conflicts with readiness, apply, coach, evidence, generation, or Supabase safety, keep the contract-safe behavior and report the conflict explicitly.

## Prompt End
