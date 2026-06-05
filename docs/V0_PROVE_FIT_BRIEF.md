# HireWire — v0 Prove Fit Brief (Bulletproof Spec)

> **Read this as law, not suggestion.** Every value below is verbatim from the codebase
> (`app/globals.css`, `app/layout.tsx`, `components/hirewire-logo.tsx`, the brand docs).
> Do not substitute, "improve," or infer alternatives. If a value isn't here, ask — do not invent.
>
> You are restyling and assembling **existing, fully-wired** React components into two visual
> languages. You are NOT building backend logic, data, fonts, colors, or copy from scratch.

---

## 0. Hard rules (the only ways v0 can flop — avoid all)

1. **Do not introduce any color outside the token table in §2.** No new hex, no Tailwind palette colors except the exact ones mapped in §2.
2. **Do not use a serif font.** `Playfair Display` is referenced in CSS but is NOT loaded. Only **Inter** and **JetBrains Mono** exist. Headlines are **Inter at weight 900**, not serif.
3. **Do not draw a logo, wordmark, or icon.** Use the `<HireWireLogo />` component (§4). On dark surfaces use `variant="white"`.
4. **Do not invent primitives.** All cards/buttons/dialogs/badges/forms exist in `components/ui/` (shadcn). Reuse them.
5. **Do not invent copy or tone.** Follow the voice rules in §5 and the product language in §6.
6. **Do not compute readiness, apply state, or navigation URLs.** Consume the readiness evaluator output verbatim (§8).
7. **Do not show a CTA that isn't wired.** If no backend exists, render it `disabled`.
8. **Do not add generic SaaS / v0 / shadcn-starter placeholder copy, names, or icons.**

---

## 1. The two visual languages

| | Language 2 — Warm Editorial (DEFAULT) | Language 1 — Industrial Proof (PROVE FIT / COACH ONLY) |
|---|---|---|
| Canvas | Warm off-white `#ede9e3` | Near-black `#0f0e0d` |
| Surface | `.hw-card` white `#faf9f7` + layered shadow | `.hw-card` inside `.hw-proof-context` → `#1a1714` |
| Headlines | `.hw-page-title` (24px semibold) | `.hw-hero-title` (Inter 900, UPPERCASE, compressed) |
| Applies to | dashboard, jobs, documents, applications, analytics, settings, billing, profile | `/jobs/[id]/evidence-match`, Match Interview modal, `/coach` |

The dark mode switch is intentional — entering "prove your fit" should feel like stepping into a different, focused room. That contrast is a feature.

---

## 2. Color tokens — EXACT (from `app/globals.css`)

Tokens are HSL triples consumed as `hsl(var(--token))`. Hex equivalents given for reference only — **use the token, not the hex.**

| Token | HSL | Hex (ref) | Meaning |
|---|---|---|---|
| `--background` | `38 14% 91%` | `#ede9e3` | Warm off-white canvas (Language 2) |
| `--foreground` | `28 12% 10%` | `#1a1714` | Primary text |
| `--card` | `40 20% 98%` | `#faf9f7` | Card surface (Language 2) |
| `--primary` | `0 90% 39%` | `#BD0A0A` | **Supreme Red** — the one brand accent |
| `--primary-foreground` | `0 0% 100%` | `#ffffff` | Text on red |
| `--secondary` | `35 8% 90%` | — | Quiet fills |
| `--muted` | `35 8% 88%` | — | Muted fills |
| `--muted-foreground` | `30 4% 44%` | — | Secondary text |
| `--accent` | `38 12% 93%` | — | Hover/active tints |
| `--panel` | `35 10% 86%` | — | Right-rail / panel bg |
| `--border` | `30 6% 85%` | — | Hairline borders |
| `--success` | `145 50% 40%` | ~`#33a06b` | Verified / proof locked |
| `--warning` | `38 90% 55%` | ~`#f0a92a` | Inferred / caution |
| `--destructive` | `0 90% 39%` | `#BD0A0A` | Same as primary |
| `--radius` | `0.75rem` (12px) | — | base radius; `--radius-lg` = `1rem` |

**Dark Proof Context (Language 1) — exact:**
- Surface background: `#0f0e0d` (owned by `.hw-proof-context`)
- Text: `#f5f2ef`
- Nested card: `#1a1714`, border `rgba(245,242,239,0.08)`
- Red, success, warning tokens stay identical (they read well on dark).

⚠️ **One dark token only.** `components/coach-chat.tsx` currently hard-codes `backgroundColor: "#111110"`. Replace it with the `.hw-proof-context` wrapper (`#0f0e0d`). Do not keep two dark values.

---

## 3. Typography — EXACT (from `app/layout.tsx`)

| Role | Family | CSS var | Tailwind | Notes |
|---|---|---|---|---|
| Body / UI | **Inter** | `--font-inter` | `font-sans` | Loaded via `next/font/google` |
| Mono / data | **JetBrains Mono** | `--font-jetbrains` | `font-mono` | Loaded |
| Display headline | **Inter 900** | — | `.hw-hero-title` | UPPERCASE, `letter-spacing:-0.02em`, `clamp(1.75rem,4vw,2.5rem)` |
| ~~Serif~~ | **Not available** | — | — | `Playfair Display` is declared in CSS but NOT imported. Do NOT use serif. To add one, it must go through `next/font` in `layout.tsx` first — flag it, don't fake it. |

Type scale already in the system: `.hw-page-title` (24px/600), `.hw-page-subtitle` (14px muted), `.hw-section-label` (11px uppercase tracked), `.hw-ticket-label` (10px/700 uppercase), `.hw-stat-value` (30px/700 tabular).

---

## 4. Logo — EXACT (from `components/hirewire-logo.tsx`)

Use the component, never an `<img>` or invented mark:

```tsx
import { HireWireLogo } from "@/components/hirewire-logo"

// Language 2 (warm/light surfaces):
<HireWireLogo variant="color" size="md" />
// Language 1 (.hw-proof-context dark surfaces):
<HireWireLogo variant="white" size="md" />
```

- Props: `variant: "color" | "white" | "light" | "red" | "dark"`, `size: "sm"(80) | "md"(120) | "lg"(150) | "xl"(220)`.
- Source asset: `/public/brand/hirewire-logo.png` only. Native aspect **1536×1024**; height auto — never squash.
- ⚠️ `hirewire-logo-horizontal.png` and `hirewire-logo-transparent.png` are **0-byte / missing** — do not reference them.
- `/public/brand/favicon.ico` is referenced in metadata but **missing** — do not assume it renders.

---

## 5. Brand voice & tone (from metadata + coach copy)

HireWire's voice is **confident, direct, evidence-first, and human** — never hype, never generic SaaS.

Anchor lines (real, from `app/layout.tsx` metadata — match this register):
- "Your job search, grounded in real evidence."
- "AI-generated materials that actually sound like you."
- "HireWire builds your application package from your real career evidence — grounded in truth."
- Coach: "Strategic guidance grounded in your pipeline and Career Context."

**Tone rules:**
- Speak to the user's judgment, not the machinery. "You've proven this" > "Evidence record created."
- Earned confidence, not cheerleading. "PROOF LOCKED IN" ✓ / "Great job!! 🎉" ✗.
- Truth over flattery — never imply a claim is stronger than the evidence supports.
- No emoji in product chrome. No exclamation spam. No "Lorem ipsum", no "Acme", no v0/shadcn placeholder names.

---

## 6. Product language (copy constraints)

**Use:** Prove Fit · Match Interview · Career Context · Application Package · Ready to Apply · proof · source · confirmed · skipped.

**Never surface in primary flows:** database · evidence picker · manual mapping · requirement table · manage evidence · workflow theory · step counters.

Hide the machinery: show only the moment the user's judgment is needed; everything else is automatic, invisible, or summarized as proof.

---

## 7. Design classes & components to reuse

### New proof-language classes (in `app/globals.css`, currently unused — deploy them)
| Class | Use |
|---|---|
| `.hw-proof-context` | Wrap dark proof/coach screens (`#0f0e0d` bg, `#f5f2ef` text; nested `.hw-card` → `#1a1714`) |
| `.hw-hero-title` | Compressed Inter-900 UPPERCASE headline — "PROVE YOUR FIT", "PROOF LOCKED IN" |
| `.hw-ticket` / `.hw-ticket-label` | Requirement ticket-tag card: left red accent stripe + small-caps label |
| `.hw-proof-stamp` (+ `.locked`) | Rotated success stamp for confirmation moments |
| `.hw-badge-verified` / `.hw-badge-inferred` / `.hw-badge-unsupported` / `.hw-badge-pending` | Evidence verification badges |

### Established classes (reuse, never redefine)
`.hw-card` `.hw-page` `.hw-panel` `.hw-page-header` `.hw-page-title` `.hw-page-subtitle` `.hw-metrics` `.hw-stat` `.hw-next-action` `.hw-empty` `.quality-bar` `.status-{draft,analyzing,ready,applied,offered,rejected}`.

### Decoration (exists — reuse, never recreate)
`components/off-white-stripes.tsx` → `DiagonalStripes`, `HazardTape`, `StripedCorner` (already used in the sidebar). Reuse inside `.hw-proof-context` as corner decoration. No new SVG stripes.

### Primitives & utilities
- shadcn/ui (53 components) in `components/ui/`: button, card, dialog, alert-dialog, drawer, sheet, badge, tabs, accordion, select, form, input, textarea, progress, skeleton, table, popover, tooltip.
- `cn()` from `lib/utils.ts` for conditional classes. Toasts via `sonner` (`<Toaster position="bottom-right" richColors closeButton />`, already mounted).

### Wired product components (restyle, do not replace)
| Area | Component | Path |
|---|---|---|
| Prove Fit flow | `GuidedRequirementCoachFlow` | `components/coach/GuidedRequirementCoachFlow.tsx` |
| Gap drawer | `GapCoachDrawer` (`RequirementCoachModal`) | `components/coach/GapCoachDrawer.tsx` |
| Match Interview | `MatchInterviewModal` + Header/Thread/Composer/EvidenceSummaryCard/EvidenceSuggestionCard/ConfidenceBadge/QuickReplyChips | `components/match-interview/` |
| Coach chat | `CoachChat` | `components/coach-chat.tsx` |
| Readiness | `ReadinessChecklist`, `ReadinessReview`, `ReadinessContextBanner`, `NextStepButton` | `components/ReadinessChecklist.tsx`, `components/workflow/` |
| Documents | `ApplicationPackagePreview`, `ResumePreviewPanel`, `ResumeExportMenu`, `VoiceIntegrityCard` | `components/documents/` |

---

## 8. Integration contracts — consume, never reinvent

- **Readiness:** `lib/readiness/evaluator.ts` → `evaluateReadiness(job)` is the ONLY readiness authority. Returns `{ isReady, canApply, canGenerate, stage, displayState, displayLabel, displayClassName, outcome, blockedReasons[], checklist{resume,coverLetter,evidence,coach,quality,voiceIntegrity}, nextAction{label,href,description} }`. **Render `displayLabel`/`displayClassName`; follow `nextAction.href` verbatim.**
- **Apply:** `lib/actions/apply.ts` → `applyToJob(...)` is the only path that sets `jobs.status='applied'`/`applied_at`, inserts `applications`, logs overrides. All apply CTAs route through `/ready-to-apply`.
- **Generation:** POST `app/api/generate-documents/route.ts` `{ job_id, force_regenerate?, selected_evidence_ids? }` → writes `jobs.generated_resume/generated_cover_letter/quality_passed/evidence_map`; returns `{ success, evidence_map, generated_resume, generated_cover_letter, quality_check, governance }`. Content is grounded in `evidence_library` — never fabricate employers, dates, metrics, scope.
- **Never** use `jobs.status === "ready"` as readiness truth (`jobs.status` is outcome/history).
- **Non-canonical routes — never link:** `/jobs/[id]/red-team`, `/jobs/[id]/interview-prep`, `/companies`, `/templates`, `/manual-entry`.

---

## 9. Supabase data contract (Server Components fetch; v0 honors shapes)

**Auth/RLS:** every user-owned table is RLS-scoped by `auth.uid() = user_id`. Read with the authenticated server client; never trust a `user_id` from input. Coach child tables scope through `coach_sessions.user_id`.

**JSONB safety:** columns may be `null` / `{}` / array. Always `const x = Array.isArray(v) ? v : []` before `.map()`. Never `v || []`.

**Exact column names (wrong name = the #1 failure):**

| Table | Use | Never use |
|---|---|---|
| `jobs` | `role_title`, `company_name` | `title`, `company` |
| `job_analyses` | `title`, `company` | `role_title`, `company_name` |
| `source_resumes` | `file_name`, `parsed_text` | `filename`, `content_text` |
| `user_profile` | `website_url`, `github_url` | `portfolio_url`, `linkedin_url` |
| `evidence_library` | `confidence_level` | `confidence_score` (not a display authority) |

**Tables backing these screens (UI-relevant columns):**
- `jobs` — `id, user_id, role_title, company_name, status, fit, score, score_gaps[], evidence_map(jsonb), gap_clarifications(jsonb), gaps_addressed[], generated_resume, generated_cover_letter, quality_passed, generation_status, voice_drift_result(jsonb), voice_integrity_passed, outcome, applied_at, created_at`
- `evidence_library` — `id, user_id, source_type, source_title, confidence_level('high'|'medium'|'low'), outcomes[], is_user_approved, is_active, visibility_status, provenance('resume_import'|'linkedin_import'|'coach_session'|'user_manual'), coached_version`
- `job_analyses` — `job_id, user_id, title, company, qualifications_required[], qualifications_preferred[], responsibilities[], matched_skills[], known_gaps[], requirements_structured(jsonb), strengths_json(jsonb), gaps_json(jsonb)`
- `prove_fit_decisions` — `user_id, job_id, requirement_id, requirement_text, decision('auto_mapped'|'confirmed'|'skipped'), evidence_id, claim_text, skip_reason, session_id` (immutable; unique `(user_id,job_id,requirement_id,decision)`)
- `coach_sessions` — `id, user_id, job_id, gap_requirement, gap_requirement_id, status`; `coach_messages` — `session_id, role, content`; `coach_evidence_drafts` — `session_id, user_id, job_id, requirement_id, source_title, proof_snippet, confidence_level, status, confirmed_row_id`
- `source_resumes` — `user_id, file_name, file_type, parsed_text, parsed_data(jsonb), parse_status, is_primary, label`
- `user_profile` — `user_id, full_name, headline, email, website_url, github_url, experience(jsonb), education(jsonb), career_context(jsonb), onboarding_complete`
- `application_outcomes` — `user_id, job_id, outcome, outcome_date, days_to_response, fit_score, interview_rounds, notes` (unique `(user_id,job_id)`)

---

## 10. Screen-by-screen

### 10A. Prove Fit — `/jobs/[id]/evidence-match` (Language 1, dark)
Server Component, `force-dynamic`. Fetches `jobs`, `evidence_library`, `job_analyses`, `prove_fit_decisions`; readiness via `evaluateReadiness()`; gaps via `listUnresolvedRequirements()`.
Requirement shape: `requirement_text, priority('required'|'preferred'|'keyword'), status('met'|'partial'|'gap'|'unknown'), confidence('high'|'medium'|'low'), proof_decision('auto_mapped'|'confirmed'|'skipped'|'needs_judgment'), matched_evidence_titles[], proof_needed[]`.
**Restyle:** wrap in `.hw-proof-context`; page headline "PROVE YOUR FIT" via `.hw-hero-title`; convert each requirement (`.hw-requirement-card`) to `.hw-ticket` + `.hw-ticket-label`. Status → badge: `met`=`hw-badge-verified`, `partial`=`hw-badge-inferred`, `gap`/`unknown`=`hw-badge-unsupported`, `keyword`=`hw-badge-pending`.
**Wired actions:** "Start Match Interview" → `MatchInterviewModal` (POST `/api/coach/sessions`); `RebuildEvidenceMapButton` → POST `/api/jobs/{id}/rebuild-evidence-map`; confirm/skip → `prove_fit_decisions` (feeds readiness).

### 10B. Match Interview modal (Language 1, dark) — fully wired, NOT a stub
Props: `{ open, onOpenChange, jobId, jobTitle, company, requirement, currentIndex, totalCount, onPrev, onNext, onStepSaved }`.
Endpoints: POST `/api/coach/sessions`, POST `/api/jobs/{id}/coach-step` (`answer`|`skip`|`complete`), `/api/coach/sessions/{id}/messages`, `/api/coach/evidence-drafts/{id}/confirm`.
Confidence levels: `strong|partial|weak|missing|needs_review`.
**Restyle:** whole modal in `.hw-proof-context`; on "Confirm proof" show `.hw-proof-stamp.locked` ("PROOF LOCKED IN"); "PROOF SUMMARY" label → `.hw-ticket-label`.

### 10C. Coach — `/coach` (Language 1, dark)
Server Component; fetches pipeline context + readiness; renders `CoachChat` (streams `/api/coach`). **Restyle:** wrap in `.hw-proof-context`; remove the inline `#111110`. Use `<HireWireLogo variant="white" />` in the header.

### 10D. Ready to Apply — `/ready-to-apply` (Language 2, warm)
Splits jobs via `evaluateReadiness()` into ready/blocked; renders `ReadinessChecklist`, `ReadinessContextBanner`, displayLabel badges. Override flow collects a reason string and routes through the apply action (logged). Keep honest.

### 10E. Documents — `/jobs/[id]/documents` (Language 2, warm)
`ApplicationPackagePreview` / `ResumePreviewPanel` from `jobs.generated_resume` + `jobs.generated_cover_letter`. Read-only canonical content — never invent document text.

---

## 11. Acceptance criteria (v0 self-check before returning)

1. ☐ No color used outside §2; no serif font; headlines are Inter 900.
2. ☐ Language 2 surfaces (dashboard/jobs/documents/applications/analytics/settings) unchanged warm off-white.
3. ☐ `/jobs/[id]/evidence-match`, Match Interview modal, `/coach` wrapped in `.hw-proof-context`; the `#111110` inline style removed (one dark token).
4. ☐ Requirement cards use `.hw-ticket` + `.hw-ticket-label`; statuses map to `.hw-badge-*`; page headline uses `.hw-hero-title`.
5. ☐ Confirming a proof shows `.hw-proof-stamp.locked`.
6. ☐ Logo via `<HireWireLogo />` (`variant="white"` on dark); no invented marks; 0-byte assets untouched.
7. ☐ Voice matches §5; product language matches §6; no placeholder/SaaS/v0 copy.
8. ☐ Data uses exact §9 column names + `Array.isArray` guards; readiness/apply/generation go through §8 authorities.
9. ☐ No new primitives; no unwired CTAs (disabled if no backend); diagonal stripes reuse `off-white-stripes.tsx`.

## 12. v0 must report back
- All files touched.
- Any remaining generic/placeholder copy.
- Any missing assets it needed (e.g. favicon, dark logo, serif font) — list, do not fabricate.
- Any surface it could not brand without a backend or asset.
</content>
</invoke>
