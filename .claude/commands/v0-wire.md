---
description: Wire v0 component into codebase
---

Component file: $ARGUMENTS

Wire this component with correct props from the existing data layer.

Rules:
- Do not redesign the visual structure
- Do not add server logic unless specified in the task
- Confirm the props interface before wiring
- Use existing hooks and helpers — do not create new ones
- Use requireUser() for auth — never inline auth checks
- All Supabase queries must include .eq("user_id", user.id)
- JSONB columns: use Array.isArray() guard, never .column || []

Return: wired component + which hooks/helpers used + verification step

TOOLS: Read, Edit
FORBIDDEN: Redesigning component, adding server state, creating new helpers
EXPECTED OUTPUT: Wired component + integration points + verification command
