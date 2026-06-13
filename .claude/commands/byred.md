# By Red LLC — Custom Commands
# Ro Semeah / RedLantern Studios specific commands
# These go beyond the universal 100 and are specific to this operating system

/LEDGER — Run Lesson Ledger pre-flight. Surface all active rules for current domain.
Domains: Engineering, Supabase, HireWire, Architecture, Legal, Contracts, Brand
Rule: Do not start any build task until rules are surfaced and applied.
Source: Notion page 36d8b528-99a4-81f5-b748-ca164507f1d1

/WRAP — Run Session Brain end-of-session protocol.
Captures: what was built, what was decided, what was blocked, next action
Writes: session log to /Documents/Claude/Sessions/
Updates: Lesson Ledger with any new rules generated this session

/WIRE [component] — Connect v0 component to live Supabase data.
Applies: Array.isArray() safety, correct project ID verification, protected file guard
Routes: to FRONTEND SwarmClaw agent (localhost:3456)
Confirms: table names, column names, RLS context before wiring

/SPEC [page name] — Write 5-layer v0 prompt for this page.
Layer 1: Identity/Role (who v0 is building for)
Layer 2: Full Context (product, stack, design system, existing components)
Layer 3: Exact Task + success criteria (pixel-level spec)
Layer 4: Rules + constraints + edge cases
Layer 5: Output format + what to report back
Routes: to DESIGN SwarmClaw agent

/GATE — Run full TruthSerum gate stack on current work.
Gate 1: TypeScript compile — npx tsc --noEmit
Gate 2: JSONB safety — Array.isArray() on all Supabase JSONB columns
Gate 3: Protected files — no touch without Ro approval
Gate 4: Preview safety — no createAdminClient() in preview routes
Gate 5: Schema integrity — correct table writes
Gate 6: Claude review — PASS/FAIL per acceptance criterion
Output: Plain English on any failure. Auto-fix where possible.

/SCOPE [task] — Lock scope before any agent starts.
Defines: exact files to touch, tables to query, acceptance criteria
Defines: what is explicitly OUT of scope
Rule: No agent starts without scope lock confirmed

/BRIEF [product] — Principal PM brief on product current state.
Covers: what's built, what's blocked, what's next, what's at risk
Format: Plain English. No code. No jargon.
Products: HireWire, Amina, By Red OS, Authentic Hadith, Paradise Property Services, Fortis Compliance

/ROUTE [task] — Decide which agent owns this task.
Options: Claude director, GPT-4o vision, v0 UI, Codex builder,
FRONTEND, BACKEND, REVIEW, QA, DEPLOY, DEBUG, RobbyPA
Output: Agent name + reason + autonomy level + estimated cost

/DISPATCH [agent + task] — Write 5-layer prompt to dispatch task to SwarmClaw agent.
Format: Same 5-layer structure as /SPEC
Routes: to named agent at localhost:3456
Requires: scope lock (/SCOPE) before dispatch

/PLAIN [technical content] — Translate to plain English for Ro.
Rules: No code unless critical. No file paths unless essential.
One decision if decision needed. Two options max.
Format: What happened → Why it matters → Recommendation

/IDENTITY — Print full By Red LLC system identity.
Covers: Who Ro is, all 6 businesses, team, delegation map, technical rules

/COST — Check current AI spend across all providers.
Checks: Daily budget vs actual spend per agent
Sources: SwarmClaw War Room (localhost:3456/war-room)
Alert: If any agent >80% of daily budget

/PROTECT — Audit protected files across active repos.
Files: supabase/migrations/*, lib/auth*, app/api/auth/*,
app/api/billing*, lib/stripe*, lib/truthserum*, lib/claim-safety*
Confirms: No agent has touched them this session

/SHIP [product/feature] — Full pre-deployment checklist.
Checks: TypeScript clean, build passes, all AC verified, REVIEW PASS,
QA PASS, mobile 375px, no console.log, correct branch,
PR created with: what changed, how to verify, risk level
Gates: All must pass before production deployment
