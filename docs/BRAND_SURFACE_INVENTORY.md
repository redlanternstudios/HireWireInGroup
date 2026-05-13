# HireWire Brand Surface Inventory

Every user-facing surface where HireWire branding can appear.
Status key: Branded | Needs asset | Needs copy | Needs Supabase change | Needs Vercel/domain change | Needs Stripe setting | Not applicable

---

## APP BRANDING

| Surface | Status | Notes |
|---|---|---|
| Sidebar logo | Branded | Uses `HireWireLogo variant="color"` from `/brand/hirewire-logo.png` |
| Collapsed sidebar logo | Needs asset | No collapsed/icon-only mode yet — needs monogram/icon mark |
| Top navigation logo | Not applicable | No top nav — sidebar only |
| Mobile header logo | Needs asset | No mobile-specific header implemented yet |
| Dashboard header | Branded | Page title is "Home" — no logo needed |
| App favicon | Needs asset | `/brand/favicon.ico` path set in metadata but file missing — needs 16x16 and 32x32 ICO |
| Browser tab title | Branded | `title: { default: 'HireWire — AI-Powered Career OS', template: '%s | HireWire' }` |
| Metadata description | Branded | Updated in `app/layout.tsx` |
| Loading screen | Needs copy | No global loading state — each page handles its own skeleton |
| Splash/empty states | Needs copy | See evidence, jobs, documents pages — copy is functional but not centralized |
| Public landing/marketing pages | Needs copy | `/landing/page.tsx` exists — not audited yet |

---

## AUTH BRANDING

| Surface | Status | Notes |
|---|---|---|
| Login page | Branded | HireWire copy, no provider branding exposed |
| Signup page | Branded | HireWire copy |
| Auth layout | Branded | Shows `HireWireLogo variant="color"` above the card |
| Auth error page | Branded | HireWire copy, `[hirewire]` prefix on console.error |
| Forgot password page | Not applicable | Not implemented — magic link is the primary flow |
| Magic link request page | Branded | Handled inside login page |
| Auth callback page | Needs audit | `/auth/callback` — not audited for Supabase branding leak |
| Session expired modal | Needs copy | Registered in comms registry as `account.session_expired` — not yet wired to a modal component |
| Unauthorized page | Needs copy | No dedicated unauthorized page — redirects to login |

---

## SUPABASE AUTH EMAIL BRANDING

| Template | Status | Notes |
|---|---|---|
| Confirm signup | Needs Supabase change | Default Supabase template — see `docs/SUPABASE_BRANDING_TASKS.md` |
| Magic link | Needs Supabase change | Default Supabase template |
| Invite user | Needs Supabase change | Default Supabase template |
| Reset password | Needs Supabase change | Default Supabase template |
| Change email address | Needs Supabase change | Default Supabase template |
| Reauthentication | Needs Supabase change | Default Supabase template |
| OTP | Not applicable | OTP not enabled |

---

## EMAIL BRANDING

| Surface | Status | Notes |
|---|---|---|
| Transactional email header | Needs asset | Logo URL needed: `https://yourdomain.com/brand/hirewire-logo.png` |
| Transactional email footer | Needs copy | Footer address, legal copy, unsubscribe language |
| Notification email template | Not implemented | No custom email sending in app yet |
| Billing email template | Needs Stripe setting | Stripe sends default billing emails — needs custom branding |
| Application package ready email | Not implemented | Future — registered in comms registry |
| Weekly digest email | Not implemented | Future — registered in comms registry |

---

## IN-APP COMMS BRANDING

| Surface | Status | Notes |
|---|---|---|
| Toasts | Branded | Uses shadcn `Toaster` with `richColors` — no provider copy |
| Banners | Needs component | No reusable `HireWireBanner` component yet |
| Modals | Needs audit | Using shadcn Dialog — no HireWire copy standard applied |
| Empty states | Needs audit | Individual pages have their own — not centralized |
| Error cards | Needs component | No reusable `HireWireErrorCard` component yet |
| Coach welcome screen | Branded | Copy is HireWire-specific |
| Coach suggested prompts | Branded | Four prompt buttons on coach page |
| Pipeline Intelligence panel | Not applicable | Not implemented yet |
| Ready to Apply guidance | Needs copy | ready-queue page copy is functional but not from registry |
| Application Package Builder | Needs copy | Documents page copy is functional |
| Notifications center | Not implemented | Future feature |

---

## DOCUMENT BRANDING

| Surface | Status | Notes |
|---|---|---|
| Exported resume | Correct | No HireWire branding on export unless user chooses it |
| Exported cover letter | Correct | No HireWire branding on export |
| PDF/DOCX metadata | Needs audit | `lib/export.ts` — check author/creator metadata fields |
| Download file names | Branded | `lib/filename-utils.ts` handles user+role-friendly naming |

---

## BILLING BRANDING

| Surface | Status | Notes |
|---|---|---|
| Billing page | Branded | HireWire copy, plan names |
| Checkout redirect | Needs Stripe setting | Stripe Checkout uses default branding unless configured |
| Checkout success page | Not implemented | No `/checkout/success` page |
| Checkout cancel page | Not implemented | No `/checkout/cancel` page |
| Plan limit modal | Needs component | Registered in comms registry as `billing.limit_reached` |
| Stripe customer portal return | Needs Stripe setting | Portal uses Stripe branding by default |

---

## ERROR BRANDING

| Surface | Status | Notes |
|---|---|---|
| Global error page (`global-error.tsx`) | Branded | HireWire logo inline via `<img>`, HireWire red button |
| Route error page (`app/error.tsx`) | Branded | HireWire copy, error digest shown |
| Not found page (`not-found.tsx`) | Branded | HireWire logo, HireWire copy |
| Auth error page | Branded | HireWire copy |
| API visible errors | Needs audit | Some API routes return raw error strings — should use registry copy |
| Export failures | Needs copy | Registered as `error.ai_failed` in registry |
| AI generation failures | Needs copy | Registered as `error.ai_failed` in registry |
| Payment failures | Needs copy | Registered as `billing.payment_failed` in registry |

---

## LEGAL AND FOOTER BRANDING

| Surface | Status | Notes |
|---|---|---|
| Terms page | Needs copy | `/legal/terms/page.tsx` exists — not audited |
| Privacy page | Needs copy | `/legal/privacy/page.tsx` exists — not audited |
| Footer | Needs audit | No global footer component |
| Contact support link | Needs copy | No support link in UI yet |
| Copyright | Branded | Auth layout shows `© YEAR HireWire` |

---

## DEVELOPER BRAND LEAKS (CHECKED)

| Leak | Status | Notes |
|---|---|---|
| `[v0]` in console.error | Fixed | Replaced with `[hirewire]` in error pages and coach |
| Supabase logo or auth copy | Fixed | Not exposed in UI — Supabase branding is only in email templates (out of repo) |
| Next.js default metadata | Fixed | `title` and `description` updated in `app/layout.tsx` |
| Default favicon | Needs asset | `favicon.ico` not yet in `/public/brand/` |
| Generic placeholder logo | Fixed | `HireWireLogo` component now points to `/brand/hirewire-logo.png` |
| "powered by v0" copy | Not found | Not present in codebase |
| `App Shell` title | Fixed | Was the default metadata title — now `HireWire — AI-Powered Career OS` |
| `Start with a clean auth experience.` | Fixed | Was generic placeholder copy on signup — replaced |
