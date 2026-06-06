# Health Check

Run a repo health check. Do not edit files.

Read:

- `CLAUDE.md`
- `MEMORY.md`
- `memory/project_claude_ai_os_constitution.md`
- `.claude/context/architecture.md`
- `.claude/context/protected-files.md`
- `.claude/context/verification.md`

Inspect:

- `git status --short`
- `package.json`
- Next config
- app route structure
- API routes
- Supabase clients
- auth/middleware/proxy files
- migrations
- TODO/FIXME comments
- console logs
- dead buttons and placeholder alerts
- duplicate systems
- protected-file changes

Output:

A. Repo status
B. Highest-risk changed files
C. Broken or missing verification
D. Dependency/script health
E. Route/API health
F. Auth/Supabase health
G. Dead UI or placeholder behavior
H. Duplicate/stale systems
I. P0/P1/P2/P3 risks
J. Recommended next command

Do not claim a feature works unless file, handler, API/database call, and downstream effect are verified.

