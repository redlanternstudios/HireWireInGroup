# HireWire Production Readiness Audit
**Updated:** 2026-05-08 (Close the Gaps sprint)  
**Original generated:** March 30, 2026  
**Standard:** Honest production review — every claim labeled by verification status

> **Verification key:**
> - ✅ **Verified** — code proves it
> - ⚠️ **Partially verified** — code suggests it but runtime test needed
> - ❌ **Not verified** — no code evidence found
> - 🚫 **Contradicted by code** — code directly contradicts this claim
> - 🔬 **Needs runtime test** — requires live environment to confirm

---

## 1. WORKING SYSTEMS

### Authentication
- ✅ Supabase Auth fully configured (login page, magic link, Google OAuth exist in code)
- ✅ Login page with email/password and Google OAuth
- ✅ Magic link authentication
- ✅ Signup flow with redirect to onboarding
- ✅ Protected routes via middleware
- ✅ Auth callback handling (`/auth/callback`)
- 🔬 RLS policies on all 24 tables (user_id filtering) — **Needs runtime test**

### Database
- ✅ `jobs` table with all required columns
- ✅ `job_analyses` table for analysis results
- ✅ `evidence_library` table with career evidence
- ✅ `user_profile` table for profile data
- ⚠️ `generated_documents` table for document history — referenced in types, insertion path not fully traced
- ⚠️ `interview_prep` table for interview materials — referenced, not fully traced
- ✅ `companion_conversations` + `companion_messages` for AI coach
- ✅ `generation_quality_checks` for TruthSerum validation — inserted in generate-documents route
- ✅ `processing_events` / `audit_events` for audit logging
- ✅ `run_ledger` for step-by-step tracking
- 🔬 All tables have RLS enabled with proper policies — **Needs runtime test**

### Job Intake Flow
- ✅ URL input accepts job posting URLs
- ⚠️ Manual entry page at `/manual-entry` — page exists; full flow not traced
- ✅ Real-time loading/processing states
- 🚫 ~~Direct Groq AI processing (no n8n dependency required)~~ — **CONTRADICTED BY CODE**: uses Anthropic Claude via Vercel AI Gateway
- ✅ Results written to Supabase `jobs` table
- ✅ Automatic document generation after analysis

### AI Processing Pipeline
- 🚫 ~~Job analysis via `/api/analyze` (Groq AI)~~ — **CONTRADICTED BY CODE**: uses `CLAUDE_MODELS.SONNET` (`anthropic/claude-sonnet-4-20250514`)
- ✅ Job analysis via Anthropic Claude SONNET via Vercel AI Gateway
- ✅ Document generation via `/api/generate-documents` — Claude SONNET
- ✅ Quality check via Claude HAIKU (`anthropic/claude-3-5-haiku-20241022`)
- ⚠️ Interview prep via `/api/generate-interview-prep` — route referenced, not fully traced
- ⚠️ AI Coach via `/api/coach` with safety layer — route exists
- ⚠️ Resume parsing via `/api/parse-resume` — route exists
- ✅ All primary routes use real AI (no mock data)

### Dashboard Pages (24 total)
- ⚠️ Key pages verified in code: Home, Jobs list, Job detail, Add Job, Ready Queue, Applications
- 🔬 All 24 pages functional with real data — **Needs runtime test**

### Export Functionality
- ⚠️ `/api/export/resume` - DOCX export — route exists
- ⚠️ `/api/export/cover-letter` - DOCX export — route exists
- 🔬 Working with real generated content — **Needs runtime test**

### Safety Layer
- ✅ Injection detection patterns in `lib/safety/injection-detector.ts`
- ✅ `sanitizeInput` used on profile fields before AI prompts
- ❌ ~~100% block rate on red team tests~~ — **Not verified**: no test results in repo
- ✅ TruthSerum quality checks (`lib/truthserum.ts`)

### Error Handling
- ✅ Try-catch in server actions and API routes
- ⚠️ ErrorState component for API failures — component exists; not individually tested
- ✅ Proper HTTP status codes in key API routes

---

## 2. PARTIAL SYSTEMS

### Stripe Payments
- Status: **NOT IMPLEMENTED**
- Gap: No active Stripe checkout routes found (`stripe` dependency exists but unused in active code)
- Impact: No paywall, no premium tiers (free plan generation limit enforced in `generate-documents/route.ts`)
- Files needed: `/app/api/stripe/route.ts`, `/app/pricing/page.tsx`

### n8n Integration
- Status: **OPTIONAL** (not required — direct Claude AI calls work)
- Gap: Environment variable exists but not required
- Impact: None

### Evidence Matching Completeness
- Status: **PARTIAL** — auto-mapping runs in `analyze-job-core.ts`, but `matching_complete` is only set when user manually confirms in UI
- Impact: UX friction; generation is gated until user confirms

---

## 3. FIXED IN CLOSE-THE-GAPS SPRINT

| Issue | Fix |
|-------|-----|
| `analysis_model` claimed "llama-3.3-70b-versatile" while code used Claude SONNET | Fixed — `analyze-job-core.ts` now writes `"claude-sonnet-4-20250514"` |
| README said "Groq" provider | Fixed — README now says "Anthropic Claude via Vercel AI Gateway" |
| `package.json` name was `"my-project"` | Fixed — now `"hirewire-in-group"` |
| `generation_quality_checks` insert missing model/provider metadata | Fixed — insert now includes `provider`, `generation_model`, `quality_check_model`, `evidence_ids_used`, `quality_score` |
| Central provider config did not exist | Created `lib/ai/provider-config.ts` |

---

## 4. KNOWN RISKS (post-sprint)

1. **Schema columns for new `generation_quality_checks` fields**: A SQL migration is needed for `provider`, `generation_model`, `quality_check_model`, `evidence_ids_used`, `banned_phrases_found`, `unsafe_metrics_found`, `quality_score`.
2. **`job_analyses.analysis_provider` column**: New field added to insert; may not exist in live schema yet.
3. **RLS completeness**: Not verified by migration files. Treat as "Needs runtime test".
4. **AI Gateway**: Vercel AI Gateway must be enabled. Without it, an explicit `ANTHROPIC_API_KEY` env var is needed.

---

## 5. GO LIVE VERDICT (REVISED)

### CONDITIONALLY READY — pending runtime verification

**Proven by code:**
- Core golden path works (analyze → generate → quality gate → canonical apply)
- AI provider metadata is now truthful (Claude, not Groq)
- Apply gate enforced by `lib/actions/apply.ts`
- Audit events created on every successful apply

**Needs runtime test before claiming production-ready:**
- RLS policies on all tables
- All 24 dashboard pages with real data
- Vercel AI Gateway configured
- SQL migration for enriched `generation_quality_checks` columns

**Pre-Launch Checklist (revised):**
1. [ ] Verify Vercel AI Gateway is enabled (Anthropic Claude access)
2. [ ] Verify all required Supabase env vars are set
3. [ ] Apply SQL migration for enriched `generation_quality_checks` columns
4. [ ] Run golden path smoke test (see `docs/GOLDEN_PATH_TEST_PLAN.md`)
5. [ ] Verify RLS policies in Supabase dashboard
6. [ ] (Optional) Add Stripe if monetization needed

**Launch Confidence:** Partially verified — honest assessment pending runtime tests

---

## Quality Metrics (revised)

| Metric | Score | Verification Status |
|--------|-------|-------------------|
| Mock Data Usage | 0% (none imported in active code) | ✅ Verified |
| AI Provider Truthfulness | Fixed post-sprint | ✅ Verified |
| Apply Gate Integrity | Single canonical path | ✅ Verified |
| Quality Check Persistence | Persisted with metadata | ✅ Verified |
| Database Coverage | Tables exist in code references | ⚠️ Partially verified |
| RLS Coverage | Claimed but unverified | 🔬 Needs runtime test |
| Error Handling | Try-catch in key paths | ⚠️ Partially verified |
| Safety Layer | Injection detection exists | ⚠️ Partially verified |
| API Completion | Key routes functional | ⚠️ Partially verified |
| Page Completion | Key pages verified | ⚠️ Partially verified |

---

## Appendix: Environment Variables Required

```
# Supabase (required)
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY

# AI — Vercel AI Gateway (required for Claude)
# No explicit ANTHROPIC_API_KEY needed when deployed to Vercel with AI Gateway enabled.
# If deploying outside Vercel or without AI Gateway, set:
# ANTHROPIC_API_KEY

# Optional
N8N_JOB_INTAKE_WEBHOOK_URL
N8N_JOB_INTAKE_WEBHOOK_TOKEN

# If Stripe added
STRIPE_SECRET_KEY
STRIPE_PUBLISHABLE_KEY
STRIPE_WEBHOOK_SECRET
STRIPE_PRICE_ID
```

> **Note:** `GROQ_API_KEY` is no longer required. The active AI provider is Anthropic Claude via Vercel AI Gateway.
