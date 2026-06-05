# HireWire — New User Journey (Screen-Mapped, Build-Status Truth)

> Source of truth for the **HireWire UI User Journey** design set (the ~40 "HW/11 Career
> Intelligence System" screens). This document synthesizes those screens into a single
> end-to-end journey and maps each surface to **what exists in code today** vs. **what must
> be built/enriched**.
>
> **Read order:** CLAUDE.md → MEMORY.md → this file (the map) → `docs/UI_SCREEN_SPEC.md`
> (the full per-screen visual + feature spec) → `docs/V0_PROVE_FIT_BRIEF.md` (visual law)
> → `docs/CORE_JOURNEY_MAP.md` (the old 14-step engine map this supersedes for UI scope).
>
> **Companion:** `docs/UI_SCREEN_SPEC.md` holds, for every screen, the exact token-referenced
> palette, typography, component reuse, and an exhaustive feature list. This doc stays the map.
>
> **Constitutional guardrails still win.** This journey is UI/feature scope only. It does NOT
> authorize a second readiness engine, a second apply path, a second coach save path, or a
> `generated_documents` content table. New surfaces consume the existing authorities
> (`lib/readiness/evaluator.ts`, `lib/actions/apply.ts`, `app/api/generate-documents/route.ts`).
> Last updated: 2026-06-04.

---

## 0. Status legend

| Mark | Meaning |
|---|---|
| ✅ **Exists** | Route/component exists and broadly matches the screen's intent. May need restyle only. |
| 🟡 **Partial** | A simpler version exists; screen implies meaningful enrichment (new data, new sub-views, new states). |
| 🔴 **Build** | No equivalent surface exists. Net-new page/flow/component. |
| 🎨 **Restyle** | Logic done; needs the visual language from `V0_PROVE_FIT_BRIEF.md`. |

**Visual language reminder (from the brief):** two languages —
- **Language 2 — Warm Editorial** (`#ede9e3` canvas) is the DEFAULT: dashboard, materials, tracker, analytics, settings, documents, readiness.
- **Language 1 — Industrial Proof** (`.hw-proof-context`, `#0f0e0d`) is ONLY for the "prove your fit" room: evidence-match, Match Interview, coach.

The HW/11 ticket-tag chrome (corner hazard stripes, `HW/11 · STEP n OF m` tag, target/bell/menu header) is the *Industrial Proof* skin. The screenshots apply it broadly; per the brief, the dark canvas stays scoped to the prove-fit/coach surfaces — elsewhere reuse the ticket-tag **as light editorial chrome**, not a second dark theme.

---

## 1. The journey at a glance

```txt
Phase A — Career OS Onboarding        (screens 1–5 of 5)
   sign up → search-stage → build Evidence Vault → processing →
   review found items → voice profile → game plan
        ↓
Phase B — Command Center               (Home / Materials / Job Tracker)
        ↓
Phase C — Prove Fit (Industrial Proof) (HW/11 12A–13A)
   requirement → top evidence matches → Match Interview (problem→action→
   impact→extras) → drafted proof → refine → PROOF LOCKED IN → status → next req
        ↓
Phase D — Generation Spine             (HW/11 13A–14D)
   evidence mapping → resume gen → cover letter gen → governance check →
   package complete → document viewers (resume / cover / governance / versions)
        ↓
Phase E — Readiness                    (HW/11 15A–15C)
   readiness dashboard (5 dims) → strengthen weak areas → MISSION READY
        ↓
Phase F — Apply                        (HW/11 16A–16C)
   application package → choose destination → application submitted
        ↓
Phase G — Outcomes Loop                (HW/11 17A–18A)
   pipeline kanban → interview tracker → offer tracking → outcomes analytics →
   Evidence Vault hub (feeds back to Phase C)
```

---

## 2. Phase A — Career OS Onboarding (screens 1–5)

Maps to the 5-step "CAREER OS" wizard. **Current onboarding is a 4-step
`welcome → resume → profile → complete` flow** ([app/onboarding/page.tsx](app/onboarding/page.tsx), 502 lines) — it captures a résumé + profile but has none of the Career-OS framing, multi-source vault, processing animation, found-item review, voice profile, or game plan.

| Screen | Intent | Route / Component | Status | Enrichment delta |
|---|---|---|---|---|
| 1 — "Where are you in your search?" | Capture search stage (just starting / no callbacks / no offers / changing fields / returning) → shapes coaching | `app/onboarding/page.tsx` (new step) | 🔴 Build | New step + persisted field (`user_profile.career_context` or new `search_stage` col — confirm schema before adding) |
| 2 — Build Evidence Vault | Pick **1 required primary source** (upload / paste / LinkedIn) + optional enrich sources (GitHub, website, portfolio, X, IG, YouTube, project PDF) | reuse `app/api/resume/upload`, `linkedin/import`, `parse-github` | 🟡 Partial | Upload exists; multi-source picker + "vault strength" meter + connect-state chips are new UI |
| 3 — Processing animation | "Building your Evidence Vault…" checklist + live "found N items" | new client component | 🔴 Build | Progress UX over existing parse pipeline; no new backend |
| 3b — "Here's what HireWire found" | Tabbed review (Work/Projects/Certs/Education/Portfolio/Skills) with Approve / Edit / Remove; min-3 to continue | `app/(dashboard)/evidence/page.tsx` has CRUD primitives | 🟡 Partial | Review/approve gate at onboarding time is new; evidence rows + `is_user_approved` already exist |
| 4 — Voice Profile | Show extracted writing sample; choose **Preserve / Polish Lightly**; lockable per-job | `lib/voice/*`, `VoiceIntegrityCard` exist downstream | 🟡 Partial | Voice *capture at onboarding* is new UI; voice types/drift already modeled |
| 5 — Game Plan | Profile-complete summary (counts) + "next move" goal (land role / grow / pivot / learn) → builds plan | new | 🔴 Build | Counts derivable from existing tables; "goal" persistence is new |

**Constraint:** do not fabricate found items — every evidence row must trace to a parsed source (`provenance`). Min-3-approved gate is a UI rule, not a readiness authority.

---

## 3. Phase B — Command Center

| Screen | Intent | Route | Status | Delta |
|---|---|---|---|---|
| Home — "Welcome back" | Career-OS % + tool grid (Materials, Job Tracker, Interview Prep, Learning Hub, Career Coach, Progress) + recent activity | `app/(dashboard)/dashboard/page.tsx` | 🟡 Partial / 🎨 | Dashboard exists; tool-grid layout + activity feed is a restyle/enrich. **Interview Prep & Learning Hub tiles are non-canonical** unless wired — render disabled or omit (CLAUDE.md bans `/jobs/[id]/interview-prep`). |
| My Materials | Resume/cover/LinkedIn library w/ status chips, counts | `app/(dashboard)/documents/page.tsx` | 🟡 Partial | A materials library view; today documents are per-job. Decide: global library vs per-job. |
| Job Tracker | Pipeline list w/ stage counts (Applied/Interviewing/Offer/Accepted/Rejected) | `app/(dashboard)/jobs/page.tsx`, `applications/page.tsx`, `components/jobs/jobs-pipeline-client.tsx` | ✅ Exists / 🎨 | Status counts derive from `jobs.status`. Restyle to match. |

---

## 4. Phase C — Prove Fit / Industrial Proof (HW/11 12A–13A) — **the restyled room**

This is the only phase substantially **done** (commit `abbaaaf` + working tree): dark `.hw-proof-context`, ticket tags, proof badges, `PROOF LOCKED IN` stamp, white logo. See `docs/V0_PROVE_FIT_BRIEF.md §10A–10C`.

| Screen | Intent | Route / Component | Status |
|---|---|---|---|
| 12A — "Prove your fit" (unconfirmed requirement) | Requirement + importance + "what they're checking" + AI intro | `app/(dashboard)/jobs/[id]/evidence-match/page.tsx` | ✅ / 🎨 done |
| 12B — Top evidence matches | Ranked vault matches w/ confidence %, pick one / browse all | `MatchInterviewModal` + `evidence_library` | 🟡 Partial | confidence list UI may need enrichment |
| 12C–12E — Match Interview (problem → action → impact → extras) | Guided chat that builds proof | `components/match-interview/*`, `GuidedRequirementCoachFlow` | ✅ / 🎨 done |
| 12F–12G — Drafted proof + refine | Show draft, "looks good / needs edits / something missing", refine loop | `MatchInterviewModal` | 🟡 Partial | refine affordances |
| 12H — PROOF LOCKED IN | Confirmed stamp + "this proof shows" badges | restyle done (`.hw-proof-stamp.locked`) | ✅ done |
| 12I — Proof progress | 1-of-4 requirement stepper | new sub-view | 🟡 Partial |
| 13A — Final summary / tie it together | Closing summary step | new sub-view | 🟡 Partial |

**Authority:** confirm/skip writes `prove_fit_decisions`; readiness via `evaluateReadiness()`. Never bypass.

---

## 5. Phase D — Generation Spine (HW/11 13A–14D)

The screens visualize the generation pipeline (Evidence Mapping → Resume → Cover Letter → Governance → Package) and four document viewers. **Backend spine exists and is high-risk** (`app/api/generate-documents/route.ts` → writes `jobs.generated_resume/cover_letter/quality_passed/evidence_map`). What's missing is the **visualization + viewer suite**.

| Screen | Intent | Route / Component | Status | Delta |
|---|---|---|---|---|
| 13A (gen) — Evidence Mapping | Requirements ↔ approved evidence ↔ "proof building" columns | new client view over `evidence_map` | 🔴 Build | Visualization only; map already computed |
| 13B — Resume Generation | Live resume build w/ section checklist + pipeline tracker | new | 🔴 Build | Progress UX over generate API |
| 14A — Documents Ready | Package summary: resume / cover / evidence-map cards + 100% ready | `ApplicationPackagePreview` | 🟡 Partial / 🎨 | exists; restyle to package-card layout |
| 14A — Resume Viewer | Per-bullet "Verified · VIEW SOURCE" | `ResumePreviewPanel`, `jobs/[id]/resume/page.tsx` | 🟡 Partial | per-bullet source links are new |
| 14B — Cover Letter Viewer | Highlighted spans ↔ evidence sidebar | new | 🔴 Build | span↔evidence mapping UI |
| 14C — Governance View | Claim → Proof → Evidence Source chain, "no hallucinations" | `app/(dashboard)/integrity/*` exists (verification/consistency/ai-content/gap) | 🟡 Partial | integrity pages exist; per-claim traceability view is the enrichment |
| 14D — Version History | Versions w/ change notes, restore, compare | `components/documents/ResumeVersionHistory.tsx`, `lib/actions/resume-versions.ts` | ✅ / 🎨 | exists; restyle + compare UI |

**Hard rule:** document content is read from `jobs.generated_resume` / `jobs.generated_cover_letter` only — viewers never invent text.

---

## 6. Phase E — Readiness (HW/11 15A–15C)

Screens show a **5-dimension readiness *dashboard*** (Resume Quality / Proof Strength / Leadership Evidence / ATS Compatibility / Impact Metrics), a "strengthen weak areas" coach, and a "MISSION READY / top-%" celebration. **Today there is only the apply *gate*** (`/ready-to-apply` + `ReadinessChecklist`) — a binary ready/blocked split, not a scored multi-dimension dashboard.

| Screen | Intent | Route / Component | Status | Delta |
|---|---|---|---|---|
| 15A — Readiness Dashboard | Overall % + 5 dimension scores + key insights + next best actions | new page (e.g. `/jobs/[id]/readiness`) | 🔴 Build | **Scores must come from / extend `lib/readiness/evaluator.ts`** — do NOT create a parallel scorer. Either evaluator emits dimension scores or a thin presenter derives them from its checklist. |
| 15B — Strengthen Weak Areas | Per-dimension uplift (+%), "add leadership story" CTA | new | 🔴 Build | CTAs route into existing coach/evidence flows |
| 15C — Mission Ready | Elite badge, top-% , APPLY NOW → routes to apply gate | new | 🔴 Build | APPLY NOW must route through `/ready-to-apply` |
| existing — Apply gate | ready/blocked split + override (logged) | `app/(dashboard)/ready-to-apply/page.tsx` | ✅ Exists | keep as the canonical gate behind 15C |

**Critical decision for build phase:** the 5-dimension score is the biggest architectural question. It must be sourced from the readiness authority, not a new engine.

---

## 7. Phase F — Apply (HW/11 16A–16C)

| Screen | Intent | Route / Component | Status | Delta |
|---|---|---|---|---|
| 16A — Application Package | Final verified package (resume/cover/evidence) + governance score | `ApplicationPackagePreview` | 🟡 Partial / 🎨 | package summary restyle |
| 16B — Choose Destination | Pick platform (LinkedIn/Indeed/Workday/Greenhouse/Lever/company site) w/ success-rate | new | 🔴 Build | New UI. Submission itself goes through `lib/actions/apply.ts`; external "apply on X" is a hand-off link, not an automated submit unless wired (else disabled per brief §0.7). |
| 16C — Application Submitted | Confirmation + tracking ID + "what happens next" | new | 🔴 Build | Writes via `applyToJob()` (sets `jobs.status='applied'`, inserts `applications`). No second apply path. |

---

## 8. Phase G — Outcomes Loop (HW/11 17A–18A)

| Screen | Intent | Route / Component | Status | Delta |
|---|---|---|---|---|
| 17A — Application Pipeline | Kanban (Applied/Screening/Interview/Final/Offer) + performance + insights | `jobs-pipeline-client.tsx`, `applications/page.tsx` | 🟡 Partial | list exists; kanban + perf charts are new |
| 17B — Interview Tracker | Upcoming/past interviews, prep %, prep center | new | 🔴 Build | **`/jobs/[id]/interview-prep` is non-canonical** (CLAUDE.md) — needs a wired home + schema before building |
| 17C — Offer Tracking | Compare offers, comp breakdown, benefits | new | 🔴 Build | No offer-comp data model today |
| 17D — Outcomes Analytics | Funnel, conversion-over-time, source performance | `app/(dashboard)/analytics/page.tsx` (312 lines, pro-gated) | 🟡 Partial | analytics exists; funnel + source breakdown is enrichment, gated by `plan_type` |
| 18A — Evidence Vault hub | All proof organized (Projects/Achievements/Metrics/Stories/Certs/Education) + evidence score + "used in N apps" | `app/(dashboard)/evidence/page.tsx` (557 lines) | 🟡 Partial | CRUD exists; category hub + evidence-score + usage links are enrichment. **Feeds back into Phase C** — closes the loop. |

---

## 9. Build-status summary

| Phase | Done | Partial | Build |
|---|---|---|---|
| A — Onboarding | — | 4 (vault, found-items, voice, processing-over-existing) | 3 (search-stage, processing UX, game plan) |
| B — Command Center | Job Tracker | Home, Materials | — |
| C — Prove Fit | **most (restyle shipped)** | 12B/F/G/I, 13A | — |
| D — Generation | Version History | Docs-ready, Resume viewer, Governance | Evidence-map viz, Resume-gen viz, Cover viewer |
| E — Readiness | Apply gate | — | Dashboard, Strengthen, Mission Ready |
| F — Apply | — | Package | Choose destination, Submitted |
| G — Outcomes | — | Pipeline, Analytics, Evidence Vault | Interview tracker, Offer tracking |

**Net:** Phase C is the only substantially-shipped phase. Phases D–G are mostly net-new feature surfaces sitting on top of (mostly existing) backend authorities. Phase A needs a real Career-OS rebuild.

---

## 10. Sequencing recommendation (for the build plan, when you greenlight it)

1. **Readiness Dashboard (15A)** — highest leverage; forces the "dimension scores from the one evaluator" decision early, and every later screen references readiness.
2. **Generation visualization + viewers (13A–14C)** — backend is done; pure UI payoff, makes the "100% evidence-backed" promise visible.
3. **Apply flow (16B–16C)** — closes the spine to a real submitted state through `applyToJob()`.
4. **Outcomes (17A/17D) + Evidence Vault hub (18A)** — closes the loop back to Prove Fit.
5. **Career-OS onboarding (Phase A)** — largest rebuild; do once the destination surfaces exist so onboarding can point at them honestly.

**Do not start any of the above without a per-surface scope** confirming: which existing authority it consumes, which schema columns it reads (exact names per `V0_PROVE_FIT_BRIEF §9`), and whether any CTA is unwired (→ render disabled).

---

## 11. Open questions to resolve before building

1. **Readiness dimensions:** does `evaluateReadiness()` get extended to emit the 5 scores, or does a presenter derive them? (Must not be a second engine.)
2. **Materials:** global library vs. per-job documents — the screens imply a global "My Materials".
3. **Interview Prep / Offer Tracking / Learning Hub:** no data models exist; these are net-new domains, currently on the non-canonical-routes list. Confirm scope before wiring.
4. **Search stage & goal:** new `user_profile` fields or `career_context` JSONB — confirm, don't add schema unprompted (CLAUDE.md).
5. **Apply destinations:** real automated submit vs. external hand-off link (disabled-if-unwired per brief).
