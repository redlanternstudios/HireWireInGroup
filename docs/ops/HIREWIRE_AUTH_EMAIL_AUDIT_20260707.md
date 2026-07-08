# HireWire Auth Email Audit 2026 07 07

## Objective

Fix the broken signup and sign in recovery path, and identify why confirmation email is not landing as HireWire branded mail.

## Prompt Contract

GOAL: Identify the account creation and email delivery failure with evidence, patch the app recovery path, and leave a verification receipt.

CONSTRAINTS: Do not expose secrets. Do not change schema. Do not directly commit to main. Do not claim live inbox delivery without inbox proof.

FORMAT: Audit receipt with truth labels, CTP summary, changed files, verification, and open proof gaps.

FAILURE: The work fails if it treats Supabase accepted signup as email delivery, hides the unconfirmed user state, or claims branding is live without readback.

## Reality Check

VERIFIED: The HireWire app uses Supabase Auth for signup, password sign in, and magic link email delivery.

VERIFIED: The repository contains HireWire branded Supabase Auth templates under `docs/email-templates/`.

VERIFIED: Supabase project `endovljmaudnxdzdapmf` is live and healthy.

VERIFIED: Live Supabase query on 2026 07 07 showed 34 auth users, 7 users created in the last 24 hours, and all 7 recent users unconfirmed.

PARTIAL: The frontend signup request reaches Supabase because new unconfirmed users exist.

UNKNOWN: Current hosted Supabase Auth template and SMTP settings. This session could query Postgres, but not read hosted Auth mail config.

UNKNOWN: Inbox delivery for the latest confirmation email. This requires Gmail or mailbox proof.

## CTP Summary

### Problem Statement

Engineering problem: account creation reaches Supabase, but the user is stranded when the confirmation email does not arrive or the account remains unconfirmed.

Operations problem: the repo claims branded templates are live, but live config readback is not present in this session.

### Three Pass Analysis

Pass 1: The buttons look broken because the user clicks signup or sign in and no usable account session follows.

Pass 2: Signup is not fully dead. Supabase has recent unconfirmed users, so the failure is after request acceptance: email delivery, template configuration, redirect allow list, spam filtering, or user not having a resend route.

Pass 3: The real product failure is absence of a closed auth recovery loop. Even if SMTP is repaired, users need a resend path from signup success and from unconfirmed sign in errors.

### Ten Layer Analysis

1. Surface: Signup and sign in appear broken.
2. Root cause: Users remain unconfirmed and cannot recover from the app.
3. First order consequence: Users cannot enter onboarding.
4. Second order consequence: New user trust drops before product value is reached.
5. Third order consequence: Launch traffic creates silent unconfirmed accounts and support load.
6. Upstream dependencies: Supabase Auth config, SMTP provider, allowed redirect URLs, branded templates, app resend controls.
7. Downstream dependencies: Onboarding, dashboard entry, billing, evidence creation, coach loop.
8. Failure modes: SMTP disabled, template not applied, redirect not allowed, email in spam, duplicate unconfirmed signup, rate limit.
9. Recovery paths: Resend confirmation, magic link, password sign in after confirmation, mailbox proof, Auth config readback.
10. Strategic implication: Auth must be treated as a product flow, not a backend assumption.

### Behavioral Driver Separation

Driver: The user expects immediate access or a clear next action after creating an account.

Mechanism: Supabase Auth confirmation email plus app resend controls.

Real constraint: The app accepted account creation but did not give the user a recovery loop when email did not arrive.

## Execution

Changed `app/(auth)/signup/page.tsx`.

Changed `app/(auth)/login/page.tsx`.

Added shared redirect construction inside each auth page so confirmation resend uses the same callback route as initial signup.

Added product metadata on signup so future template or auth logic can distinguish HireWire users in the shared Supabase project.

Added resend confirmation email control on the signup success state.

Added resend confirmation email control on sign in when Supabase reports an unconfirmed email.

## Acceptance Criteria

VERIFIED: Signup still calls `supabase.auth.signUp`.

VERIFIED: Signup success now offers `Resend confirmation email`.

VERIFIED: Password sign in now detects unconfirmed email errors and offers `Resend confirmation email`.

VERIFIED: Resend calls `supabase.auth.resend` with `type: 'signup'`.

UNKNOWN: Confirmation email lands in an inbox with HireWire branding. Requires mailbox proof.

UNKNOWN: Hosted Supabase Auth template body matches repository template. Requires Auth config readback or dashboard proof.

## Verification Receipt

VERIFIED: `npm install --package-lock=false` completed locally to restore missing dependencies. No lockfile was created.

VERIFIED: `npm run typecheck` passed.

VERIFIED: `npm run lint` passed with four existing warnings outside the touched auth files.

VERIFIED: Initial `npm run build` failed only because sandboxed network access blocked Google Fonts.

VERIFIED: Escalated `npm run build` passed.

PARTIAL: Browser verification reached `http://localhost:3000/signup` and `http://localhost:3000/login`, but both routes showed the local runtime error `[HireWire] Missing NEXT_PUBLIC_SUPABASE_URL`. This is a local environment gap in the fresh checkout, not proof that production lacks the variable.

VERIFIED: Static auth recovery check passed. Both touched auth files contain `supabase.auth.resend` and `Resend confirmation email`.

## Definition Of Done

Code fix is done when typecheck, lint, and build pass.

Runtime auth is done only when a browser proof shows signup, resend, confirmation, onboarding, dashboard entry, and signout.

Email delivery is done only when an inbox receipt shows HireWire branded mail from the expected sender.

## Open Follow Up

1. Read hosted Supabase Auth settings for confirmation, magic link, recovery templates, subjects, SMTP host, and sender.
2. Send a fresh disposable signup, capture inbox proof, and delete or retain test user per policy.
3. Confirm allowed redirect URLs include production, preview, and local callback paths.
