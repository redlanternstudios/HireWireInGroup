# API Route Audit

Audit `app/api/**`. Do not edit files.

For every route:

- route path
- HTTP methods
- auth check
- request schema or validation
- Supabase tables touched
- user scoping
- side effects
- response shape
- error handling
- frontend callers
- downstream dependencies
- risk level

Special attention:

- `/api/analyze`
- `/api/re-analyze`
- `/api/generate-documents`
- `/api/export-docx`
- `/api/coach/**`
- `/api/jobs/[id]/**`
- `/api/evidence/**`
- `/api/resume/upload`
- `/api/linkedin/**`
- `/api/stripe/**`
- `/api/integrity/**`

Return unused, duplicate, stale, and risky routes separately.

