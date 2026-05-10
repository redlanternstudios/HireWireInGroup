# Tenant Isolation and Data Security Validation

This document reviews all user scoped queries and data access for tenant isolation and security.

## Validation
- .eq("user_id", user.id) on all queries
- .is("deleted_at", null) for jobs
- RLS policies
- Server actions, API routes, RSC pages, exports, coach, analytics, logs, applications, documents, evidence, profile, billing
- Special review: any query without user_id, admin/service role, export, coach, search, document route
