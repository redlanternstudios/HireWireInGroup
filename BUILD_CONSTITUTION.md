# HIREWIRE BUILD CONSTITUTION
Version: 1.0
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

## 4. SUPABASE CLIENT CONTRACT (the current repair)

1. Exactly one browser Supabase contract exists. One factory or one shared instance, never both.
2. Every browser consumer uses that one contract. Login, signup, onboarding, billing, settings, profile, documents, evidence, and the global provider are all in scope as one atomic repair.
3. The global authentication provider lives in the root layout. If it cannot construct its client, it fails clearly, not silently.
4. Missing environment configuration fails loud. No TypeScript non null assertion may hide an absent value.
5. Environment must bind to the correct Supabase project ref before any auth claim is made. Confirm the ref, do not assume it.

---

## 5. DATABASE LAW (aligned audit, locked)

1. HireWire per user RLS is correct. Do not migrate it during stabilization.
2. The integrity guard functions stay SECURITY INVOKER. Do not promote to DEFINER.
3. Receipt immutability is layered. RLS blocks ordinary authenticated mutation. Triggers cover privileged paths that bypass RLS. Both stay.
4. Auth configuration changes (such as leaked password protection) are not SQL migrations. Separate change, separate receipt.
5. Storage policy changes happen only after confirming current public access is unintended.
6. The shared `public` schema is a standing architectural risk. Containment requires restricted migration roles or separate projects, not naming alone. This is deferred, logged, and not actioned during stabilization.
7. No schema work is authorized unless this constitution and the founder explicitly approve it.

---

## 6. PROTECTED SURFACES

The following may not be changed casually. A change here requires an explicit scope statement, a user story, acceptance criteria, and a definition of done before any edit.

1. The browser Supabase client contract.
2. The global authentication provider in the root layout.
3. The canonical onboarding route (exactly one onboarding route may exist).
4. The readiness authority (what decides a user is ready to apply).
5. The apply authority (what is permitted to submit an application).
6. The receipt and governance tables and their guard functions.
7. The data contracts that downstream surfaces depend on.

---

## 7. TRUTH CHAIN ORDER

Downstream layers stay subordinate to upstream truth. Required order:
source truth, validation, generation, execution, receipts.

Generation never silently creates canonical truth. A generated resume line is valid only when backed by evidence and recorded as a verdict.

---

## 8. NO FAKE WIRING

1. If UI exists, the backend exists.
2. If a backend endpoint exists, its logic is real.
3. No orphaned features. Everything connects to a flow with an entry point, decision branches, an output state, an error state, and a recovery path.
4. A table that is supposed to receive data and never has is an unkept promise, not a feature.

---

## 9. STABILIZATION GATE (current state: RED)

Feature work is frozen until the core journey has receipts. Recovery is complete only when all of the following are VERIFIED:

1. Type checking, linting, and build all pass.
2. Exactly one onboarding route remains.
3. Every browser Supabase consumer uses the same supported contract.
4. Login, signup, onboarding, dashboard entry, and signout work in a browser.
5. Missing environment configuration fails clearly.
6. Preview deployment is green.
7. `main` requires checks before merge.
8. A screenshot, console record, and command receipt prove the journey.

No feature merges until this gate is green.

---

## 10. AMENDMENT

This file changes only by founder decision, recorded as a dated entry below. The constitution is the floor, not a suggestion.

### Amendment log

1. 1.0 Created to unblock the stabilization repair. Encodes the locked Claude and Codex alignment on the Supabase contract, database law, branch law, and the stabilization gate.
2. 1.1 Founder decision recorded June 29, 2026. The governance based coach and generation engine is canonical. ContextEngine is frozen and may not participate in live product paths until a future founder amendment.
