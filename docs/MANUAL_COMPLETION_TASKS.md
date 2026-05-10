# HireWire Manual Completion Tasks

## Required Manual Steps

1. Stripe/Paywall
   - Configure Stripe account and API keys in `.env.local`
   - Verify Stripe webhooks and billing flows in production
   - Test real payment and upgrade flows

2. Company Tracking
   - Validate company deduplication and insights with real data
   - Review company table and analytics for accuracy

3. Analytics
   - Connect production analytics provider (e.g., Vercel, PostHog)
   - Validate funnel, evidence effectiveness, and engagement metrics

4. Coach Nudge Expansion
   - Review and tune nudge logic for real user sessions
   - Validate session memory and cross-page context

5. Dead Code Removal
   - Manually review archive/legacy files for safe deletion
   - Confirm no regressions after removal

6. Documentation
   - Review and update README.md with all new features and flows
   - Add/verify usage instructions for evidence import/export, tagging, mapping
   - Document analytics, Stripe/paywall, company tracking, Coach nudge
   - Maintain CHANGELOG for all major changes

7. Test Environment
   - Ensure Supabase and API endpoints are running for test execution
   - Run `pnpm test` and validate all tests pass

---

> All other code, logic, and automated tests are handled by the system orchestrator. Manual steps above require your credentials, production access, or human review.
