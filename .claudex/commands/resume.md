# /resume

Invoke the employer-safe resume production and audit workflow defined in `../skills/resume/SKILL.md`.

## Supported modes
- `/resume build <job>` - create a tailored one-page resume and employer-safe cover letter.
- `/resume audit <file-or-folder>` - audit branding, content, sizing, spacing, page utilization, chronology, ATS safety, and employer-facing exclusions.
- `/resume rebuild <range>` - rebuild a numbered application-pack range and replace rejected copies.
- `/resume verify <file-or-folder>` - run final release checks without changing content.

## Default behavior
When no mode is supplied, audit first, report failures, then rebuild only after preserving verified source content.

## Non-negotiable release gate
No file may be released when it contains RedLantern/HireWire branding, internal evaluation content, tiny text, excessive empty page area, incomplete career progression, merged Ingram roles, weakened loanDepot leadership context, or unverified claims.
