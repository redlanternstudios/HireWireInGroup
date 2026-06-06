# squads.md — QuietBuild Agent Squads
# By Red LLC · QBos Conductor Layer · Last updated: 2026-06-06

> Squads are not all active at once.
> Robby PA selects the squad. Runtime activates agents in sequence.
> One primary owner per phase. Supporting agents contribute only when called.

---

## ACTIVATION RULE

Every task must have:
1. A MODE (Robby's mode classifier)
2. A SQUAD (from this file)
3. A PRIMARY OWNER (one agent accountable right now)

No mode = no squad. No squad = no execution.

---

## FEATURE SQUAD

**Trigger:** New functionality, user story, new route, new component

**Sequence:**
```
PM Proxy   → /pm-proxy → PM Brief
Architect  → /scope → system impact check
Codex      → build
QA         → /review → PASS / FLAG / REJECT
Deploy     → release checklist
Docs       → feature receipt
```

**Primary owner by phase:** PM Proxy → Architect → Codex → QA → Deploy → Docs

**Done when:** QA passes + Deploy confirms + receipt written

---

## BUG SQUAD

**Trigger:** Broken behavior, error, regression, divergence from expected

**Sequence:**
```
BreakFix   → diagnose → root cause (not just symptom)
Architect  → confirm scope of fix
Codex      → patch
QA         → verify fix + regression check
Deploy     → ship
Observe    → monitor post-deploy
Docs       → incident receipt
```

**Primary owner by phase:** BreakFix → Architect → Codex → QA → Deploy → Observe

**Done when:** Root cause confirmed + fix verified + no regression + receipt written

**BreakFix must output before Codex starts:**
```
SYMPTOM:    [what the user sees]
ROOT CAUSE: [VERIFIED / ASSUMED — which]
PATCH PLAN: [specific files + changes]
RISK:       [what else could break]
VERIFY:     [test steps to confirm fix]
ROLLBACK:   [how to undo if wrong]
```

---

## LAUNCH SQUAD

**Trigger:** Production release, client handoff, milestone ship

**Sequence:**
```
PM Proxy   → confirm scope complete, acceptance criteria met
Architect  → pre-deploy system check
QA         → full regression pass
Deploy     → release checklist
Docs       → release receipt + client summary
Observe    → post-launch monitoring active
```

**Primary owner by phase:** QA (gate) → Deploy (ship) → Observe (monitor) → Docs (memory)

**Done when:** Full QA pass + deploy confirmed + monitoring active + receipt written

---

## SECURITY SQUAD

**Trigger:** Auth changes, RLS changes, permissions, user data, tenant isolation, secrets

**Sequence:**
```
Architect        → scope review (owns this squad)
supabase-guardian → RLS + schema check (read-only)
Codex            → implement under confirmed constraints only
QA               → security-specific test pass
Deploy           → Rory approval required before ship
```

**Primary owner:** Architect owns every phase. Codex executes only.

**Hard rules:**
- Codex never solo on Security Squad tasks
- Deploy requires explicit Rory approval — no exceptions
- supabase-guardian must run before any DB code is written
- If supabase-guardian finds a risk, escalate to Rory before proceeding

---

## BRAND SQUAD

**Trigger:** Copy, landing page, pitch deck, marketing asset, client deliverable, positioning

**Sequence:**
```
PM Proxy  → brief + audience + goal + channel
Brand     → positioning + voice + headline options
Growth    → offer + conversion angle (if revenue-facing)
Docs      → final polished deliverable
```

**Primary owner by phase:** PM Proxy (brief) → Brand (voice) → Growth (conversion) → Docs (output)

**Done when:** Deliverable complete + reviewed against brand rules + receipt written

---

## SQUAD SELECTION (Robby PA reference)

| Request type | Squad |
|---|---|
| New feature, user story, new screen | Feature Squad |
| Bug, error, broken behavior | Bug Squad |
| Production ship, client delivery, milestone | Launch Squad |
| Auth, RLS, permissions, tenant data | Security Squad |
| Copy, marketing, brand, pitch, client docs | Brand Squad |
| Mixed request | Split tasks first, then assign squads |

---

## ANTI-SPRAWL RULE

If a squad needs more than 5 agents to complete a task, the task is too big.
Break it before activating a squad.

If two squads seem right, the request has two problems. Split it.
