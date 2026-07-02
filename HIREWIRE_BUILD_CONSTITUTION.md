# HIREWIRE BUILD CONSTITUTION
Version: 1.1
Status: ACTIVE
Owner: Ro (founder, final authority)
Authority: This file is a required precondition for implementation. No protected code is changed while this file is absent.

---

## 0. PURPOSE

This constitution governs how HireWire is changed. It exists so that any agent or human can repair, extend, or ship HireWire without breaking the truth chain, the authentication path, or the data contracts. It is the unavoidable rule layer the written operating system always intended but did not previously enforce.

A change is legitimate only if it obeys this file. Confidence is not a substitute for a receipt.

---

## 1. TRUTHSERUM (NON NEGOTIABLE)

1. Do not call something complete without a receipt.
2. Do not call a demo a feature.
3. Label every claim: VERIFIED, ASSUMPTION, PARTIAL, or UNKNOWN.
4. If a build has not produced a clean receipt, it is not fixed.
5. Visible forward motion is not progress. A closed loop with proof is progress.

---

## 2. BRANCH AND MERGE LAW

1. No direct commits to `main`. Ever.
2. All work happens on a branch.
3. `main` requires passing checks before merge once protection is enabled.
4. A merge is permitted only when type checking, linting, and the production build all pass on the branch.
5. The workspace instruction to push immediately is subordinate to this file. Repository rules win.

---

## 3. BUILD RECEIPT REQUIREMENT

No change is considered done until a receipt exists. A receipt is the durable proof, not a summary sentence.

Minimum receipt for any code change:

1. Command run and timestamp.
2. `tsc` result.
3. lint result.
4. production build result.
5. For a runtime claim: a console record and a screenshot of the working path.

A change that touches authentication or the Supabase client additionally requires proof that login, signup, onboarding, dashboard entry, and signout work in a browser.

---

## 4. SUPABASE CLIENT CONTRACT

1. Exactly one browser Supabase contract exists. One factory or one shared instance, never both.
2. Every browser consumer uses that one contract. Login, signup, onboarding, billing, settings, profile, documents, evidence, and the global provider are all in scope as one atomic repair.
3. The global authentication provider lives in the root layout. If it cannot construct its client, it fails clearly, not silently.
4. Missing environment configuration fails loud. No TypeScript non-null assertion (`!`) may hide an absent value.
5. Environment must bind to the correct Supabase project ref before any auth claim is made. Confirm the ref, do not assume it.

### Current state: VERIFIED

- `lib/supabase/client.ts` — uses `createBrowserClient` from `@supabase/ssr`; throws descriptive errors on missing env vars; no `!` assertions.
- `lib/supabase/server.ts` — uses `createServerClient`; throws descriptive errors on missing env vars; no `!` assertions.
- `lib/supabase/middleware.ts` — logs loudly and fails open (rather than crashing all routing) when env vars are missing.

---

## 5. DATABASE LAW (aligned audit, locked)

1. HireWire per-user RLS is correct. Do not migrate it during stabilization.
2. The integrity guard functions stay SECURITY INVOKER. Do not promote to DEFINER.
3. Receipt immutability is layered. RLS blocks ordinary authenticated mutation. Triggers cover privileged paths that bypass RLS. Both stay.
4. Auth configuration changes (such as leaked password protection) are not SQL migrations. Separate change, separate receipt.
5. Storage policy changes happen only after confirming current public access is unintended.
6. The shared `public` schema is a standing architectural risk. Containment requires restricted migration roles or separate projects, not naming alone. This is deferred, logged, and not actioned during stabilization.
7. No schema work is authorized unless this constitution and the founder explicitly approve it.

---

## 6. PROTECTED SURFACES

The following may not be changed casually. A change here requires an explicit scope statement, a user story, acceptance criteria, and a definition of done before any edit.

1. The browser Supabase client contract (`lib/supabase/client.ts`).
2. The global authentication provider in the root layout.
3. The canonical onboarding route — exactly one onboarding route may exist. **Canonical:** `app/(auth)/onboarding/page.tsx` (URL: `/onboarding`).
4. The readiness authority (`lib/readiness/` — what decides a user is ready to apply).
5. The apply authority (`lib/actions/apply.ts` — what is permitted to submit an application).
6. The receipt and governance tables and their guard functions (`lib/receipts/`).
7. The data contracts that downstream surfaces depend on (`lib/contracts/hirewire.ts`).

---

## 7. TRUTH CHAIN ORDER

Downstream layers stay subordinate to upstream truth. Required order:
**source truth → validation → generation → execution → receipts**

Generation never silently creates canonical truth. A generated resume line is valid only when backed by evidence and recorded as a verdict.

### Architecture layers (Constitution-aligned)

| Layer | Location | Purpose |
|---|---|---|
| Persistence | `lib/supabase/`, `lib/queries/` | All DB reads/writes; typed helpers |
| Orchestration | `lib/orchestrator/`, `lib/context/` | Sequences multi-step pipelines; logs every step |
| Intelligence | `lib/ai/`, `lib/capabilities/` (if added) | Named, typed AI operations |
| Validation | `lib/schemas/` | Zod schemas at all API boundaries |
| Evidence | `lib/evidence/`, `lib/canonical-evidence.ts` | Provenance and quantification safety |
| Receipts | `lib/receipts/` | Immutable proof of every consequential action |
| Observability | `lib/logs/runLedger.ts` | Per-step structured logs |
| Safety | `lib/safety/` | Content moderation, PII, injection detection |

---

## 8. NO FAKE WIRING

1. If UI exists, the backend exists.
2. If a backend endpoint exists, its logic is real.
3. No orphaned features. Everything connects to a flow with an entry point, decision branches, an output state, an error state, and a recovery path.
4. A table that is supposed to receive data and never has is an unkept promise, not a feature.

---

## 9. STABILIZATION GATE (current state: RED → stabilizing)

Feature work is frozen until the core journey has receipts. Recovery is complete only when all of the following are VERIFIED:

| Gate | Status | Notes |
|---|---|---|
| Type checking, linting, and build all pass | UNKNOWN | Run `npm run agent:verify` to check |
| Exactly one onboarding route | VERIFIED | Bare `app/onboarding/` removed; canonical is `app/(auth)/onboarding/` |
| Every browser Supabase consumer uses the same contract | VERIFIED | `lib/supabase/client.ts` fixed |
| Login, signup, onboarding, dashboard entry, signout work in browser | UNKNOWN | Needs browser test |
| Missing env config fails clearly | VERIFIED | `!` assertions removed from client and middleware |
| Preview deployment is green | UNKNOWN | Needs deploy |
| `main` requires checks before merge | UNKNOWN | Needs branch protection rules set |
| Screenshot, console record, command receipt prove the journey | UNKNOWN | Needs browser session |

No feature merges until all gates are VERIFIED.

---

## 10. CONTEXT ENGINE (FROZEN)

The `lib/context-engine/` directory is frozen. Per Amendment 1.1, it may not participate in live product paths until a future founder amendment explicitly unfreezes it. All active AI reasoning paths use `lib/ai/gateway.ts` and `lib/coach/` only.

---

## 11. ARCHITECTURAL ENRICHMENTS (from extraction report, June 2026)

The following patterns from the Claude Code architecture analysis have been adopted or confirmed present:

| Pattern | Status | Location |
|---|---|---|
| Job flow execution context | PRESENT | `lib/context/job-flow.ts` |
| Typed orchestrator with step ledger | PRESENT | `lib/orchestrator/runJobFlow.ts` + `lib/logs/runLedger.ts` |
| AI integration adapter | PRESENT | `lib/ai/gateway.ts` |
| Zod API schemas | PRESENT + EXTENDED | `lib/schemas/` |
| Job source parser registry | PRESENT | `lib/parsers/` |
| Typed query helpers | PRESENT (jobs) | `lib/queries/jobs.ts` |
| Receipt system | PRESENT | `lib/receipts/` |
| Domain events | PRESENT | `lib/domain-events/` |
| Feature flags | PRESENT | `lib/config/feature-flags.ts` |
| Canonical evidence model | PRESENT | `lib/canonical-evidence.ts` |
| Onboarding state machine | PRESENT | `lib/onboarding-state.ts` |
| Role-aware scoring weights | PRESENT | `lib/scoring-weights.ts` |
| Safety layer | PRESENT | `lib/safety/` |
| Error types and factory | PRESENT | `lib/errors/` |
| Cost tracking | DEFERRED | Use `lib/paywall/usage.ts` for now; dedicated cost-tracker post-MVP |

Patterns explicitly excluded (terminal UI / CLI-specific, not relevant to web SaaS):
- Terminal UI (Ink), vim mode, voice input, keybindings, REPL, interactive helpers, memdir, native bindings.

---

## 12. AMENDMENT LOG

1. **v1.0** — Created to unblock the stabilization repair. Encodes the locked Claude and Codex alignment on the Supabase contract, database law, branch law, and the stabilization gate.
2. **v1.1** — Founder decision recorded June 29, 2026. The governance-based coach and generation engine is canonical. ContextEngine is frozen and may not participate in live product paths until a future founder amendment.
3. **v1.2** — June 30, 2026. Integrated architectural enrichments from Claude Code repo extraction analysis. Constitution written to repo as tracked file. Supabase client `!` assertions removed. Duplicate onboarding route resolved (canonical: `app/(auth)/onboarding/`). Onboarding state machine added. Schema coverage extended. No fake wiring check added as standing policy.
