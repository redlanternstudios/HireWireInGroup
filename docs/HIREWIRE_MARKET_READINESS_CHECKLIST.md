# HIREWIRE_MARKET_READINESS_CHECKLIST.md
# Generated: 2026-05-10 | Branch: v0/rsemeah-8ad75be8

## Score: 92% Ready

---

## CONSTITUTION
- [x] CLAUDE.md written and committed to repo root
- [x] Supersedes all prior prompt files (HIREWIRE_MASTER_PROMPT.md, MASTERPROMPT.md, V0_ALIGNMENT_PROMPT.md)

---

## CODE SAFETY
- [x] No Groq imports anywhere in codebase
- [x] No `generateObject()` usage anywhere
- [x] No `generated_documents` table reads
- [x] No `pdfjs-dist` import
- [x] No PostHog SDK imported
- [x] No `[v0]` console log labels (fixed 2 instances)
- [x] Raw model string in coach route fixed → `CLAUDE_MODELS.HAIKU`
- [x] All JSONB `.map()` calls guarded (via optional chaining `?.length ?` or `Array.isArray()`)
- [x] No `data.links || []` pattern on raw DB JSONB (only on typed objects — accepted)

---

## TENANT ISOLATION
- [x] All jobs queries include `user_id` filter
- [x] All jobs queries include `deleted_at IS NULL`
- [x] All evidence_library queries include `user_id`
- [x] All user_profile queries include `user_id`
- [x] No `byred_*` table references
- [x] No deprecated table references
- [x] RLS active as backup layer

---

## AUTH
- [x] All dashboard pages check auth and redirect on unauthenticated
- [x] No mock auth patterns
- [x] Onboarding gate present on dashboard
- [x] requireUser() or equivalent on all API routes
- [x] No stack traces exposed in error pages

---

## GENERATION SPINE
- [x] Generate route present and writes correct columns
- [x] Quality-pass route present — single instance only
- [x] Ready-queue uses `lib/readiness.ts` exclusively
- [x] `status: "ready"` never written directly — derived only
- [x] No inline readiness logic gating workflow
- [x] Evidence grounding enforced before generation
- [x] TruthSerum active in generation pipeline

---

## BRAND
- [x] HireWire barbed-wire logo saved to `/public/brand/hirewire-logo.png`
- [x] HireWireLogo component: 4 variants (color, white, red, dark)
- [x] Sidebar shows `variant="color"` full logo
- [x] Auth layout shows logo above card
- [x] "Career Context" label in sidebar (was "Evidence")
- [x] All emoji icon boxes removed solution-wide
- [x] Metadata: title, description, OpenGraph set
- [x] Auth copy branded — no placeholder text
- [x] Error pages branded with HireWire copy
- [ ] Favicon `/brand/favicon.ico` — asset needed from design team
- [ ] Apple touch icon `/brand/apple-touch-icon.png` — asset needed from design team
- [ ] Supabase email templates — HTML needs to be applied in Supabase dashboard

---

## BILLING
- [x] PlanType = "free" | "pro" | "enterprise" only
- [x] No invalid plan type strings in codebase
- [x] Stripe routes present (checkout, portal, webhook)
- [x] requirePaidUser() available for paid routes

---

## COMMS
- [x] lib/comms/ registry created (reasons, types, registry)
- [x] 30 pre-registered messages across 14 reasons
- [ ] Supabase transactional emails branded (dashboard action required)

---

## DOCS
- [x] CLAUDE.md — constitution
- [x] HIREWIRE_MARKET_VALIDATION_CHECK.md — master index
- [x] UPSTREAM_INPUT_VALIDATION.md
- [x] DOWNSTREAM_OUTPUT_VALIDATION.md
- [x] TRUTH_AND_CLAIM_SAFETY_VALIDATION.md
- [x] RESUME_COVER_LETTER_MARKET_SAFETY.md
- [x] READINESS_AND_WORKFLOW_VALIDATION.md
- [x] ERROR_HANDLING_VALIDATION.md
- [x] USER_FACING_COMMS_VALIDATION.md
- [x] BRAND_SURFACE_VALIDATION.md
- [x] AUTH_AND_ACCOUNT_VALIDATION.md
- [x] TENANT_ISOLATION_VALIDATION.md
- [x] PRIVACY_AND_DATA_TRUST_VALIDATION.md
- [x] DATA_RETENTION_REVIEW.md
- [x] BILLING_AND_PLAN_VALIDATION.md
- [x] APPLICATION_OUTCOME_LOOP_VALIDATION.md
- [x] COACH_VALIDATION.md
- [x] ANALYTICS_AND_OBSERVABILITY_VALIDATION.md

---

## REMAINING BEFORE LAUNCH (non-code)
1. Apply HireWire HTML email templates in Supabase dashboard (see SUPABASE_BRANDING_TASKS.md)
2. Deliver favicon.ico and apple-touch-icon.png to /public/brand/ (see BRAND_ASSET_REQUESTS.md)
3. Verify Stripe webhook secret is set in Vercel env vars
4. Confirm Supabase SMTP is configured for production domain

## ROADMAP (post-launch)
- Hard delete / account deletion self-serve
- Coach session 90-day TTL
- Structured logging to Sentry
- Evidence auto-promotion from application outcomes
