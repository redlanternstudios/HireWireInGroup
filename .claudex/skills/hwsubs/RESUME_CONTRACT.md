# /hwsubs → /resume Contract

## Rule
`/hwsubs` orchestrates job analysis and application assembly. `/resume` exclusively owns resume generation, typography, spacing, page fitting, ATS output, branding safety, audit, and release verification.

## Required flow
1. `/hwsubs` validates the job and extracts verified requirements.
2. `/hwsubs` sends the target role, company, job description, verified candidate evidence, and keyword priorities to `/resume build`.
3. `/resume` generates the employer-facing resume using `.claudex/skills/resume/SKILL.md`.
4. `/resume audit` checks content, typography, page utilization, ATS extraction, branding, and employer safety.
5. Failed output is rebuilt by `/resume`; `/hwsubs` must not patch layout itself.
6. `/resume verify` must return PASS before `/hwsubs` assembles the employer-facing pack.
7. Employer-facing pack contains only the verified resume and cover letter.

## Conflict precedence
When `/hwsubs`, another agent, an older template, or a batch script conflicts with `/resume`, `/resume` wins.

## Hard rejection triggers
Reject and rebuild when any resume contains:
- RedLantern Studios or HireWire visual branding;
- slogans, footer bars, logos, internal labels, candidate profiles, scores, CTP, readiness briefs, or strategy notes;
- body text below 8.4 pt or metadata below 8.1 pt;
- page utilization outside 82-92% without an approved exception;
- merged Ingram roles or materially weakened loanDepot leadership context;
- clipping, overlap, rasterized text, broken extraction order, or unverified claims.

## Batch scope
Roles 30-65 remain rejected until each file passes `/resume verify`. Corrected files must replace old local, Drive, and Claudex copies without mixing generations.
