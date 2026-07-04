---
description: Session usage and context audit
---

Run these checks and report:
1. Estimate how many turns this session has had
2. List every file that has been read in this session
3. List every tool call made
4. Identify the largest context consumers
5. Recommend whether to: continue / reset thread / switch to lighter model

Also tell me: am I close to hitting the 5-hour window limit based on session length?

Return as a structured list. Under 100 words.

TOOLS: Bash (read-only: cat .claude/task_log.jsonl 2>/dev/null | tail -20)
FORBIDDEN: Any file edits
EXPECTED OUTPUT: Session context summary + recommendation
