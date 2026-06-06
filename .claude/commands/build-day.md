# Build Day

Use this command to execute a scoped Build Day task.

Before editing:

1. Read `CLAUDE.md`.
2. Read `.agent/BUILD_CONTEXT.md` if present.
3. Read `.agent/CODEX_TASK.md` if present.
4. Read `.agent/ACCEPTANCE_CRITERIA.md` if present.
5. Inspect relevant files.
6. Confirm scope from the user's current message.

Rules:

- Do not expand scope.
- Do not add new features during stabilization unless explicitly requested.
- Do not modify protected files without a narrow reason.
- Do not change schema unless explicitly requested.
- Prefer small patches.
- Preserve user changes in the working tree.

Before final response, run applicable checks:

```bash
npx tsc --noEmit
npm run lint
npm run build
```

Final response must include:

- changed files
- what changed
- verification run
- risks
- rollback notes

