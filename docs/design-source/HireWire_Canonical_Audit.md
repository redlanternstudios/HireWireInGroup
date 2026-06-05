# HireWire — Canonical Design + Build Truth (grabbed from RedLantern Studios Drive)

> **This is the source of truth.** It consolidates the four canonical docs from the
> "HireWire UI User Journey" Drive folder (RedLantern Studios, June 2 2026). Where the repo's
> earlier `docs/NEW_USER_JOURNEY.md` / `docs/UI_SCREEN_SPEC.md` conflict with this file, **this wins**
> (those two were authored from a 27-screen subset, before these docs were available — see §7).
>
> Originals (Google Drive, owner roryleesemeah@gmail.com):
> - North Star + Distance — `1cTgkk9FUituL7_Gre2NJKhUF7AnmEAyl`
> - Build Reality Map — `1etsawdClsNa6oyGiYZ85UQtGBVzdvhYB`
> - Master UI Audit v2 — `1dy6iw-pZV6wodG4I0iJZcrrqn4nBxgtJ`
> - Proof Chain Alpha (build spec) — `1pOczRJsKz8lpDF6kiwj2f74OmXVPujIP`
> - (also in folder: Master_UI_Audit v1 + .pdf, HireWire_UI_Audit.md)
>
> Grabbed: 2026-06-04.

---

## 1. The North Star (what the product actually is)

> **HireWire is the only tool where every career claim is traced back to verified proof.**

The product = a **9-step proof-chain demo**, not the dashboards:
1. Upload résumé → evidence appears in vault
2. Paste job → requirements extracted as structured rows
3. "You have 2 of 5 requirements proven. Here's your top gap."
4. System surfaces matching evidence from the vault for that gap
5. Coach asks smart, targeted questions
6. Coach produces a proof statement → user confirms → proof locked
7. System generates one résumé bullet using **only** that proof
8. Click the bullet → see **Requirement → Proof → Evidence → Source**
9. Export → mark applied

**Distance: ~35% of north star.** The 35% done is the hard infrastructure (upload, parse, generate, AI coach backend, evidence storage). The product only becomes real when the proof chain connects those into one auditable loop.

**The one thing that changes everything:** `generate-documents` is the broken center — today it writes whatever sounds good from résumé+JD. The moment it becomes **proof-controlled** (only writes claims with approved proof statements, into `generated_claims` rows traceable to requirements+evidence), HireWire stops being "a good AI résumé tool" and becomes "a verified proof engine." That is the pivot.

---

## 2. The proof chain — 8 stations, current reality

| Station | Needs | Reality | Status |
|---|---|---|---|
| 1. Job Requirements | `job_requirements` table (structured rows: type, importance, status) | blob in `job_analyses`, no rows/statuses | ❌ MISSING |
| 2. Evidence Match | `requirement_evidence_matches` + matching route | `evidence_library` exists; no matching logic | ❌ MISSING |
| 3. Proof Statement | `proof_statements` tied to requirements | `coach_evidence_drafts` works but saves raw snippets | 🟡 PARTIAL |
| 4. Proof Packet | `buildProofPacket()` — controlled generation input | `generate-documents` generates freely; no packet | ❌ MISSING |
| 5. Generated Claims | `generated_claims` rows (requirement_id + proof_id) | `jobs.generated_resume` text blob; no rows | ❌ MISSING |
| 6. Governance | `claim_evidence_links` trace chain | **nothing — the hero feature is pure UI** | ❌ MISSING |
| 7. Application | `applications` table | not confirmed in schema | ❌ MISSING |
| 8. Outcome | `application_events` | nothing | ❌ MISSING |

**Real infrastructure that exists:** résumé upload+parse, evidence library (+confidence), job analysis, document generation (uncontrolled), coach backend (sessions/messages/AI/confirm-reject), readiness engine, quality gate, Stripe billing. **Coach backend is fully built; coach frontend is deferred (Phase 6).**

---

## 3. Canonical 51-screen inventory + decision + build status

Decisions from Master UI Audit v2 (KEEP / REDESIGN / CUT / DEFER). Build status from Build Reality Map (✅ real · 🟡 partial · ⛔ deferred · ❌ missing · ✂️ cut). "14A" etc. = the brief's HW/11 step labels.

| # | File / Screen | Decision | Build |
|---|---|---|---|
| 01 | onboarding — Career Stage Selection | KEEP | ❌ missing |
| 02 | onboarding — Evidence Vault Setup | KEEP | 🟡 partial (upload/GitHub real; LinkedIn/portfolio not) |
| 03 | onboarding — Vault Processing/Loading | KEEP | 🟡 partial (no live counter UI) |
| 04 | onboarding — Profile Review & Approval | KEEP | ❌ missing (approve/reject UI) |
| 05 | onboarding — Writing Voice Setup | KEEP | ❌ missing (no column/route/extraction) |
| 06 | onboarding — Goal & Game Plan | KEEP | ❌ missing |
| 07 | home — Career OS Dashboard | **REDESIGN** (generic; lead w/ evidence identity, cut tool grid) | 🟡 partial |
| 08 | home — My Materials | **REDESIGN** (looks like Drive; show evidence score/doc) | 🟡 partial |
| 09 | home — Job Tracker tab | **REDESIGN** (show readiness per app) | 🟡 partial |
| 10 | coach — PROVE YOUR FIT (gap) | KEEP (best screen) | 🟡 partial (backend ✅, **frontend deferred**) |
| 11 | coach — Top Evidence Matches | KEEP (critical bridge) | ❌ missing (no confidence-match route) |
| 12–16 | coach — Dig deeper / Story / Impact / Drafted / Strengthened | **REDESIGN** (compress 10→6 steps) | 🟡 partial (AI ✅, frontend deferred) |
| 17 | coach — PROOF LOCKED IN | KEEP (category-defining) | 🟡 partial (confirm route ✅, frontend deferred) |
| 18 | coach — Requirements Progress | KEEP | ❌ missing (no aggregate progress route) |
| 19 | coach — Final Proof / Tie Together | KEEP | ❌ missing (no session-close+summary route) |
| 20 | generation — Evidence Mapping | KEEP (brilliant) | ❌ missing (no viz data model) |
| 21 | generation — Résumé Live Preview | KEEP | ✅ real (route generates from evidence; preview UI unclear) |
| 22 | documents — Application Package Overview | **REDESIGN** (3 things: résumé/cover/evidence) | 🟡 partial |
| 23 | documents — Résumé Viewer (14A) | KEEP (inline evidence tags = killer) | ✅ real (correct source col) |
| 24 | documents — Cover Letter Viewer (14B) | KEEP | ✅ real |
| 25 | documents — **Governance View (14C)** | **KEEP — THE HERO FEATURE** | ❌ **MISSING — no backend, no table. UI theater if shipped as-is.** |
| 26 | documents — Version History (14D) | KEEP | ❌ missing (no versions table) |
| 27 | documents — Documents Complete | KEEP | 🟡 partial |
| 28 | complete — You're All Set | KEEP | ❌ missing (no state) |
| 29 | complete — Mission Accomplished (2nd) | **CUT** (dupe of 28) | ✂️ |
| 30 | readiness — Readiness Dashboard (15A) | KEEP (simplify) | ✅ real (`lib/readiness` is sole gate) |
| 31 | readiness — Strengthen Weak Areas (15B) | **REDESIGN** (max 3 areas) | 🟡 partial |
| 32 | readiness — Mission Ready (15C) | **DEFER** (3rd readiness screen) | ⛔ |
| 33 | apply — Application Package Final Review (16A) | KEEP | ✅ real (quality-pass route) |
| 34 | apply — Choose Platform (16B) | KEEP (smart) | ❌ missing (no submit route) |
| 35 | apply — Submitted Confirmation (16C) | KEEP | ❌ missing (no `applications` table) |
| 36 | outcomes — Application Pipeline Kanban (17A) | KEEP (post-MVP) | 🟡 partial |
| 37 | outcomes — Interview Tracker (17B) | **REDESIGN / DEFER** | ⛔ |
| 38 | outcomes — Offer Tracking (17C) | **DEFER** (need offers first) | ⛔ |
| 39 | outcomes — Outcomes Analytics (17D) | **DEFER** (needs data volume) | ⛔ |
| 40 | intelligence — Evidence Vault Main (18A) | KEEP | ✅ real |
| 41 | intelligence — Evidence Item Detail (18B) | KEEP (excellent) | 🟡 partial |
| 42 | intelligence — Add Evidence (18C) | KEEP | 🟡 partial |
| 43 | intelligence — Evidence Graph (18D) | KEEP (build soon) | ❌ missing (no graph model) |
| 44 | intelligence — Market Fit (19B) | **DEFER** (rebuild around evidence, or cut) | ⛔ |
| 45 | intelligence — Skills Intelligence (19C) | **CUT** (LinkedIn territory) | ✂️ |
| 46 | intelligence — Opportunity Match (20A) | **CUT** (generic) | ✂️ |
| 47 | intelligence — Readiness Score (20B) | **CUT** (dupe of 30) | ✂️ |
| 48 | intelligence — AI Coach Dashboard (21A) | **REDESIGN / DEFER** | ⛔ |
| 49 | intelligence — Interview Prep (21B) | **DEFER** (own flow, V2) | ⛔ |
| 50 | intelligence — Next Best Move (21C) | **CUT** (conflicts w/ coach) | ✂️ |
| 51 | intelligence — Job Tracker Full (22A) | **CUT** (dupe of 36) | ✂️ |

**Note:** numbering skips 19A (Intelligence section assembled from different sprints). Duplicates to delete: two "ChatGPT Image…" files, `DUPE_42`, `DUPE_48`.

---

## 4. Critical gaps, ranked (Build Reality Map)

1. **Governance View has no data model (BLOCKER, screen 25).** Needs `claim_evidence_links` (or, for Alpha, FKs on `generated_claims`). Without it HireWire is just another AI résumé tool.
2. **Coach frontend built but orphaned (HIGH, 10–19).** Backend 100% done; UI is the only remaining work. **Pull from Phase 6 → Phase 4.**
3. **Evidence-to-gap matching missing (HIGH, screen 11).** Need `GET …/match` returning ranked evidence vs. a requirement.
4. **Writing Voice has no backend (MED, screen 05).** Need `voice_preference` + extraction.
5. **Onboarding not built (MED, 01–06).** Phase 3, depends on Phase 2 done.
6. **No `applications` table (MED, screen 35).**

---

## 5. The actual plan: Proof Chain Alpha (replaces the 8-sprint waterfall)

One thin vertical slice proving the chain is real. **Alpha DoD:** paste job → ≥1 structured requirement row → 1 evidence match → coach → confirm 1 proof tied to that requirement → generate doc with ≥1 bullet from **only** that proof → click bullet → see Requirement→Proof→Evidence→Source.

**Minimum schema delta (only):** new `job_requirements`, new `generated_claims`, `+requirement_id` on `coach_evidence_drafts` and `coach_sessions`. (Full `claim_evidence_links` is later — for Alpha, `generated_claims` holds requirement_id/proof_draft_id/evidence_id FKs; one JOIN traces the chain.)

**Route delta (5):** modify `POST /api/analyze` (persist gaps as requirements), `POST /api/coach/sessions` (+requirementId), `…/evidence-drafts/[id]/confirm` (flip requirement→proven), **overhaul `POST /api/generate-documents` (proof-controlled — the pivot)**; new `GET /api/requirements/[jobId]/match` and `GET /api/governance/[jobId]`. **Do NOT touch** `lib/readiness`, `lib/contracts/hirewire`, `lib/adapters/anthropic`, quality-pass.

**Effort:** ~10–12 focused days. Backward-compat: keep writing `jobs.generated_resume`; new behavior is additive.

> ⚠ Repo-name caveat: these specs reference `lib/readiness.ts` and `POST /api/github/sync`. In THIS repo the authority is `lib/readiness/evaluator.ts` and GitHub import is `POST /api/parse-github`. Map names to the actual codebase (CLAUDE.md) before building.

---

## 6. Verification taxonomy + color (enforce in DB + UI)

| Status | Meaning | Color | DB signal |
|---|---|---|---|
| `user_confirmed` | user confirmed a proof in coach | **Green** | `coach_evidence_drafts.status='confirmed'` AND `requirement_id` set |
| `ai_drafted` | AI wrote it, no confirmation | **Amber** | no confirmed proof draft linked |
| `inferred` | from résumé text, no explicit proof | **Amber** | generated for education/skills w/o coach |
| `unsupported` | no evidence/proof | **Red** | no `requirement_id` AND no `proof_draft_id` |

**Rule: Green ONLY for `user_confirmed`. No exceptions.** Truth tests are mandatory (no verified-looking output for unverified claims).

**Color system verdict:** formalize **4 colors** — Red = Brand/AI/Primary action · Green = Verified/Complete · **Yellow = Pending/Action Required (currently undefined — define it)** · Gray = Inactive/Secondary. (Note: this is the *design audit's* recommendation; it sits alongside the repo's `V0_PROVE_FIT_BRIEF.md` token table — reconcile "Yellow" with the existing `--warning` token rather than adding a new hex.)

---

## 7. What this means for the repo's earlier docs

`docs/NEW_USER_JOURNEY.md` and `docs/UI_SCREEN_SPEC.md` were written from the ~27-screen pasted subset, **before** these canonical docs were available. They are **superseded by this file** and contain errors to correct:
- They treated **CUT** screens as build targets: Skills Intelligence (45), Opportunity Match (46), Next Best Move (50), Job Tracker Full (51), 2nd completion (29), Readiness Score-intel (47).
- They treated **DEFERRED** screens as near-term: Offer Tracking (38), Outcomes Analytics (39), Interview Prep (37/49), Mission Ready (32), Market Fit (44), AI Coach Dashboard (48).
- They under-weighted the **Governance View (25)** — which is THE hero feature with zero backend.
- They missed the **proof-chain backend reality** (5 missing tables; `generate-documents` is the broken center) — the actual blocker, not visual restyle.
- They invented an "HW/11 12A–18A" numbering from the subset; canon is **01–51** (this file).

**Recommendation:** keep `NEW_USER_JOURNEY.md`/`UI_SCREEN_SPEC.md` only as visual-language reference for the **KEEP** screens; treat this file + `V0_PROVE_FIT_BRIEF.md` as the authorities; build to **Proof Chain Alpha (§5)** next, not to the full 51-screen surface.
