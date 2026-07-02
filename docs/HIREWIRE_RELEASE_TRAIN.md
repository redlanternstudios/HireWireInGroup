# HireWire — Build Plan / Release Train

_OS-importable tasks in `hirewire-release-train.csv` (columns map 1:1 to byred_tasks; tenant_id=`hirewire`, status ∈ not_started/in_progress/blocked/done)._

**51 tasks** across 5 releases. `is_ready_for_ai=true` = an agent can execute without human input; `is_ready_for_human=true` = needs a person (creds, asset, or live judgment).

**Progress:** 9/51 done (R0 stabilization landed this session, uncommitted on `main`).


## R0 Stabilize

| # | Task | Status | Pri | Pts | Ready | DoD |
|---|------|--------|-----|-----|-------|-----|
| 1 | Remove duplicate POST concat in coach route | ✅ done | P0 | 2 | AI | Single POST handler; tsc parses file |
| 2 | Fix login: @supabase/ssr cookie sessions | ✅ done | P0 | 3 | AI | createClient exported via createBrowserClient |
| 3 | Migrate coach route to AI SDK v6 | ✅ done | P0 | 3 | AI | Coach route 0 tsc errors on v6 API |
| 4 | Create lib/adapters/groq.ts + pin @ai-sdk/groq@3 | ✅ done | P0 | 2 | AI | groq/MODELS/isGroqConfigured exported |
| 5 | Fix generate-documents route | ✅ done | P1 | 1 | AI | generate-documents 0 tsc errors |
| 6 | Fix 3 orphaned feature screens | ✅ done | P2 | 2 | AI | screen-10/17/25 0 tsc errors |
| 7 | Remove duplicate /onboarding route | ✅ done | P0 | 1 | AI | next build no parallel-route error |
| 8 | npm install missing deps | ✅ done | P0 | 1 | AI | node_modules complete |
| 9 | Build-integrity guardrail | ✅ done | P1 | 5 | AI | Gate blocks concat on staged files; passes clean tree |
| 10 | Branch + commit stabilization work | ⬜ not_started | P0 | 1 | AI | Branch pushed with clean commit |
| 11 | Open PR + green CI | ⬜ not_started | P0 | 2 | AI | PR open, CI green |
| 12 | Run agent:verify with receipt | ⬜ not_started | P0 | 1 | AI | typecheck+lint+build all pass |

## R1 Verify

| # | Task | Status | Pri | Pts | Ready | DoD |
|---|------|--------|-----|-----|-------|-----|
| 13 | Verify password login end-to-end (live) | ⬜ not_started | P0 | 3 | human | Authenticated dashboard renders |
| 14 | Verify magic-link login (live) | ⬜ not_started | P1 | 2 | human | Magic link authenticates |
| 15 | Verify signup + email confirmation | ⬜ not_started | P1 | 2 | human | Signup → confirm → login works |
| 16 | Confirm Groq model IDs are served | ⬜ not_started | P1 | 1 | human | Both model IDs return 200 |
| 17 | Verify coach chat streams (live) | ⬜ not_started | P0 | 3 | human | Coach streams a grounded reply + tool call |
| 18 | Verify document generation (live) | ⬜ not_started | P0 | 5 | human | Docs generate with provenance |
| 19 | Verify route protection | ⬜ not_started | P0 | 3 | human | Protected routes 401/redirect |
| 20 | Smoke-test the spine | ⬜ not_started | P0 | 5 | human | Full spine completes for a job |

## R2 Audit

| # | Task | Status | Pri | Pts | Ready | DoD |
|---|------|--------|-----|-----|-------|-----|
| 21 | Classify maturity + North Star | ⬜ not_started | P1 | 2 | AI | Class set with justification |
| 22 | Truth Ledger for all modules | ⬜ not_started | P1 | 3 | AI | Every module has a status+receipt |
| 23 | Surface Inventory (full tree) | ⬜ not_started | P1 | 5 | AI | Complete surface tree, no orphans |
| 24 | Atomic I/O — auth flows | ⬜ not_started | P1 | 3 | AI | Every auth element has a filled row |
| 25 | Atomic I/O — dashboard + jobs | ⬜ not_started | P1 | 5 | AI | Filled rows for dashboard+jobs |
| 26 | Atomic I/O — evidence + coach | ⬜ not_started | P1 | 5 | AI | Filled rows for evidence+coach |
| 27 | Atomic I/O — documents + generation | ⬜ not_started | P1 | 5 | AI | Filled rows for docs+gen |
| 28 | Atomic I/O — integrity suite | ⬜ not_started | P2 | 3 | AI | Filled rows for integrity |
| 29 | Atomic I/O — billing + settings | ⬜ not_started | P2 | 3 | AI | Filled rows for billing+settings |
| 30 | State machines (job + application) | ⬜ not_started | P1 | 3 | AI | Two state machines, no trap states |
| 31 | Trigger/Hook/Loop registry + kill switches | ⬜ not_started | P1 | 3 | AI | All triggers registered w/ kill switch |
| 32 | Notification matrix | ⬜ not_started | P2 | 2 | AI | All notifications rowed |
| 33 | Failure/recovery + dedup keys | ⬜ not_started | P1 | 3 | AI | Failure paths + dedup keys defined |
| 34 | Run the four audits | ⬜ not_started | P1 | 2 | AI | Four audits run, findings logged |
| 35 | Ship-gate checklist (§17) | ⬜ not_started | P1 | 2 | AI | Ship gate assembled |
| 36 | Emit audit SSOT markdown | ⬜ not_started | P1 | 1 | AI | Single SSOT doc committed |

## R3 Emails

| # | Task | Status | Pri | Pts | Ready | DoD |
|---|------|--------|-----|-----|-------|-----|
| 37 | Pull HireWire logos from Drive | ⬜ not_started | P1 | 1 | human | Logo assets in repo/public |
| 38 | Define email design system | ⬜ not_started | P1 | 2 | human | Tokens + layout defined |
| 39 | Build base email template | ⬜ not_started | P1 | 3 | AI | Base template renders |
| 40 | Supabase Auth: confirmation email | ⬜ not_started | P1 | 2 | human | Confirmation email branded |
| 41 | Supabase Auth: magic-link email | ⬜ not_started | P1 | 1 | human | Magic-link email branded |
| 42 | Supabase Auth: password reset email | ⬜ not_started | P2 | 1 | human | Reset email branded |
| 43 | Transactional emails (lib/comms/queue) | ⬜ not_started | P2 | 3 | AI | Transactional emails branded |
| 44 | Throttle + fallback per protocol | ⬜ not_started | P2 | 2 | AI | Every email throttled + fallback |
| 45 | Cross-client render test | ⬜ not_started | P2 | 1 | human | Renders in 3 major clients |

## R4 Harden

| # | Task | Status | Pri | Pts | Ready | DoD |
|---|------|--------|-----|-----|-------|-----|
| 46 | Reorder 18 legacy mid-file imports | ⬜ not_started | P3 | 2 | AI | integrity scan 0 warnings |
| 47 | RLS / tenant-scoping security audit | ⬜ not_started | P1 | 3 | AI | All queries scoped; RLS verified |
| 48 | Fix next.config eslint deprecation | ⬜ not_started | P3 | 1 | AI | No config warnings on build |
| 49 | Remove dead-table references | ⬜ not_started | P2 | 2 | AI | No dead-table refs in code |
| 50 | Document env/secrets in README | ⬜ not_started | P3 | 1 | AI | README lists all env vars |
| 51 | Run /audit security skill | ⬜ not_started | P1 | 3 | AI | Security findings triaged |
