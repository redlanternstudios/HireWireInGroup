---
description: Contained single-error debug
---

Error: $ARGUMENTS

Instructions:
- Read only the file where the error occurs (state which one before reading)
- Do not read other files without asking me first
- Do not suggest refactors unrelated to the error
- Identify root cause first, then patch only
- If root cause is in another file, name it and stop
- Do not dump full terminal logs — paste only the relevant error line

Return: root cause + minimal patch + test step

TOOLS: Read, Edit, Bash (limited)
FORBIDDEN: Reading files beyond error source, scope expansion, log dumps
EXPECTED OUTPUT: Root cause + patch + verification command
