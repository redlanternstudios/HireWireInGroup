---
description: Supabase read-only verification
---

Table/assumption: $ARGUMENTS

Check whether this assumption is correct for this table.
Cross-reference against COLUMN NAME MAP in CLAUDE.md before answering.
Do NOT generate application code.
Do NOT suggest schema changes.

Return:
1. Verdict: valid / risky / likely wrong
2. Verification SQL (read-only SELECT only)
3. Risk if assumption is wrong
4. Which app file would break first

TOOLS: Read (SQL reasoning only)
FORBIDDEN: App code changes, schema changes, INSERT/UPDATE/DELETE SQL
EXPECTED OUTPUT: Verdict + verification SQL + risk + first file to break
