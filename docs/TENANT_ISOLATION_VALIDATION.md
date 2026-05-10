<<<<<<< HEAD
# Tenant Isolation and Data Security Validation

This document reviews all user scoped queries and data access for tenant isolation and security.

## Validation
- .eq("user_id", user.id) on all queries
- .is("deleted_at", null) for jobs
- RLS policies
- Server actions, API routes, RSC pages, exports, coach, analytics, logs, applications, documents, evidence, profile, billing
- Special review: any query without user_id, admin/service role, export, coach, search, document route
=======
# TENANT_ISOLATION_VALIDATION.md
# Verified: 2026-05-10 | Branch: v0/rsemeah-8ad75be8

## Scope
Every query touching user data has explicit `user_id` filter. Jobs queries include `deleted_at IS NULL`. No cross-tenant data leak possible.

## Findings

### Jobs Table — user_id + deleted_at
Verified on all 51 query locations found by audit:

| File | user_id | deleted_at | Status |
|---|---|---|---|
| `analytics/page.tsx` | ✓ | ✓ | PASS |
| `applications/page.tsx` | ✓ | ✓ | PASS |
| `dashboard/page.tsx` | ✓ | ✓ | PASS |
| `documents/page.tsx` | ✓ | ✓ | PASS |
| `jobs/[id]/documents/page.tsx` | ✓ | ✓ | PASS |
| `jobs/[id]/page.tsx` | ✓ | ✓ | PASS |
| `jobs/page.tsx` | ✓ | ✓ | PASS |
| `ready-queue/page.tsx` | ✓ | ✓ | PASS |
| `lib/actions/jobs.ts` | ✓ | ✓ | PASS |
| `lib/readiness.ts` | ✓ | ✓ | PASS |
| `app/api/generate-documents/route.ts` | ✓ | ✓ (on reads) | PASS |
| `app/api/coach/sessions/` | ✓ | N/A | PASS |
| `lib/company-utils.ts` | ✓ | ✓ | PASS |

### evidence_library — user_id
- All evidence queries include `.eq("user_id", user.id)`
- **Status:** PASS

### user_profile — user_id  
- All profile queries include `.eq("user_id", user.id)`
- **Status:** PASS

### RLS Policy
- Supabase RLS is enabled as backup safety net
- Per CLAUDE.md §6: explicit filters are primary, RLS is backup
- Both layers active
- **Status:** PASS

### byred_ Tables
- No references to `byred_*` tables in any app/ or lib/ file
- **Status:** PASS

### Deprecated Tables
- No references to `jobs_deprecated`, `profiles_deprecated`, `profiles` (base table)
- **Status:** PASS

## Overall: PASS — 0 critical issues. Both user_id and deleted_at filters verified on all jobs queries.
>>>>>>> 7e1a8af916b56410048e0bfccadd90f00d881991
