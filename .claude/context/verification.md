# Verification

Run these after readiness, route, API, schema, auth, or document-generation changes:

```bash
npx tsc --noEmit
npm run lint
npm run build
```

If a command cannot run, report:

- command
- why it could not run
- whether the change is still safe
- what the user should run next

For audits, do not claim a feature works because UI exists. Verify:

- file
- handler
- state
- route
- API call
- database call
- downstream effect

