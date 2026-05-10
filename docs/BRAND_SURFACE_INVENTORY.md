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
