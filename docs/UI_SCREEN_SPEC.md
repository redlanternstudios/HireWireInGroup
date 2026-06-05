# HireWire — Full UI Screen Spec (Visual + Feature, per screen)

> Companion to `docs/NEW_USER_JOURNEY.md` (the map). This is the **spec**: for every screen in
> the HireWire UI User Journey set, the exact palette (token-referenced), typography, component
> reuse, and an exhaustive feature enumeration.
>
> **Color law (from `docs/V0_PROVE_FIT_BRIEF.md §0.1`): no color outside the token table.**
> Therefore every palette below references **tokens**, never raw hex. Where a screenshot shows a
> color that is NOT in the token set, it is called out under **⚠ Off-token** — that is a decision
> to make (map to nearest token, or add a documented token), not a license to hardcode hex.
>
> Last updated: 2026-06-04. Status marks: ✅ Exists · 🟡 Partial · 🔴 Build · 🎨 Restyle.

---

## Token & class vocabulary (the only allowed building blocks)

**Color tokens** (`hsl(var(--token))`): `--background` `--foreground` `--card` `--card-foreground`
`--primary` (Supreme Red) `--primary-foreground` `--secondary` `--muted` `--muted-foreground`
`--accent` `--panel` `--border` `--input` `--success` (verified/locked) `--warning` (inferred/caution)
`--destructive` `--radius`. **Dark proof context** (`.hw-proof-context`): bg `#0f0e0d`, text `#f5f2ef`,
nested card `#1a1714`, border `rgba(245,242,239,.08)` — owned by the class, do not restate.

**Typography:** Inter (`font-sans`), JetBrains Mono (`font-mono`), `.hw-hero-title` (Inter 900 UPPERCASE),
`.hw-page-title` (24/600), `.hw-page-subtitle` (14 muted), `.hw-section-label` (11 upper tracked),
`.hw-ticket-label` (10/700 upper), `.hw-stat-value` (30/700 tabular). **No serif.**

**Real `hw-*` classes:** `hw-card hw-page hw-page-header hw-page-title hw-page-subtitle hw-panel
hw-metrics hw-stat hw-stat-label hw-stat-value hw-section-label hw-ticket hw-ticket-label
hw-hero-title hw-proof-context hw-proof-stamp hw-badge-{verified,inferred,unsupported,pending}
hw-next-action hw-empty hw-btn-primary hw-preview-chrome hw-watermark hw-workspace
hw-workspace-{main,rail} hw-requirement-card`. **Status:** `status-{draft,analyzing,ready,applied,offered,rejected}`.

**Primitives (`components/ui/`, reuse — never reinvent):** accordion alert alert-dialog avatar badge
breadcrumb button card carousel **chart** checkbox dialog drawer dropdown-menu empty form input label
popover progress radio-group scroll-area select separator sheet skeleton slider sonner switch table
tabs textarea toggle tooltip. **Decoration:** `components/off-white-stripes.tsx`
(`DiagonalStripes`/`HazardTape`/`StripedCorner`), `components/hirewire-logo.tsx`.

---

## ⚠ Global off-token colors observed across the set (resolve before building)

These recur in the screenshots and are **not** in the token table. Recommendation per the brief:

| Observed | Where | Recommendation |
|---|---|---|
| **Purple** AI/coach accent | 15B AI coach, 16C pro tip, 17D AI insights, 18A AI suggestion, version-history dots | Recurring *semantic* (= "AI"). Either map to `--primary` or **add one token** `--ai` (documented once). Don't sprinkle raw purple. |
| **Blue** info/privacy banner | 12B, 13A/B, 14A "private & secure" banners | Map to a single `--info` token or reuse `--muted`/`--panel`. Today these banners are inconsistent. |
| **Categorical chart palette** (green/blue/orange/purple lines; multi-slice donuts) | 17C comp-over-time, 17D funnel + source donut | Charts genuinely need >1 hue. Use the `chart` primitive's documented palette tokens; register them once, don't inline. |
| **Onboarding icon-circle tints** (yellow/orange/blue/gray/pink/teal) | screens 1, 5; 18A category icons | Decorative only. Recommend deriving from `--muted` fills + `--primary`/`--success`/`--warning`, OR a documented decorative tint set. |
| **Third-party brand logos** (LinkedIn/GitHub/Workday/company marks) | onboarding sources, tracker, choose-destination | Logos are allowed as-is (they're brand assets, not theme color). Keep on neutral `--card`/`--muted` chips. |
| **Green "confirmed/verified"** | proof stamps, mission-ready, governance | ✅ already = `--success`. No action. |
| **Amber "needs work/medium"** | confidence medium, NEEDS WORK chips | ✅ already = `--warning`. No action. |

---

# PHASE A — Career OS Onboarding (Language 2 — Warm)

> Current code is a 4-step `welcome→resume→profile→complete` ([app/onboarding/page.tsx](app/onboarding/page.tsx)).
> These 5 Career-OS screens are a rebuild. All warm canvas. Use `<HireWireLogo variant="color" />`,
> top progress bar (`progress` primitive), `CAREER OS` wordmark in `--primary`, `N OF 5` + `%`.

### A1 — "Where are you in your search?" · 🔴 Build
- **Palette:** canvas `--background`; option cards `--card` w/ `--border`; selected card border+ring `--primary`; CTA `hw-btn-primary`; progress fill `--primary`. ⚠ Off-token: the 5 icon-circle tints (red/yellow/orange/blue/gray).
- **Type:** `.hw-page-title` ("Where are you in your search?"), `.hw-page-subtitle`, `.hw-section-label` ("CAREER OS").
- **Components:** `radio-group` (single-select cards), `card`, `button`, `progress`.
- **Features:** 5 mutually-exclusive options (Just starting / Applying-no callbacks / Interviews-not offers / Changing fields / Returning after gap), each w/ icon + title + sub; live radio selection state; "1 OF 5 · 20%" header + footer mini-bar; CONTINUE → step 2; selection shapes coaching tone downstream.
- **Data:** persist search stage — confirm `user_profile.career_context` JSONB vs. new column (don't add schema unprompted).

### A2 — "Build your Evidence Vault" · 🟡 Partial
- **Palette:** `--card` source tiles; selected primary tile border `--primary` + check; "Pending" chip = `hw-badge-pending`; vault-strength meter fill `--primary` (`progress`); section labels `--primary`/`--muted-foreground`. ⚠ Off-token: brand logos (allowed).
- **Type:** `.hw-hero-title`-adjacent bold ("Build your Evidence Vault"), `.hw-section-label` ("A. PRIMARY SOURCE (REQUIRED, PICK ONE)").
- **Components:** `card`, `radio-group` (primary), `checkbox`/toggle tiles (enrich), `progress`, `badge`.
- **Features:** **Primary source = required, pick-one** (Upload Résumé / Paste Résumé Text / Paste LinkedIn); **Enrich = optional multi-select** 8 tiles (GitHub, Website, LinkedIn, Portfolio, Project PDF, Twitter/X, Instagram, YouTube) each w/ "Pending" state chip; "N sources connected" counter; "Vault strength" meter; BUILD MY VAULT (disabled until primary chosen).
- **Wired:** upload→`/api/resume/upload`; LinkedIn→`/api/linkedin/import`; GitHub→`/api/parse-github`. Unwired sources render disabled per brief §0.7.

### A3 — "Building your Evidence Vault…" (processing) · 🔴 Build
- **Palette:** circular spinner ring `--primary` on `--muted` track; checklist done-icons `--success`, active `--primary` spinner, pending `--muted-foreground`; "Found N items" pill `--card`+`--border`; verified banner tint `--success` on faint wash. 
- **Type:** bold title, `.hw-page-subtitle` ("This may take a few minutes.").
- **Components:** `progress` (circular), `spinner`, list, `card`.
- **Features:** animated logo spinner; 6-row live checklist (Résumé uploaded ✓ / Parsing work history / Extracting projects & achievements / Building evidence items ⟳ / Connecting GitHub / Scanning portfolio); running "Found **47** evidence items so far" counter; "Every item is verified against your sources. No guesswork. Just proof." trust banner; "3 OF 5 · Processing your vault… · 60%".
- **Note:** pure UX over existing parse pipeline — **no new backend, no fabricated items.**

### A3b — "Here's what HireWire found about you" (review) · 🟡 Partial
- **Palette:** tabs active underline `--primary`; source chip `--muted`; "Approved" badge `hw-badge-verified`, "Needs review" `hw-badge-inferred`/`hw-badge-pending`; left card accent stripe by state (`--success`/`--warning`/`--primary`); skill tags `--secondary`; Approve/Edit/Remove `button` variants.
- **Type:** `.hw-page-title`, `.hw-section-label`.
- **Components:** `tabs`, `card`, `badge`, `button`, `scroll-area`.
- **Features:** category tabs w/ counts (Work 83 / Projects 67 / Certs 46 / Education 20 / Portfolio 2 / Skills 2); per-item card = source chip + title + org + dates + description + skill tags + status badge + **Approve / Edit / Remove**; footer "19 of 83 items approved · Minimum 3 required to continue"; "Continue with N items" CTA disabled <3.
- **Data:** writes `evidence_library.is_user_approved`; min-3 is a UI gate, not readiness truth.

### A4 — "How should HireWire write for you?" (Voice Profile) · 🟡 Partial
- **Palette:** writing-sample quote card `--muted`/`--card` w/ `--primary` quote mark; selected mode card border+ring `--primary`; preview text italic `--muted-foreground`; lock toggle `switch`; CTA `hw-btn-primary`.
- **Type:** `.hw-page-title`, `.hw-section-label` ("YOUR WRITING SAMPLE").
- **Components:** `radio-group`, `card`, `switch`, `button`.
- **Features:** extracted writing-sample blockquote; 2 modes — **Preserve My Voice** / **Polish Lightly** — each w/ icon + description + italic Preview; "Lock this choice (can be overridden per job)" `switch`; SET MY VOICE; "4 OF 5 · 80%".
- **Data:** maps to existing `lib/voice/*` (`VoiceProfile`); capture-at-onboarding is the new part.

### A5 — "You're all set! Let's build your game plan." · 🔴 Build
- **Palette:** profile card `--card`; avatar circle `--primary`-tinted; "Profile Complete" badge `hw-badge-verified`; 4-stat row `.hw-stat`/`.hw-stat-value`; goal options `radio-group` w/ icon tints (⚠ off-token blue/green/orange/purple) → recommend tokens; "Your plan includes" panel `--panel` w/ `--success` checks; CTA `hw-btn-primary`.
- **Type:** bold split headline, `.hw-page-subtitle`.
- **Components:** `avatar`, `card`, `badge`, `radio-group`, `button`.
- **Features:** profile summary (name, role, location, Profile Complete) + 4 stats (Work items approved / Projects added / Certifications found / Sources connected); "What's your next move?" 4 goals (Land a new role / Grow in current role / Change fields / Keep learning); "Your plan includes" checklist (Personalized materials / Smart apply strategy / Interview prep / Ongoing coaching); BUILD MY GAME PLAN → dashboard; "5 OF 5 · 100%".

---

# PHASE B — Command Center (Language 2 — Warm)

### B1 — Home / "Welcome back" · 🟡 Partial / 🎨 — `app/(dashboard)/dashboard/page.tsx`
- **Palette:** Career-OS card `--card` w/ `--primary` % + bar; tool tiles `--card` w/ icon-circle tints (⚠ off-token — map to tokens); activity icons by type (`--success`/`--primary`/`--warning`/⚠purple); "You're ready to win" banner faint `--primary` wash + trophy; bottom tab bar active `--primary`.
- **Components:** `card`, `progress`, list, `avatar`, bottom-nav (`sidebar`/custom).
- **Features:** Career OS % + "View my plan"; **Your tools** 6-tile grid (My Materials, Job Tracker, Interview Prep⚠, Learning Hub⚠, Career Coach, Progress); Recent activity feed (4 timestamped items); "You're ready to win" CTA banner; bottom tabs (Home/Materials/Job Tracker/Messages/Account).
- **⚠ Canonical:** Interview Prep & Learning Hub tiles are non-canonical (CLAUDE.md) — disable or omit until wired.

### B2 — My Materials · 🟡 Partial — `app/(dashboard)/documents/page.tsx`
- **Palette:** stat row `.hw-stat`; status chips → `status-ready`(green)/`status-draft`/`hw-badge-pending`; "Archived" `--muted`; New Material `hw-btn-primary`; Pro Tip banner faint `--primary`.
- **Components:** `tabs`, `card`, `badge`, `button`, `dropdown-menu` (⋯ actions), `popover` (Filters).
- **Features:** New Material CTA; tabs All/Resumes/Cover Letters/LinkedIn/Other + Filters; stat row (12 Total / 8 Ready / 3 In Progress / 1 Archived); material cards (icon + title + type + updated date + status + ⋯); Pro Tip + Learn How.
- **Decision:** global library vs. per-job docs (see journey doc Q2).

### B3 — Job Tracker · ✅ Exists / 🎨 — `app/(dashboard)/jobs/page.tsx`, `applications/page.tsx`
- **Palette:** 5-stat icon row (tinted per stage — map to `status-*` token colors); status badges = `status-{applied,offered,rejected}` + amber interviewing; company logos on `--card`; left card accent by stage.
- **Components:** `card`, `badge`, `tabs`, `popover`, `button`, `dropdown-menu`.
- **Features:** Add Application CTA; stat row (18 Applied / 7 Interviewing / 3 Offer / 2 Accepted / 6 Rejected); tabs All/Applied/Interviewing/Offer/Accepted/Rejected + Filters; app cards (logo + role + company + location/type + applied date + status badge + ⋯); tips banner.
- **Data:** counts derive from `jobs.status` (outcome state) — never from readiness.

---

# PHASE C — Prove Fit / Industrial Proof (Language 1 — Dark `.hw-proof-context`)

> The shipped phase (commit `abbaaaf`). Chrome: HW/11 ticket tag (`HW/11 · COACH · 12x · STEP n OF 10`),
> top header (target / bell-w-dot / menu), footer "HIREWIRE™ CAREER INTELLIGENCE SYSTEM · PRIVATE. SECURE.",
> corner `HazardTape`/`StripedCorner`, `<HireWireLogo variant="white" />`. Coach Session Progress stepper + "GAP 0n OF 04".

### C-12A — "Prove your fit" (unconfirmed requirement) · ✅ 🎨 done — `evidence-match/page.tsx`
- **Palette:** dark ctx; UNCONFIRMED card faint `--warning` wash + `--warning` warn-icon; requirement title `.hw-hero-title`; IMPORTANCE bars `--primary` (4/5 filled) + `--muted` empty; AI msg block nested `#1a1714`; CTA `hw-btn-primary` (SHOW MY EVIDENCE).
- **Components:** `card`, `badge`, ticket (`hw-ticket`/`hw-ticket-label`), `progress` (session stepper), `button`.
- **Features:** ticket tag; "UNCONFIRMED REQUIREMENT" + requirement name + importance (HIGH, 4/5 bars); "What they're really checking" 4-row checklist; HireWire AI intro ("I found several experiences…"); session stepper (1/5) + GAP 01 OF 04; SHOW MY EVIDENCE.

### C-12B — "Top evidence matches" · 🟡 Partial
- **Palette:** top-match card faint `--success` wash + `--success` border + "TOP MATCH" chip; confidence: 92 Very High `--success`, 75 High `--warning`, 68 Medium `--warning`; radio selection `--primary`; "Browse all evidence" row `--card`. ⚠ Off-token: blue privacy banner → map to `--info`/`--muted`.
- **Components:** `radio-group`, `card`, `badge`, `button`.
- **Features:** ranked vault matches (title + role + dates + snippet + confidence % + label); select-one radios; BROWSE ALL EVIDENCE; AI recommendation note; privacy banner; BACK / "USE {evidence} EXPERIENCE".

### C-12C/D/E — Match Interview (problem → action → impact → extras) · ✅ 🎨 done — `components/match-interview/*`
- **Palette:** dark ctx; AI bubbles nested `#1a1714` w/ `--primary` sparkle; user bubbles near-black `--foreground` inverse w/ `✓✓` read ticks `--muted-foreground`; example hint text `--muted-foreground`; composer `input` on `--input`; send btn `--primary`.
- **Components:** chat thread (custom), `textarea`/`input`, `button`, `progress`.
- **Features (per step):** 12C business-problem Q + answer; 12D actions Q (w/ "Think strategy, planning…" hint) + answer; 12E measurable-outcome Q + answer + extras Q (team/timeline/budget); progress stepper advances each step; "Everything you share is private…" footer.

### C-12F — "Here's your drafted proof" · 🟡 Partial
- **Palette:** YOUR DRAFTED PROOF card faint `--success` border on dark; "THIS PROOF SHOWS" 4 icons `--primary`; choice buttons outline `--primary` (Looks good / Needs edits / Something missing).
- **Components:** `card`, `button`, ticket label.
- **Features:** AI-drafted proof paragraph; "This proof shows" Vision/Stakeholder/Execution/Impact icon row; "Does this sound accurate?" + 3 response buttons; composer for free-text refine.

### C-12G — "Let's make it even stronger" · 🟡 Partial
- **Palette:** UPDATED PROOF card `--success` border; **diff highlights = `--success`** on added clauses ("Led a team of 6", "managed a $150K budget", "increased adoption by 37%"); buttons: This looks perfect (`--success`) / Make another change (`--warning`) / Keep refining (`--primary`).
- **Features:** user refinement msg; AI confirmation; updated proof w/ green-highlighted additions; 3-way confirm/refine choice.

### C-12H — "Proof locked in" · ✅ 🎨 done (`.hw-proof-stamp.locked`)
- **Palette:** REQUIREMENT CONFIRMED green shield `--success`; rotated **LOCKED stamp** `hw-proof-stamp locked` (`--success`); confirmed-proof card `--success` border + green diff highlights retained; "THIS PROOF DEMONSTRATES" 4 icons `--success`; What's next CTA `hw-btn-primary`.
- **Features:** confirmation headline; green shield + LOCKED stamp; confirmed proof; demonstrates row; "You've completed 1 of 4 requirements" + CONTINUE TO NEXT REQUIREMENT + View all requirements.

### C-12I — "Great progress / check your status" · 🟡 Partial
- **Palette:** YOUR PROOF PROGRESS stepper — node 1 `--success` (CONFIRMED), node 2 `--primary`/`--warning` (IN PROGRESS), nodes 3–4 `--muted` (PENDING); confirmed proof card `--success`.
- **Components:** stepper (custom), `card`, `badge`, `button`.
- **Features:** 4-node requirement progress (1 confirmed / 1 in-progress / 2 pending); confirmed-proof recap card w/ demonstrates icons; CONTINUE TO NEXT REQUIREMENT.

### C-13A — "Final step — tie it all together" · 🟡 Partial
- **Palette:** YOUR FINAL PROOF card `--success` border w/ full green-highlight summary; REQUIREMENT COMPLETE green trophy `--success`; CTA `hw-btn-primary` (VIEW ALL MY PROOF).
- **Features:** closing summary chat + AI "added that to complete your proof"; full finalized proof; "REQUIREMENT COMPLETE!" + VIEW ALL MY PROOF.
- **Authority:** all confirm/skip → `prove_fit_decisions`; readiness via `evaluateReadiness()`.

---

# PHASE D — Generation Spine (Language 1 chrome → Language 2 viewers)

> Backend = `app/api/generate-documents/route.ts` (high-risk). Content from `jobs.generated_resume`/
> `generated_cover_letter` only — viewers never invent text. Pipeline tag: `HW/11 · GENERATION · 13x · STEP n OF 5`.

### D-13A(gen) — "Evidence Mapping" · 🔴 Build
- **Palette:** 3 columns on `--card`; MATCH chips `hw-badge-verified`; CONFIRMED req labels `--success`; "PROOF BUILDING" cards faint `--muted` + spinner `--primary`; **GENERATION PIPELINE** bar (dark band) — active step `--primary`, done `--success`, pending `--muted`; "100% Evidence-Backed" `--success`; ⚠ blue privacy banner.
- **Components:** `card`, `badge`, connector lines (custom SVG/`DiagonalStripes`), `progress`, stepper.
- **Features:** Role Requirements ↔ Approved Evidence (file-type icons + MATCH) ↔ Generated Proof (building) 3-col map; 5-step pipeline (Evidence Mapping → Resume Gen → Cover Letter Gen → Governance Check → Package Complete); est. time remaining; VIEW PIPELINE DETAILS.

### D-13B — "Resume Generation" · 🔴 Build
- **Palette:** LIVE RESUME PREVIEW `hw-preview-chrome` skeleton; section chips NEW (`--primary`)/BUILDING (`--success` wash)/PENDING (`--muted`); RESUME SECTIONS checklist COMPLETE `--success`, IN PROGRESS `--primary` spinner, PENDING `--muted`; "Built from your verified proof" banner `--success`.
- **Components:** `skeleton`, `card`, `badge`, `progress`, list.
- **Features:** live skeleton resume (name, role, contact, sections) w/ per-section build state; section checklist (Professional Summary / Experience / Key Achievements / Skills / Education / Final Polish); "View Evidence Map"; pipeline bar (step 2 active).

### D-14A — "Your documents are ready" · 🟡 Partial / 🎨 — `ApplicationPackagePreview`
- **Palette:** 3 package cards `--card` w/ COMPLETE chips `hw-badge-verified`; per-card check-lists `--success`; READINESS AT A GLANCE radial `--success` 100%; "What's next" 3 action rows tinted (`--primary`/`--success`/⚠blue); journey progress bar `--success` done + `--primary` current.
- **Components:** `card`, `badge`, `progress` (radial), `button`.
- **Features:** Role-Specific Resume / Personalized Cover Letter / Evidence Map cards each w/ feature check-list + Preview + Download PDF; Readiness at a Glance (Documents/Evidence/Governance/Role/Impact ✓) + "100% Ready"; What's Next (Check Readiness / I'm Ready to Apply / Track Outcomes); journey progress (Target Role→…→Documents Ready).

### D-14A(viewer) — "Resume Viewer" · 🟡 Partial — `ResumePreviewPanel`, `jobs/[id]/resume`
- **Palette:** left vertical nav rail (`hw-workspace-rail`) — done steps `--success`, current `--primary`, pending `--muted`; "VERIFIED & EVIDENCE-BACKED" badge `--success`; per-bullet "Verified" `--success` + "VIEW SOURCE" link `--primary`/⚠blue; VIEW MODE tabs underline `--primary`.
- **Components:** `card`, `tabs`, `badge`, `button`, nav rail, `dropdown-menu` (zoom/print).
- **Features:** journey nav rail (Job Analysis…Intelligence); resume body w/ **per-bullet Verified + VIEW SOURCE**; VIEW MODE Standard/Compact + zoom + print; HireWire AI side note; Edit Resume / Regenerate / Download PDF; SHOW MORE EXPERIENCE.

### D-14B — "Cover Letter Viewer" · 🔴 Build
- **Palette:** body text `--foreground`; **highlighted spans color-coded by evidence** ↔ right sidebar 4 evidence cards (⚠ off-token green/blue/purple/orange — use the chart/categorical palette tokens, documented once); each evidence card "Verified" `--success`.
- **Components:** `card`, highlight spans (custom), connector lines, `badge`, `tabs` (Standard/Clean).
- **Features:** letter body w/ inline colored proof spans; right "BUILT FROM YOUR VERIFIED EVIDENCE" sidebar mapping each span → evidence (ServiceNow Experience / Stakeholder Leadership / Results & Impact / Executive Communication); Edit / Regenerate / Download.

### D-14C — "Governance View" · 🟡 Partial — `app/(dashboard)/integrity/*`
- **Palette:** "100% VERIFIED · NO AI HALLUCINATIONS" `--success`; Claim/Proof/Evidence chain — CLAIM `--primary`/blue icon, PROOF `--success`, EVIDENCE `--secondary`/purple⚠; VERIFIED chips `hw-badge-verified`; right detail panel `--panel`.
- **Components:** `tabs` (Resume Bullets/Cover Letter/All Claims), `card`, `badge`, `separator`, `button`.
- **Features:** Claim → Proof → Evidence Source vertical chain per bullet; right BULLET DETAILS panel w/ evidence items + dates + VIEW EVIDENCE; Filter dropdown; Export Governance Report / Share View / Download Full Package.

### D-14D — "Version History" · ✅ 🎨 — `components/documents/ResumeVersionHistory.tsx`
- **Palette:** timeline dots — latest `--success`, others ⚠purple/blue (→ token); version chips `--secondary`; author badges (You vs HireWire AI ⚠purple); right VERSION SUMMARY `--panel`; CREATE NEW VERSION `hw-btn-primary`.
- **Components:** timeline (custom), `card`, `badge`, `avatar`, `dropdown-menu`, `button`.
- **Features:** version timeline (1.2 Current → 1.1 → 1.0 Initial → 0.2 → 0.1) w/ change notes + author + timestamp; right summary (Total Versions / First Created / Last Updated / Active / Documents Updated); Restore / View Change Log / Create New Version; Compare two versions.

---

# PHASE E — Readiness (Language 2 — Warm)

> ⚠ **Architectural rule:** the 5 dimension scores MUST come from / extend `lib/readiness/evaluator.ts`.
> No parallel scorer (CLAUDE.md). Tag: `HW/11 · STEP 15x OF 15C`.

### E-15A — "Readiness Dashboard" · 🔴 Build (new `/jobs/[id]/readiness`)
- **Palette:** APPLICATION READY % big `--success` + radial (`--success` on `--muted` track); dimension rows — STRONG `--success`, NEEDS WORK `--warning`; Key Insights check `--success`/warn `--warning`; Next Best Actions STRENGTHEN buttons `--primary` outline; "100% EVIDENCE-BACKED" `--success`; left nav rail.
- **Components:** `card`, `progress` (radial + bars), `badge`, `button`, nav rail, `tooltip` ("How we calculate scores").
- **Features:** overall % + radial + target role + VIEW ROLE ANALYSIS; **READINESS BREAKDOWN** 5 dims (Resume Quality 90 / Proof Strength 92 / Leadership Evidence 72 / ATS Compatibility 94 / Impact Metrics 86) each = icon + label + bar + % + STRONG/NEEDS WORK + chevron; Key Insights (4); Next Best Actions (3, AI-recommended) w/ STRENGTHEN; Download Readiness Report; Continue to Next Step.

### E-15B — "Strengthen Weak Areas" · 🔴 Build
- **Palette:** current 87% / target 94% radials `--success`; uplift deltas `+7/+4/+3%` `--success` arrows; AREAS TO STRENGTHEN cards w/ NEEDS WORK `--warning` + current-impact bar `--warning` + potential `--success`; **AI COACH RECOMMENDS panel ⚠purple** → `--ai`/`--primary`; ADD LEADERSHIP STORY button ⚠purple; "TOP 20%" trophy `--success`.
- **Components:** `card`, `progress`, `badge`, `button`, `accordion` ("View all weak areas").
- **Features:** 87→94 improvement framing; per-area cards (Leadership Evidence +7% / Quantified Results +4% / Executive Communication +3%) w/ STRENGTHEN; AI coach recommendation (focus order + bullet criteria) + suggested-next-step card + ADD LEADERSHIP STORY + See example stories; top-20% trophy; Back to Dashboard / Strengthen Now.

### E-15C — "Mission Ready" · 🔴 Build
- **Palette:** MISSION READY green wings/star badge `--success`; top-13% + "ELITE" chip `--success` wash; 5 score circles all `--success` (Role 92 / Proof 95 / Resume 94 / ATS 94 / Impact 88); rocket illustration `--success` line; APPLY NOW `hw-btn-primary`; coach quote `--muted-foreground`.
- **Components:** `card`, `progress` (radials), `badge`, `button`.
- **Features:** Mission Ready hero + 92% ELITE + top-% ; readiness score breakdown 5 radials w/ Excellent/Very Good labels; "ready to submit" checklist; **APPLY NOW → routes to `/ready-to-apply`** (the canonical gate); Export Package / Share / Schedule Interview Prep⚠.

---

# PHASE F — Apply (Language 2 — Warm)

> Submission via `lib/actions/apply.ts` only (sets `jobs.status='applied'`, inserts `applications`, logs overrides). Tag: `HW/11 · STEP 16x OF 16C`.

### F-16A — "Application Package" · 🟡 Partial / 🎨 — `ApplicationPackagePreview`
- **Palette:** 3 doc cards `--card` w/ VERIFIED `--success` + proof counts; check-lists `--success`; Governance Score 100% `--warning`/gold band → token; CHOOSE DESTINATION `hw-btn-primary`.
- **Components:** `card`, `badge`, `button`, doc thumbnails.
- **Features:** Resume (Verified, 14 bullets / 32 proof) + Cover Letter (Verified, 4 paragraphs / 12 proof) + Evidence Package (Verified, 28 items / 100% traceable) cards w/ Preview + Download; "Built on Verified Evidence" governance band (100% Fully Traceable); CHOOSE DESTINATION + Review Readiness Dashboard.

### F-16B — "Choose Destination" · 🔴 Build
- **Palette:** platform rows `--card`; RECOMMENDED chip `--success`; success-rate dots `--success` (High) / `--warning` (Medium); per-row Apply button — LinkedIn primary `hw-btn-primary`, others outline; "100% SECURE" `--success`; brand logos allowed.
- **Components:** `card`, `badge`, dot-rating (custom), `button`, package summary footer.
- **Features:** platform list (LinkedIn RECOMMENDED, Indeed, Workday, Greenhouse, Lever, Company Website) each w/ description + tags + success-rate + Apply/Visit; "Add manually" link; package summary footer (Resume 1 / Cover 1 / Evidence 28) + Preview Package; Back / Continue to Submit.
- **⚠ Wiring:** external "Apply on X" = hand-off link unless automated submit is wired → else disabled (brief §0.7).

### F-16C — "Application Submitted" · 🔴 Build
- **Palette:** APPLICATION SENT big `--success` check + confetti (`--success` confetti); submission details `--card`; package list `--success` checks; "What happens next" 5-step `--success` trail; **PRO TIP ⚠purple** → `--ai`/`--primary`.
- **Components:** `card`, confetti (custom/`carousel`), stepper, `button`.
- **Features:** SENT confirmation + role/company; SUBMISSION DETAILS (Job / Company / Platform / Date / Tracking ID); package recap; "What happens next" 5 steps (Received → Under Review → Next Steps → Stay Notified → Win the Role); Pro Tip + While You Wait (Prepare / Track / Explore); Share Success / View Application Dashboard.
- **Data:** writes via `applyToJob()`. Tracking ID display only.

---

# PHASE G — Outcomes Loop (Language 2 — Warm)

> Closes back to Phase C. Tags: `HW/11 · STEP 17x OF 17D`, `18A OF 20D`. Charts use the `chart` primitive + documented categorical palette.

### G-17A — "Application Pipeline" · 🟡 Partial — `jobs-pipeline-client.tsx`
- **Palette:** 5 column headers tinted by stage (Applied blue / Screening `--warning` / Interview ⚠purple / Final `--success` / Offer `--success`) — map to tokens; cards `--card` + company logo + date; performance donut `--success`; insights icons.
- **Components:** kanban columns (custom + `scroll-area`), `card`, **`chart`** (donut + line), list, `button`.
- **Features:** 5 stat icons (14 Applied / 6 Screening / 4 Interview / 2 Final / 1 Offer); kanban w/ per-stage cards (+N more); Application Performance (29% interview rate donut + benchmark + response rate sparkline); Insights (3); Pipeline Trend line; Recent Activity; Quick Actions.

### G-17B — "Interview Tracker" · 🔴 Build
- **Palette:** prep % radials — 85 `--success` / 62 `--warning` / 40 `--muted`; PREPARE buttons `--primary`; past-interview status — Completed `--success`, In Progress `--warning`, No Response `--destructive`/`--muted`; tabs underline `--primary`.
- **Components:** `tabs` (Overview/Upcoming/Past/Prepare/Insights), `card`, `progress` (radials), `badge`, `button`.
- **Features:** Upcoming interviews (company + role + date/time + type + prep % + PREPARE); Past interviews w/ feedback status; Interview Prep Center (Behavioral / Product Sense / Leadership / Company Research / Mock); Insights (interview rate / response time / offer rate); Next Steps checklist.
- **⚠ Canonical:** `/jobs/[id]/interview-prep` is non-canonical + no data model — needs wired home + schema first.

### G-17C — "Offer Tracking" · 🔴 Build
- **Palette:** active offer total comp big `--success`; confidence bar `--success`; offer cards tagged BEST `--success` / STRONG (blue) / GOOD `--warning` / CONSIDERING (⚠purple) → tokens; comp table; **comp-over-time line chart** = 4 categorical hues (chart palette); benefits Premium `--success`.
- **Components:** `tabs` (Summary/Comparison/Compensation/Benefits/Notes), `card`, `table`, **`chart`** (multi-line), `badge`, `button`.
- **Features:** active offer summary ($246,500 + confidence 92% + expires); Offers at a Glance (4 companies w/ total comp + confidence + tag); Compensation breakdown table (Base/Bonus/Equity/Sign-on/Total); 10-yr total-comp projection line chart; Benefits highlights (Health/401k/PTO/Perks); Notes; PLAN NEXT STEPS / Negotiation Guide.
- **⚠ Data:** no offer-comp model exists today — net-new schema (confirm before adding).

### G-17D — "Outcomes Analytics" · 🟡 Partial — `app/(dashboard)/analytics/page.tsx` (pro-gated)
- **Palette:** 5 stat cards w/ ▲ deltas `--success`; **funnel bar chart** descending hues; conversion line ⚠purple → chart token; stage-performance table ▲ `--success`; source donut multi-slice; **AI INSIGHTS panel ⚠purple** → `--ai`.
- **Components:** `card`, **`chart`** (bar funnel + line + donut), `table`, `badge`, date-range `popover`/`select`, `button`.
- **Features:** date range; 5 stats (24 Applications / 7 Interviews / 3 Offers / $156K Avg Offer / 29% Interview Rate); Application Funnel (24→16→7→3→2 + step %); Conversion Rate Over Time; Stage Performance table (conversion + vs-last-30d); Top Performing Sources donut (LinkedIn 41.7% / Careers 25% / Referral 16.7% / Indeed 8.3% / Other); HireWire AI Insights (4); Outcomes Summary; Recommended Actions.
- **⚠ Gate:** pro-only (`plan_type`).

### G-18A — "Evidence Vault" hub · 🟡 Partial — `app/(dashboard)/evidence/page.tsx`
- **Palette:** Evidence Score 86% radial `--success`; 6 category cards w/ icon tints (⚠ purple/green/orange/blue/yellow/pink → tokens) + counts; strength stars `--success`/`--warning`; "used in N applications" links `--primary`; **AI SUGGESTED ACTION ⚠purple**; Add Evidence FAB `--primary`.
- **Components:** `card`, `progress` (radial), `table`, star-rating (custom), `badge`, `popover` (filter), FAB `button`.
- **Features:** Evidence Score (86% Strong); 6 categories (Projects 24 / Achievements 37 / Metrics 56 / Stories 18 / Certifications 12 / Education 6); Recently Added list; AI Suggested Action ("3 projects without quantified metrics"); Evidence at a Glance table (item + category + date + strength stars + used-in-N-apps + ⋯); Your Evidence Impact (124 Total / 92% Quality / 68 Linked / 41% Interview Rate from evidence-backed apps); Add Evidence FAB.
- **Loop:** this hub feeds Phase C (Prove Fit) — confirmed coach proof lands here as `evidence_library` rows.

---

## Cross-cutting acceptance (every screen)
1. ☐ Colors are tokens only; off-token items resolved to a token or a newly-documented token (no inline hex).
2. ☐ Headlines Inter 900 (`.hw-hero-title`) / `.hw-page-title`; no serif.
3. ☐ Language 1 (dark) limited to Prove Fit / Match Interview / Coach; everything else Language 2 warm.
4. ☐ Logo via `<HireWireLogo />` (`white` on dark); 0-byte assets untouched.
5. ☐ Primitives reused from `components/ui/`; charts via `chart`; stripes via `off-white-stripes.tsx`.
6. ☐ Unwired CTAs render `disabled`; non-canonical routes (interview-prep, etc.) gated.
7. ☐ Readiness via `evaluateReadiness()`; apply via `applyToJob()`; generation via the one route — no parallel engines.
8. ☐ No fabricated employers/dates/metrics; document content from `jobs.generated_*` only.
