# Review Diff

Perform a code review. Do not edit files.

Read:

- `CLAUDE.md`
- `.claude/context/protected-files.md`
- `.agent/ACCEPTANCE_CRITERIA.md` if present

Inspect:

- `git status --short`
- `git diff --stat`
- `git diff`

Review stance:

- findings first
- ordered by severity
- exact file and line references
- focus on bugs, regressions, missing tests, data leaks, readiness drift, schema drift, and broken user journeys

Do not summarize before findings.

Use severities:

- Critical
- High
- Medium
- Low

If no issues are found, say that clearly and mention remaining test gaps or residual risk.

