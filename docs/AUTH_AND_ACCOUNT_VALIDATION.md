# Auth and Account Safety Validation

This document reviews all auth and account flows for safety, branding, and tenant isolation.

## Validation
- Signup, login, logout, magic link, password reset, callback, protected routes, unauthorized/session expired, email templates, redirect URLs, account deletion/export if present
- No protected page leaks data
- Only requireUser for auth checks
- No cross-user data access
- Auth emails branded
