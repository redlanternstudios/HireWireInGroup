# Supabase Audit

Audit Supabase usage. Do not edit files.

Find every Supabase call and API route that touches Supabase.

For each, report:

- file path
- function or route
- tables touched
- operation type: select, insert, update, delete, upsert, rpc, storage upload, storage download
- auth context
- inputs
- outputs
- error handling
- status
- risk

Flag:

- hardcoded user IDs
- missing user scoping
- missing tenant scoping
- missing error handling
- missing loading states
- missing empty states
- mock fallbacks
- dangerous broad queries
- duplicate clients
- client-side writes that should be server-side
- unused server actions
- unused API routes

Do not propose schema changes until the current schema is proven from migrations/types.

