---
description: Generate Keymon task card
---

Task description: $ARGUMENTS

Generate a complete Keymon task card in this format:

TASK ID: [KM-YYYYMMDD-NNN]
ASSIGNED: [today's date]
TASK: [one sentence]
GOAL: [what done looks like]
FILES TO TOUCH: [explicit list]
FILES NOT TO TOUCH: [explicit list — always include lib/auth, lib/billing, middleware.ts, lib/contracts]
CURRENT STATE: [brief]
EXPECTED STATE: [brief]
ACCEPTANCE CRITERIA: [3 bullets max]
VERIFICATION: [command or manual step]
RISK LEVEL: [TINY / SMALL / MEDIUM]
CLAUDE PROMPT: [paste relevant slash command]
STOP CONDITION: [when to ping Rory]
DONE WHEN: Verification passed + /closeout submitted

TOOLS: None
FORBIDDEN: Executing the task, editing files
EXPECTED OUTPUT: Complete task card ready to hand to Keymon
