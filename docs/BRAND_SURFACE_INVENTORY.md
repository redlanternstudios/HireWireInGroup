<<<<<<< HEAD
# HireWire — Brand Surface Inventory

This document inventories every user-facing surface where HireWire branding must appear or be controlled. Each surface is marked for branding status and needs.

## APP BRANDING
- Sidebar logo: Branded
- Collapsed sidebar logo: Branded
- Top navigation logo: Branded
- Mobile header logo: Branded
- Dashboard header: Branded
- App favicon: Needs asset
- Browser tab title: Needs copy
- Metadata title: Needs copy
- Metadata description: Needs copy
- Loading screen: Needs asset
- Splash style empty states: Branded
- Public landing/marketing pages: Not applicable (if present, needs branding)

## AUTH BRANDING
- Login page: Needs asset/copy
- Signup page: Needs asset/copy
- Forgot password page: Needs asset/copy
- Magic link request page: Needs asset/copy
- Auth callback page: Needs asset/copy
- Auth error page: Needs asset/copy
- Password reset page: Needs asset/copy
- Email confirmation page: Needs asset/copy
- Session expired modal: Needs asset/copy
- Unauthorized page: Needs asset/copy

## SUPABASE AUTH EMAIL BRANDING
- Confirm signup email: Needs Supabase dashboard update
- Magic link email: Needs Supabase dashboard update
- Invite user email: Needs Supabase dashboard update
- Reset password email: Needs Supabase dashboard update
- Change email address email: Needs Supabase dashboard update
- Reauthentication email: Needs Supabase dashboard update
- OTP email if enabled: Needs Supabase dashboard update

## EMAIL BRANDING
- Transactional email header: Needs asset/copy
- Transactional email footer: Needs asset/copy
- Notification email template: Needs asset/copy
- Billing email template: Needs asset/copy
- Support email template: Needs asset/copy
- Application package ready email: Needs asset/copy
- Follow up reminder email: Needs asset/copy
- Weekly digest email: Needs asset/copy
- External draft email preview: Needs asset/copy

## IN APP COMMS BRANDING
- Toasts: Branded
- Banners: Branded
- Modals: Branded
- Empty states: Branded
- Error cards: Branded
- Coach welcome screen: Branded
- Coach suggested prompts: Branded
- Pipeline Intelligence panel: Branded
- Ready to Apply guidance: Branded
- Application Package Builder: Branded
- Document quality panel: Branded
- Notifications center: Branded (if present)

## DOCUMENT BRANDING
- Exported resume: Not branded unless user chooses
- Exported cover letter: Not branded unless user chooses
- PDF/DOCX metadata: Needs audit (should not say v0/Supabase)
- Download file names: Needs audit (should be user/role friendly)

## BILLING BRANDING
- Pricing page: Needs asset/copy
- Billing page: Branded
- Checkout redirect page: Needs asset/copy
- Checkout success page: Needs asset/copy
- Checkout cancel page: Needs asset/copy
- Plan limit modal: Branded
- Upgrade modal: Branded
- Stripe customer portal return page: Needs asset/copy

## ERROR BRANDING
- Global error page: Branded
- Route error pages: Branded
- Not found page: Branded
- Auth error page: Branded
- API visible errors: Branded
- Export failures: Branded
- Job scrape failures: Branded
- AI generation failures: Branded
- Payment failures: Branded

## LEGAL AND FOOTER BRANDING
- Terms page: Needs asset/copy
- Privacy page: Needs asset/copy
- Cookie notice: Needs asset/copy
- Footer: Needs asset/copy
- Contact support link: Needs asset/copy
- Copyright: Needs asset/copy

## DEVELOPER BRAND LEAKS TO CHECK
- v0 watermark or generated copy: Needs audit
- Supabase logo or default auth copy: Needs audit
- Vercel preview branding: Needs audit
- Default Next.js metadata: Needs audit
- Default favicon: Needs audit
- Default Open Graph images: Needs audit
- Default placeholder logo: Needs audit
- Default shadcn starter copy: Needs audit
- Browser console user visible errors: Needs audit
- Email template default sender names: Needs audit
- Stripe statement descriptor: Needs audit

## Acceptance
- Every surface is marked: Branded / Needs asset / Needs copy / Needs Supabase dashboard change / Needs Vercel/domain change / Needs Stripe setting / Not applicable
=======
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
>>>>>>> 7e1a8af916b56410048e0bfccadd90f00d881991
