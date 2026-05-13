# HireWire Supabase Branding Tasks

These changes are made in the Supabase dashboard, not in the Next.js repo.
All fields below must be updated before HireWire goes to production.

---

## 1. AUTH EMAIL TEMPLATES

Location: Supabase Dashboard > Authentication > Emails > Templates

For each template below, replace the default Supabase content with HireWire-branded HTML.

### Email HTML Template (use for all templates as the base wrapper)

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>HireWire</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f0ede8; font-family: system-ui, -apple-system, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f0ede8; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; border: 1px solid rgba(26,23,20,0.08); overflow: hidden;">
          <!-- Header -->
          <tr>
            <td style="padding: 32px 40px 24px; border-bottom: 1px solid rgba(26,23,20,0.06);">
              <img src="https://YOUR_PRODUCTION_DOMAIN/brand/hirewire-logo.png" alt="HireWire" height="36" style="display: block;" />
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding: 32px 40px;">
              <!-- REPLACE THIS SECTION PER TEMPLATE -->
              <p style="font-size: 16px; line-height: 1.6; color: #1a1714; margin: 0 0 24px;">{{ .Message }}</p>
              <a href="{{ .ConfirmationURL }}" style="display: inline-block; background-color: #BD0A0A; color: #ffffff; text-decoration: none; font-weight: 600; font-size: 14px; padding: 12px 24px; border-radius: 6px;">
                {{ .ButtonText }}
              </a>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding: 20px 40px; border-top: 1px solid rgba(26,23,20,0.06);">
              <p style="font-size: 12px; color: #9b9590; margin: 0; line-height: 1.5;">
                If you didn&apos;t request this, you can safely ignore this email.<br />
                &copy; {{ .Year }} HireWire. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
```

### Template-specific copy

**Confirm Signup**
- Subject: `Confirm your HireWire account`
- Message: `Thanks for signing up. Click the button below to confirm your email address and get started.`
- Button text: `Confirm account`

**Magic Link**
- Subject: `Your HireWire sign-in link`
- Message: `Click the button below to sign in to HireWire. This link expires in 1 hour and can only be used once.`
- Button text: `Sign in to HireWire`

**Invite User**
- Subject: `You've been invited to HireWire`
- Message: `You've been invited to join HireWire. Click the button below to accept the invitation and set up your account.`
- Button text: `Accept invitation`

**Reset Password**
- Subject: `Reset your HireWire password`
- Message: `We received a request to reset your password. Click the button below to choose a new one. If you didn't request this, you can safely ignore this email.`
- Button text: `Reset password`

**Change Email Address**
- Subject: `Confirm your new HireWire email`
- Message: `Click the button below to confirm your new email address for HireWire.`
- Button text: `Confirm new email`

**Reauthentication**
- Subject: `HireWire security verification`
- Message: `Use the code below to complete your HireWire verification. This code expires in 10 minutes.`
- Button text: `Verify`

---

## 2. AUTH URL CONFIGURATION

Location: Supabase Dashboard > Authentication > URL Configuration

| Field | Required Value | Status |
|---|---|---|
| Site URL | Production HireWire domain (e.g. `https://app.hirewire.co`) | NEEDS TEAM INPUT |
| Redirect URLs | Add production URL + `http://localhost:3000/**` for local dev | NEEDS TEAM INPUT |

Important: Do NOT use a v0 preview URL as the Site URL in production. This will cause all auth email links to point to a preview deployment.

---

## 3. SMTP SETTINGS

Location: Supabase Dashboard > Authentication > SMTP Settings

| Field | Required Value |
|---|---|
| From name | HireWire |
| From email | Official HireWire send-from address (e.g. `noreply@hirewire.co`) |
| Reply-to | Support address (e.g. `support@hirewire.co`) |
| SMTP host | Team's email provider (Resend, SendGrid, Postmark, etc.) |

Note: Without custom SMTP, Supabase sends from a `@supabase.io` address. This must be changed before production.

---

## 4. EMAIL LOGO HOSTING

The logo referenced in email templates must be at a stable public URL on the production domain.

Required path: `https://YOUR_PRODUCTION_DOMAIN/brand/hirewire-logo.png`

The file is already in the repo at `/public/brand/hirewire-logo.png`.
Once deployed to production, update all email templates to point to the production URL.

Do not use:
- Blob storage URLs (change frequently)
- v0 preview URLs (not stable)
- Base64 inline images (blocked by many email clients)

---

## 5. SECURITY AND AUTH COPY

Confirm the following in the Next.js app (already done, listed for audit sign-off):

| Check | Status |
|---|---|
| Login page does not mention Supabase | Done |
| Signup page does not mention Supabase | Done |
| Auth layout shows HireWire logo, not Supabase branding | Done |
| Auth error page shows HireWire copy | Done |
| Auth callback page (`/auth/callback`) does not expose Supabase branding | Needs audit |
| No Supabase keys or project references in client-side rendered HTML | Confirm via browser inspector |
