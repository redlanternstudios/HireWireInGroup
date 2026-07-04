# robby-mode-classifier.md — Robby PA Mode Classification Logic
# By Red LLC · RedLantern Studios · Last updated: 2026-06-06

> Robby PA runs this before routing any task.
> Mode is selected first. Squad is selected second. Agents activate third.
> No mode = no execution.

---

## CLASSIFICATION SEQUENCE

Run in order. First match wins.

**Step 1 — Check for risk triggers (override everything):**

| Signal in request | Force mode | Force squad | Approval |
|---|---|---|---|
| login / auth / session / user data / RLS | SECURITY | Security Squad | Rory required before Deploy |
| production / down / user-blocking / incident | INCIDENT | Bug Squad | Rory notified immediately |
| payment / billing / stripe / charge | SECURITY | Security Squad | Rory required |
| client / deliverable / external / send to | CLIENT | Launch Squad | Robby review before ship |
| irreversible / delete / drop / migrate production | HIGH-RISK | Security Squad | Rory required |

**Step 2 — Classify by task signal:**

| Request signal | Mode | Squad | Receipt depth |
|---|---|---|---|
| Quick wording, naming, small feedback, 1 opinion | QUICK | None — 1 specialist | None |
| New feature, user story, new screen, new route | PLAYBOOK | Feature Squad | Standard |
| Bug, error, broken, regression, unexpected behavior | PLAYBOOK | Bug Squad | Standard |
| Visual design, UX, layout, feel, clarity | PLAYBOOK | Feature Squad (Design lead) | Light |
| Copy, marketing, brand, pitch, landing page | PLAYBOOK | Brand Squad | Standard |
| Production release, client handoff, milestone | SPRINT | Launch Squad | Full |
| Multi-week build, multiple features, MVP | SPRINT | Full squad | Full |
| Diff review, PR check, pre-merge | REVIEW-ONLY | None — /review only | Light |
| Research, exploration, competitive analysis | RESEARCH | None — 1-2 specialists | Light |
| Architecture, tech decision, ADR | STRATEGY | Architect + PM Proxy | Standard |

**Step 3 — Mixed request check:**

If the request contains 2 or more distinct task signals, split before routing.

```
SPLIT REQUIRED:
Track A: [first task] → [mode] → [squad]
Track B: [second task] → [mode] → [squad]
Priority: Track A first because [reason]
```

Never merge two tasks into one workflow. Split is always safer than blend.

---

## CLASSIFICATION OUTPUT FORMAT

Robby must output this before activating any squad:

```
ROBBY CLASSIFICATION

Mode:           [quick / playbook / sprint / incident / client / review-only / research / strategy]
Task Type:      [feature / bug / design / copy / architecture / data / security / deploy / docs / marketing]
Risk Level:     [L0 / L1 / L2 / L3 / L4]
Primary Owner:  [one agent — the one accountable right now]
Min Squad:      [squad name or "none"]
Receipt Depth:  [none / light / standard / full / incident]
Human Approval: [none / before ship / before execution]
Next Step:      [PM Proxy / /scope / /review / BreakFix / direct answer]
Confidence:     [high / medium — if medium, state what's ambiguous]
```

---

## MODE DEFINITIONS

| Mode | When to use | PM Proxy | Scope lock | Max agents |
|---|---|---|---|---|
| QUICK | Wording, 1 opinion, tiny clarification | No | No | 1 |
| PLAYBOOK | Standard feature, bug, design, copy | Yes | Yes | 5 |
| SPRINT | Multi-step, multi-day, full build | Yes (deep) | Yes | Full squad |
| INCIDENT | Production broken, user-blocking, deploy failure | No (skip to BreakFix) | Yes | 6 |
| CLIENT | External deliverable, client-facing output | Yes (polished) | Yes | 5 |
| REVIEW-ONLY | Diff, PR, existing artifact to check | No | No | 1 (/review) |
| RESEARCH | Spike, exploration, competitive, discovery | No | No | 1-2 |
| STRATEGY | Architecture, product direction, ADR | PM Proxy | No | 3 max |

---

## RISK LEVEL DEFINITIONS

| Level | Description | Approval |
|---|---|---|
| L0 | Harmless — internal notes, wording, no user-facing change | None |
| L1 | Internal, reversible — UI, copy, docs, style | None |
| L2 | Product behavior change — feature, flow, component | Robby logs |
| L3 | Auth / data / payment / security / client-facing / RLS | Rory approval before ship |
| L4 | Production incident, irreversible decision, user data at risk | Rory approval before execution |

---

## AGENT ACTIVATION BUDGET

Robby must not activate more agents than the mode allows.

| Mode | Budget |
|---|---|
| QUICK | 1 |
| PLAYBOOK | 3–5 |
| SPRINT | Full squad |
| INCIDENT | BreakFix + 4 max (expand only if root cause requires) |
| CLIENT | 4–5 |
| REVIEW-ONLY | 1 |
| RESEARCH | 1–2 |
| STRATEGY | 2–3 |

If a task needs more agents than the budget, the task is too large. Split it.

---

## ROBBY'S SELF-CHECK BEFORE ROUTING

Before activating any agent, Robby must confirm:

```
[ ] Mode is selected
[ ] Risk level is assigned
[ ] Primary owner is named (one only)
[ ] Agent budget is within mode limit
[ ] If L3+: human approval path is defined
[ ] If SPLIT required: tasks are separated
[ ] If QUICK: PM Proxy is NOT activated
[ ] If PLAYBOOK+: PM Proxy runs first
```

No routing without all boxes checked.
