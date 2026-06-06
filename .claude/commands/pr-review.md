---
description: Bounded PR diff review
---

$ARGUMENTS

Review only what is in this diff.

Check for:
1. Unintended behavior changes
2. Missing edge case handling
3. Hardcoded values that should be dynamic
4. Breaking changes to interface or props
5. Security risks around user input, auth, or data access
6. Missing user_id filter on any Supabase query
7. JSONB .map() without Array.isArray() guard
8. Any import from @ai-sdk/groq or use of generateObject()

Do NOT suggest rewrites or style changes.
Return: PASS / FLAG / REJECT + specific line callouts.

TOOLS: Read (diff only)
FORBIDDEN: Scope expansion, style comments, rewrite suggestions
EXPECTED OUTPUT: Pass/Flag/Reject verdict + specific line issues
