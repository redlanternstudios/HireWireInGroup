# HireWire — Auth Emails (delivery + branding)

Fixes two things: **(1) verification/magic-link/reset emails not arriving**, and **(2) making them on-brand.**

## Why your verification email never came

HireWire has **no email provider configured** — no SMTP/Resend/SendGrid in the code or env. So every auth email (confirm signup, magic link, password reset) falls back to **Supabase's built-in email service**, which:

- is rate-limited to a handful per hour (fine for a demo, not for real users),
- is **not intended for production** (Supabase says so explicitly),
- frequently lands in spam or is silently dropped,
- uses Supabase's **default, unbranded** template.

So "the email never came" is a **delivery** problem (no real SMTP), separate from the **branding** problem (default template). Both are fixed below. Neither lives in this repo — they're Supabase **project config**, so they must be set in the dashboard (or Management API).

> Note: a user created via the admin API with `email_confirm: true` is auto-confirmed and gets **no** email — that was the earlier test user. Real app signups (`supabase.auth.signUp`) do trigger the confirm email; it just isn't being delivered reliably.

## Step 1 — Fix delivery (custom SMTP). ~5 min, needs an email provider account.

Recommended: **Resend** (free tier, 3k emails/mo). SendGrid/Postmark/Mailgun work identically.

1. Create a Resend account and **verify the `hirewire.app` domain** (add the DNS records Resend gives you).
2. Create a Resend API key.
3. Supabase Dashboard → **Project `endovljmaudnxdzdapmf`** → **Authentication → Emails → SMTP Settings** → **Enable custom SMTP**:
   - Host: `smtp.resend.com`  ·  Port: `465`  ·  Username: `resend`
   - Password: *your Resend API key*
   - Sender email: `no-reply@hirewire.app`  ·  Sender name: `HireWire`
4. Save. (Reason I can't do this step: it requires creating an account and entering credentials.)

## Step 2 — Apply the branded templates

Supabase Dashboard → **Authentication → Email Templates**. For each, paste the matching file and set the subject:

| Template | File | Subject |
|---|---|---|
| Confirm signup | `confirmation.html` | `Confirm your HireWire account` |
| Magic Link | `magic-link.html` | `Your HireWire sign-in link` |
| Reset Password | `reset-password.html` | `Reset your HireWire password` |

Each uses the standard `{{ .ConfirmationURL }}` variable, so no code changes are needed.

**Logo:** the templates use a styled text wordmark (safe in every mail client). To use the image logo instead, host it (e.g. `https://hirewire.app/brand/hirewire-logo.png`) and replace the `<span>…HIREWIRE…</span>` block with `<img src="…" width="150" alt="HireWire" />`.

## Step 3 — Test

Sign up with a real inbox (not a disposable like yopmail) → the branded confirmation email should arrive within seconds. Then confirm → sign in (the cookie-session login fix from #125 lands you in the app).

---

Once you've set up Step 1 (or given me a Resend/SMTP key), I can wire the SMTP config via the Management API and we can skip the dashboard clicks.
