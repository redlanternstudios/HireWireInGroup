<<<<<<< HEAD
# HireWire — Brand Asset Requests

This document lists all required and recommended branding assets for HireWire, for v0, Supabase, Stripe, and email.

## Required Logo Assets
- Primary horizontal logo transparent PNG (sidebar, auth, email)
- SVG horizontal logo (crisp web display)
- Small icon mark PNG (favicon, app icon)
- Small icon mark SVG (favicon, app icon)
- White logo version (dark backgrounds)
- Dark logo version (light backgrounds)
- Square app icon (favicon/PWA/mobile)
- Email safe logo (Supabase auth emails)
- Open Graph image 1200x630 (link previews)

## Required Brand Settings
- Primary red hex
- Dark red hex
- Hover red hex
- Warm background hex
- Font preference
- Support email
- From email (auth emails)
- Reply to email (auth emails)
- Production domain
- Terms URL
- Privacy URL

## Supabase Needs
- Site URL
- Redirect URLs
- Custom SMTP sender name
- Custom SMTP sender email
- Reply to email
- Logo image URL
- Auth email subjects
- Auth email template HTML
- Branded footer copy
- Production domain asset URL for logo

## v0 Needs
- Final logo path in /public/brand
- Favicon files
- App metadata text
- Product tagline
- Empty state tone
- Button color tokens
- Badge colors
- Barbed wire accent usage rules
- Pages for full logo vs compact mark

## Acceptance
- If an asset is missing, document it here.
- Do not use v0 or Supabase placeholder assets.
- Use safe text fallback only if asset is unavailable.
=======
# HireWire Brand Asset Requests

Assets needed to complete branding across all surfaces.
Items marked RECEIVED are already in the repo. Items marked NEEDED require action from the team.

---

## LOGO ASSETS

| Asset | Status | Path | Notes |
|---|---|---|---|
| Primary horizontal logo (PNG, transparent) | RECEIVED | `/public/brand/hirewire-logo.png` | Barbed wire full logo — use for sidebar, auth, emails |
| Primary horizontal logo (SVG) | NEEDED | `/public/brand/hirewire-logo.svg` | Vector version for crisp rendering at all sizes |
| Compact icon mark (PNG, transparent) | NEEDED | `/public/brand/hirewire-icon.png` | Just the H/barbed wire mark — for collapsed sidebar, PWA icon |
| Compact icon mark (SVG) | NEEDED | `/public/brand/hirewire-icon.svg` | Vector icon mark |
| White logo version | NEEDED | `/public/brand/hirewire-logo-white.png` | For dark backgrounds — can be CSS filter derived from current logo |
| Square app icon (1024x1024) | NEEDED | `/public/brand/hirewire-app-icon.png` | Source for all icon sizes |
| Favicon 16x16 | NEEDED | `/public/brand/favicon-16.png` | Browser tab |
| Favicon 32x32 | NEEDED | `/public/brand/favicon-32.png` | Browser tab retina |
| favicon.ico | NEEDED | `/public/brand/favicon.ico` | Referenced in `app/layout.tsx` metadata |
| Apple touch icon 180x180 | NEEDED | `/public/brand/apple-touch-icon.png` | Referenced in `app/layout.tsx` metadata |
| Open Graph image 1200x630 | NEEDED | `/public/brand/og-image.jpg` | For social sharing previews |
| Email header logo | NEEDED | Hosted at stable public URL | Must be on production domain for Supabase email templates |

---

## COLORS

All tokens are already defined in `app/globals.css`. These are the confirmed values:

| Token | Hex | Usage |
|---|---|---|
| Primary red | `#BD0A0A` | Buttons, accents, primary actions |
| Dark red | `#9a0808` | Hover state |
| Background warm off-white | `#f0ede8` | App background |
| Card background | `#ece9e3` | hw-card surfaces |
| Border | `rgba(26,23,20,0.06)` | Card borders |
| Text primary | `#1a1714` | Foreground |
| Text muted | `#6b6560` | Muted foreground |
| Success | Emerald-600 (`#059669`) | Used for confidence indicators |
| Warning | Amber-600 (`#d97706`) | Used for stat categories |
| Error | `#BD0A0A` (primary) | Destructive states |
| Info | Blue-600 (`#2563eb`) | Informational states |

---

## TYPOGRAPHY

| Element | Font | Status |
|---|---|---|
| Primary UI font | Inter | ACTIVE — loaded via `next/font/google` in `app/layout.tsx` |
| Monospace / code | JetBrains Mono | ACTIVE — loaded via `next/font/google` |
| Email safe fallback | `system-ui, -apple-system, sans-serif` | Use for Supabase email templates |
| Button text | Inter Medium (500), all caps or sentence case | Use sentence case per current design |
| Badge text | Inter Medium, 9-10px | Current badge style |

---

## GRAPHIC ELEMENTS

| Rule | Detail |
|---|---|
| Barbed wire usage | Logo only — do not use barbed wire as a decorative separator or background element |
| Logo clear space | Minimum clear space = height of the H letterform on all sides |
| Logo minimum size | 60px wide — do not render below this |
| Logo on dark background | Use white version or `filter: brightness(0) invert(1)` |
| Logo on light/warm background | Use full-color version |
| Do not stretch logo | Maintain aspect ratio at all times |
| Do not place on busy background | Logo needs clear space — no busy gradients behind it |
| Do not use low resolution | Always serve from `/public/brand/` — never from blobs or external URLs in production |

---

## EMAIL BRANDING (VALUES NEEDED FROM TEAM)

| Field | Status | Required Value |
|---|---|---|
| From name | NEEDED | e.g. "HireWire" or "HireWire Team" |
| From email | NEEDED | e.g. `noreply@hirewire.co` |
| Reply-to email | NEEDED | e.g. `support@hirewire.co` |
| Support email | NEEDED | e.g. `support@hirewire.co` |
| Footer address / company line | NEEDED | Legal entity name and address |
| Legal footer copy | NEEDED | e.g. "You're receiving this because you have a HireWire account." |
| Unsubscribe language | NEEDED | For non-transactional emails only |
| Email button style | Defined | `background-color: #BD0A0A; color: #fff; border-radius: 6px; padding: 12px 24px;` |
| Email header background | Defined | `#f0ede8` (warm off-white) |

---

## AUTH BRANDING (VALUES NEEDED FROM TEAM)

| Field | Status | Required Value |
|---|---|---|
| Production site URL | NEEDED | e.g. `https://app.hirewire.co` |
| Redirect URLs | NEEDED | Production + local dev redirect URLs for Supabase |
| Email template logo URL | NEEDED | Stable public URL to hosted logo image |
| Confirm signup subject | NEEDED | e.g. "Confirm your HireWire account" |
| Magic link subject | NEEDED | e.g. "Your HireWire sign-in link" |
| Password reset subject | NEEDED | e.g. "Reset your HireWire password" |
| Email change subject | NEEDED | e.g. "Confirm your new HireWire email" |
| Invite subject | NEEDED | e.g. "You've been invited to HireWire" |
| Auth email button text | Defined | "Confirm" / "Sign in" / "Reset password" |
| Auth email footer copy | NEEDED | e.g. "If you didn't request this, you can safely ignore this email." |

---

## STRIPE BRANDING (VALUES NEEDED FROM TEAM)

| Field | Status | Required Value |
|---|---|---|
| Product name | NEEDED | e.g. "HireWire Pro" |
| Statement descriptor | NEEDED | e.g. "HIREWIRE" (max 22 chars) |
| Support email | NEEDED | e.g. `support@hirewire.co` |
| Support URL | NEEDED | e.g. `https://hirewire.co/support` |
| Brand color | Defined | `#BD0A0A` |
| Logo | NEEDED | Uploaded to Stripe dashboard |
| Icon | NEEDED | Square icon mark uploaded to Stripe dashboard |
| Terms URL | NEEDED | e.g. `https://hirewire.co/terms` |
| Privacy URL | NEEDED | e.g. `https://hirewire.co/privacy` |

---

## VERCEL / DOMAIN (VALUES NEEDED FROM TEAM)

| Field | Status | Required Value |
|---|---|---|
| Production domain | NEEDED | Confirm canonical domain |
| Preview domain policy | NEEDED | Should preview deployments be accessible publicly? |
| NEXT_PUBLIC_APP_URL env var | NEEDED | Set to production domain in Vercel project settings |
| Open Graph metadata | Defined in code | Needs OG image asset to be complete |
| Favicon path | Defined in code | Needs actual favicon.ico file |
>>>>>>> 7e1a8af916b56410048e0bfccadd90f00d881991
