# Login Testing Guide for HireWire

## What Was Fixed
- **Multiple GoTrueClient instances issue** — Fixed by implementing lazy singleton pattern in `/lib/supabase/client.ts`
- This was preventing proper auth state management and causing the "Multiple GoTrueClient instances detected" warning

## Test Login Flow

### Step 1: Navigate to Login
1. Open the app at `localhost:3000`
2. Click "Log in" or go directly to `/login`

### Step 2: Enter Test Credentials
- **Email:** `roryleesemeah@icloud.com`
- **Password:** `Homie16$`

### Step 3: Expected Behavior
- Form validates input
- Submits to Supabase auth
- If credentials are correct → redirects to `/dashboard`
- If email not verified → may show verification requirement (depending on Supabase settings)
- Auth state persists across page refresh

### Step 4: Verify in Dashboard
Once logged in, you should see:
- Navigation sidebar with menu items
- Dashboard content loads
- User session is active
- Back/forward navigation controls work

## Supabase Setup for Test Account

If the test account doesn't exist or needs credentials updated:

### In Supabase Dashboard:

1. **Navigate to:** Authentication → Users
2. **Find or create user:** `roryleesemeah@icloud.com`
3. **Set credentials:**
   - Email: `roryleesemeah@icloud.com`
   - Password: `Homie16$` (use Supabase's password reset to set this)
   - Email confirmed: YES (check this box)

4. **Set subscription to Pro:**
   - Go to Table Editor → `user_profile` table
   - Find the user record (filter by `user_id`)
   - Set: `plan_type = 'pro'`
   - Set: `subscription_status = 'active'`
   - Set: `current_period_end = '2099-12-31'`

## Email Verification Template

Email verification is now configured (see EMAIL-VERIFICATION-SETUP.md) with HireWire branding.

When a new user signs up:
1. Verification email sent with HireWire branding
2. User clicks link in email
3. Email marked as verified
4. Can then log in

## Debugging

### Issue: "Invalid login credentials"
- Verify email exists in Supabase → Users table
- Verify password is set correctly
- Check email is confirmed (`email_confirmed_at` is not null)

### Issue: "Multiple GoTrueClient instances" warning
- This is now fixed
- If still seeing warning, check browser console for origin
- Refresh page if needed

### Issue: Redirected to /onboarding
- User exists but `onboarding_complete = false` in `user_profile`
- Update this field to `true` in the table editor

### Issue: Can't access dashboard features
- Check `plan_type` is set to 'pro' (not 'free')
- Check `subscription_status = 'active'`
- Check `current_period_end` is in the future

## Success Indicators

✅ Can log in with email/password
✅ Redirected to dashboard
✅ Can see sidebar navigation
✅ Back/forward buttons visible and functional
✅ No auth-related console errors
✅ Session persists on page refresh
✅ Can log out

