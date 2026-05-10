# HireWire — Supabase Branding Tasks

This document lists all Supabase dashboard settings and tasks required to ensure HireWire branding is present in all user-facing auth and email flows.

## 1. Auth Email Templates
Go to Supabase dashboard → Authentication → Emails → Templates

Update each template:
- Confirm signup
- Magic link
- Invite user
- Reset password
- Change email address
- Reauthentication
- OTP (if enabled)

Each template should:
- Use HireWire logo (public/brand/hirewire-email-logo.png)
- Use HireWire brand colors
- Use "HireWire" as from name if possible
- Avoid Supabase default wording
- Use clear CTA
- Use branded footer
- Avoid generic “Supabase Auth” language

## 2. Auth URL Configuration
Go to Supabase dashboard → Authentication → URL Configuration
- Site URL: Set to production HireWire domain
- Redirect URLs: Include production and local dev
- No random v0 preview URL as production user facing URL

## 3. SMTP Settings
Go to Supabase dashboard → Authentication → SMTP settings
- Custom SMTP configured if available
- From name: HireWire
- From email: official HireWire email
- Reply to: support or no reply address
- No default Supabase sender in production

## 4. Email Logo Hosting
- Logo should use stable public URL (e.g. https://yourdomain.com/brand/hirewire-email-logo.png)

## 5. Security and Auth Copy
- Ensure user facing auth screens in app do not expose Supabase branding

## Output Required
- List exact Supabase dashboard fields that need values from user:
  - Site URL
  - Redirect URLs
  - SMTP From name
  - SMTP From email
  - SMTP Reply to email
  - Logo image URL
  - Auth email subjects
  - Auth email template HTML
  - Branded footer copy
  - Production domain asset URL for logo
