# Build Day Prompt

Use this command as the daily bookend system for HireWire convergence.

## Start Of Build Day

```txt
We are starting a new HireWire Build Day.

Before doing anything:
1. Read CLAUDE.md.
2. Read MEMORY.md.
3. Read memory/project_claude_ai_os_constitution.md.
4. Read .claude/context/product.md.
5. Read .claude/context/architecture.md.
6. Read .claude/context/protected-files.md.
7. Read .claude/commands/health-check.md.
8. Read .claude/commands/convergence-check.md.
9. Check git status.
10. Do not edit files yet.

Current product convergence point:

HireWire is an Application Readiness Engine.

The core journey must converge into one clean loop:

Sign up/sign in
-> Dashboard
-> Add or capture job
-> Analyze job post
-> Compare job requirements against Career Context
-> Identify missing or weak evidence
-> Use Match Interview to clarify only what is unclear
-> Save confirmed/skipped proof
-> Recalculate readiness
-> Generate grounded Application Package
-> Preview package with provenance
-> Pass Ready to Apply gate
-> Apply or log override
-> Track status and outcomes
-> Feed outcomes back into Career Context

Today's job is not to add random features.
Today's job is to move the actual repo closer to that convergence point.

First, run a no-edit Build Day readiness scan that combines health-check and convergence-check.

Health-check must inspect:
- repo status
- dependency scripts
- route structure
- auth boundaries
- API health
- Supabase/migration health
- TODO/FIXME
- console logs
- dead buttons
- protected-file drift

Convergence-check must inspect whether the actual repo is moving toward:
- add/capture job
- analyze job
- prove fit with Match Interview
- save confirmed/skipped proof
- recalculate readiness
- generate grounded package
- preview provenance
- gate apply
- log override/outcome
- feed outcomes back into Career Context

Then produce a short Build Day orientation:

A. Current git status
B. Current highest-risk changed files
C. Health-check findings, grouped P0/P1/P2/P3
D. Convergence-check verdict
E. Which part of the core journey is most broken or least converged
F. What should be P0 today
G. What should explicitly not be touched today
H. Recommended implementation scope
I. Verification commands that should run before the day ends

Do not build until I approve the scope.
```

## End Of Build Day

```txt
We are ending this HireWire Build Day.

Do not start new work.

Inspect the actual repo and produce a Build Day closeout against the convergence point.

Read:
1. CLAUDE.md
2. MEMORY.md
3. memory/project_claude_ai_os_constitution.md
4. .claude/context/product.md
5. .claude/context/architecture.md
6. .claude/context/protected-files.md

Then inspect:
1. git status --short
2. git diff --stat
3. git diff for all changed files
4. any new migrations
5. any touched API routes, server actions, readiness files, coach files, package files, or Supabase files
6. .claude/commands/health-check.md
7. .claude/commands/convergence-check.md

Then run the closeout as a combined health-check and convergence-check:

Health-check closeout must identify:
- build/test verification state
- protected-file changes
- auth/Supabase risk
- dead or fake UI introduced
- duplicate systems introduced
- stale TODO/FIXME/console log risk
- P0/P1/P2/P3 remaining risks

Convergence-check closeout must identify:
- which part of the core journey improved
- which part of the core journey is still broken
- any new drift away from the Application Readiness Engine promise
- whether today's changes made downstream systems more or less reliable

Evaluate today's work against the core journey:

Sign up/sign in
-> Dashboard
-> Add/capture job
-> Analyze job
-> Compare requirements to Career Context
-> Identify weak/missing evidence
-> Match Interview clarifies ambiguity
-> Confirmed/skipped proof is saved
-> Readiness recalculates
-> Application Package generates from proof
-> Package preview shows provenance
-> Ready to Apply gate blocks/allows
-> Apply or override is logged
-> Outcomes feed back into Career Context

Output:

A. What changed today
B. Files changed
C. Health-check closeout findings
D. Convergence-check closeout verdict
E. Which part of the core journey improved
F. Which part of the core journey is still broken
G. Any new duplicate systems or drift introduced
H. Any protected files touched
I. Any Supabase/schema impact
J. Any auth/RLS/user-scoping risk
K. Any buttons or UI that now look wired but are not
L. Verification run and results
M. What was not verified
N. Rollback notes
O. P0 risks remaining
P. Recommended next Build Day P0
Q. Recommended next prompt for VS Code
R. Recommended next prompt for v0
S. Recommended next Supabase check

End with a direct verdict:

Did today move HireWire closer to the Application Readiness Engine convergence point?
Answer YES / PARTIALLY / NO, and explain why in under 5 bullets.
```
