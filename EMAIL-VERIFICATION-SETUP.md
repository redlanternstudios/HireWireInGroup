# HireWire Email Verification Setup

## Problem
Verification emails are not being received when users sign up. Supabase needs to be configured with HireWire-branded email templates.

## Root Causes
1. **Supabase Email Configuration Missing** - Default Supabase template isn't branded
2. **Custom Email Template Not Set** - HireWire needs its own template
3. **SMTP Provider Not Configured** - No external email service connected

## Solution: 3 Steps

### Step 1: Set HireWire Email Template in Supabase (REQUIRED - Do Now)

Go to: **Supabase Dashboard** → **Authentication** → **Email Templates**

For **Confirm signup** email template, use this HTML:

```html
<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8">
    <style>
      body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; background: #f5f5f5; margin: 0; padding: 20px; }
      .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; padding: 40px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
      .logo { font-size: 24px; font-weight: bold; color: #dc0000; margin-bottom: 30px; }
      h1 { color: #1a1a1a; font-size: 28px; margin: 0 0 20px; }
      p { color: #666; font-size: 16px; line-height: 1.6; margin: 15px 0; }
      .button-container { margin: 35px 0; }
      .button { background: #dc0000; color: white; padding: 14px 32px; border-radius: 6px; text-decoration: none; display: inline-block; font-weight: 600; }
      .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #999; }
      .success-badge { display: inline-block; background: #f0f9ff; color: #0369a1; padding: 10px 16px; border-radius: 4px; margin: 20px 0; font-weight: 500; }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="logo">HireWire</div>
      
      <h1>Verify Your Email</h1>
      <p>Welcome to HireWire! We're excited to have you on board.</p>
      
      <p>To complete your account setup and start building your job search on real evidence, please verify your email address by clicking the button below:</p>
      
      <div class="button-container">
        <a href="{{ .ConfirmationURL }}" class="button">Verify Email Address</a>
      </div>
      
      <div class="success-badge">✓ This link expires in 24 hours</div>
      
      <p style="color: #999; font-size: 14px;">Or copy and paste this link in your browser:</p>
      <p style="word-break: break-all; background: #f5f5f5; padding: 12px; border-radius: 4px; font-family: monospace; font-size: 12px;">{{ .ConfirmationURL }}</p>
      
      <div class="footer">
        <p>If you didn't create a HireWire account, please ignore this email.</p>
        <p>&copy; {{ .CurrentYear }} HireWire. All rights reserved.</p>
      </div>
    </div>
  </body>
</html>
```

**Variable Reference:**
- `{{ .ConfirmationURL }}` - Auto-generated verification link
- `{{ .CurrentYear }}` - Auto-generated current year

### Step 2: Test Email Delivery (Do Now)

1. Go to v0 preview at `localhost:3200/signup`
2. Enter test email: `roryleesemeah+test1@icloud.com`
3. Enter password: `TestPassword123!`
4. Click "Create Account"
5. **Check email inbox** (including spam/promotions folder)

**What to expect:**
- Email from: `noreply@mail.supabase.io` (or your domain if custom SMTP configured)
- Subject: "Confirm your signup"
- Contains: Verify button + HireWire branding

### Step 3: Configure Custom SMTP (Optional, for Production)

If emails still don't arrive after Step 1, add your own email service:

**Option A: SendGrid (Recommended)**
1. Create SendGrid account
2. Get API key
3. In Supabase: **Settings** → **SMTP Settings**
4. Enter SendGrid credentials
5. Set "From Email" to `noreply@hirewire.app`

**Option B: Resend (Best for Startups)**
1. Create Resend account  
2. Get API key
3. In Supabase: **Settings** → **SMTP Settings**
4. Use Resend credentials
5. Set "From Email" to `verify@hirewire.app`

## Testing Credentials (For Manual Testing)

Once verification email works:

1. **Create Account**
   - Email: `roryleesemeah@icloud.com`
   - Password: `Homie16$`

2. **Verify Email**
   - Check inbox for verification link
   - Click link to confirm email

3. **Log In**
   - Email: `roryleesemeah@icloud.com`
   - Password: `Homie16$`
   - Should see dashboard

4. **Grant Full Access**
   - In Supabase dashboard
   - Go to **Table Editor** → **subscriptions**
   - Find your user record
   - Set: `plan_type = "pro"` (or "enterprise")
   - Set: `subscription_status = "active"`
   - Set: `current_period_end = 2099-12-31T23:59:59Z`

## Troubleshooting

**Emails Not Arriving?**
- Check spam/promotions folder
- Verify email template saved (Step 1)
- Check Supabase email logs: **Authentication** → **Logs**
- Verify Supabase project URL is correct
- Test from different email (some providers block Supabase)

**Template Not Updating?**
- Clear browser cache
- Wait 5 minutes for Supabase to sync
- Try incognito/private window

**Login Still Blocked?**
- Verify email must be clicked first
- Check if email verification is `email_confirmed = true` in Supabase
- Check auth policy in database (likely blocking unverified users)

## Auth Policy Check

Your login page at `/login` uses:
```typescript
const { data, error } = await supabase.auth.signInWithPassword({
  email,
  password,
})
```

This should work even before email verification. If it's blocked, check:
1. **Supabase** → **Authentication** → **Policies**
2. Look for any rule requiring `email_confirmed = true`
3. Temporarily disable if testing

## Files Involved

- `/app/(auth)/signup/page.tsx` - Signup form
- `/app/(auth)/login/page.tsx` - Login form  
- `/app/auth/callback/route.ts` - Email verification callback
- `/lib/supabase/server.ts` - Auth configuration

## What's Already Done

✅ Signup form with password validation  
✅ Login form with email/password  
✅ Email verification callback  
✅ User profile creation on signup  
✅ Onboarding check  
✅ Route protection middleware

## What's Left

⚠️ **Email template customization** (Step 1)  
⚠️ **Test email delivery** (Step 2)  
⚠️ **Verify credentials work** (Step 2)  
⚠️ **Set user plan to Pro/Enterprise** (Step 4)

## Next: Testing With Your Credentials

Once email template is set and verified:

1. Sign up with: `roryleesemeah@icloud.com` / `Homie16$`
2. Verify email from inbox
3. Log in
4. Update subscription in Supabase to Pro
5. Full dashboard access works

## Questions?

- Check Supabase docs: https://supabase.com/docs/guides/auth/auth-email
- Check HireWire auth files for current logic
- Verify database RLS policies aren't blocking access
