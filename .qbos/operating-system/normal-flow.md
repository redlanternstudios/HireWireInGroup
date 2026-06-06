# normal-flow.md — QuietBuild OS Production Control Loop
# By Red LLC · RedLantern Studios · Last updated: 2026-06-06

> This is not a checklist. It is a control loop.
> Each layer protects the one after it.
> No layer can be skipped. Each has a gate.

---

## THE SPINE

```
Intent Capture
  → Mode + Risk Classification
    → Product Translation (PM Proxy)
      → Execution Boundary Lock (/scope)
        → Agent/Squad Execution
          → Quality Arbitration (/review)
            → Closeout + Memory
              → Robby recommends next move
```

---

## LAYER 1 — INTENT CAPTURE

**What it protects against:** Wrong problem

| Field | Value |
|---|---|
| Owner | Rory (source) → Robby PA (receiver) |
| Input | Raw request, urgency, project signal, attachments |
| Output | Intent packet: raw text preserved, project detected, missing context flagged |
| Quality gate | Raw request preserved + enough context to classify |

**Key rule:** Do not translate the request. Preserve it. Translation happens in Layer 3.

**Failure mode:** System turns "this feels weak" into a UI improvement task. Real signal was: operating model isn't rigorous enough.

**Recovery:** Robby proposes a classification and asks for confirmation before routing.
```
I'm reading this as [X], not [Y]. Correct?
```

---

## LAYER 2 — MODE + RISK CLASSIFICATION

**What it protects against:** Wrong workflow

| Field | Value |
|---|---|
| Owner | Robby PA (primary), Runtime (support), Rory (fallback if ambiguous) |
| Input | Intent packet, project memory, risk policy, open work |
| Output | Mode, task type, risk level, primary owner, min squad, receipt depth, approval requirement |
| Quality gate | All 5 fields populated before any work proceeds |

**Required output fields:**
```
Mode:          [quick / playbook / sprint / incident / client / review-only / strategy]
Task Type:     [feature / bug / design / copy / architecture / data / security / deploy / docs / marketing]
Risk Level:    [L0 / L1 / L2 / L3 / L4]
Primary Owner: [one agent]
Min Squad:     [named squad or "none"]
Receipt Depth: [none / light / standard / full / incident]
Human Approval:[yes / no — if yes, before which step]
```

**Risk levels:**
- L0: Harmless (wording, internal notes)
- L1: Internal, reversible (UI, copy, docs)
- L2: Product behavior change (feature, flow, component)
- L3: Auth / data / payment / security / client-facing
- L4: Production incident or irreversible decision

**Risk triggers that override mode:**
- `login / auth / session / user data` mentioned → L3 minimum, Security Squad
- `production / user-blocking / down` mentioned → Incident mode
- `client / deliverable / external` mentioned → Client mode
- `payment / billing / stripe` mentioned → L3 minimum, Rory approval

**Failure mode:** Login redirect issue routed to Frontend only. Root cause is middleware/auth state.

**Recovery:** Risk keywords in request trigger automatic mode escalation, regardless of how the request was phrased.

---

## LAYER 3 — PRODUCT TRANSLATION (PM PROXY)

**What it protects against:** Wrong product

| Field | Value |
|---|---|
| Owner | PM Proxy (primary), Robby PA (support), Rory (approver for material decisions) |
| Input | Classification, raw request, project memory, business context, prior decisions |
| Output | PM Brief (see format below) |
| Quality gate | Out-of-scope is explicit. Acceptance criteria are testable. |

**PM Brief format:**
```
PM BRIEF — [Feature / Fix / Change / Spike]

PROBLEM:      [one sentence]
USER:         [specific — not "users"]
SCOPE:        [bounded, specific]
OUT OF SCOPE: [explicit exclusions]
CRITERIA:     [numbered, testable, binary — pass or fail]
PRIORITY:     [P0 / P1 / P2 + reason]
RISK:         [what could expand scope or break]
HAND TO:      Architect → /scope
```

**Brief depth by mode:**
- Quick: 3 bullets max
- Normal: standard brief
- Sprint / Client: deep brief with tradeoffs and dependencies

**Failure mode:** "Make dashboard cleaner" becomes full dashboard IA redesign.
**Recovery:** PM Proxy states its interpretation, asks for confirmation.
```
Interpretation: "cleaner" = reduce visible agents, surface active squad only.
Is that correct?
```

---

## LAYER 4 — EXECUTION BOUNDARY LOCK (/scope)

**What it protects against:** Wrong files, scope sprawl

| Field | Value |
|---|---|
| Owner | /scope command, GapArchitect (support) |
| Input | PM Brief, repo map, architecture context, risk policy |
| Output | Scope lock (see format below) |
| Quality gate | Files allowed, files forbidden, done state, escalation rule all present |

**Scope lock format:**
```
SCOPE LOCK

Mode:           
Task Type:      
Risk Level:     

Files Allowed:   [exact paths]
Files Forbidden: [explicit — even if adjacent or tempting]
Commands Allowed:
Do Not Change:   [auth / billing / middleware / schema — if applicable]
Done State:      [observable behavior, not "should work"]
Escalation Rule: [if Builder needs to touch a file not listed → BLOCKED format required]
```

**Failure mode:** Scope says "touch dashboard page." Builder modifies auth middleware because redirect looked related. UI task becomes auth regression.

**Recovery:** Any file access outside scope lock triggers mandatory BLOCKED format.
```
BLOCKED:
Need to touch: [file]
Reason: [why it's required]
Risk if touched: [what could break]
Risk if not touched: [what stays broken]
Options: [2-3 approaches]
Waiting for: Rory / Architect
```

---

## LAYER 5 — AGENT/SQUAD EXECUTION

**What it protects against:** Role chaos, agent overreach

| Field | Value |
|---|---|
| Owner | Active squad lead (primary), Runtime (coordinator), Robby PA (conductor) |
| Input | Scope lock, PM brief, context bundle, permissions |
| Output | Implementation, changed-file list, scope deviation report, ready-for-review handoff |
| Quality gate | Output artifact + deviation report + test note before passing to review |

**Execution output format (required):**
```
EXECUTION OUTPUT

Changed Files:     [exact paths + what changed]
Scope Deviations:  [anything touched outside lock — even if minor]
Assumptions Made:  [what was inferred, not confirmed]
Tests Run:         [verification commands + results]
Risks Introduced:  [what this change could break]
Next Owner:        [/review]
```

**Agents communicate only at:** handoff, blocker, risk, contradiction, approval needed, completion.
No agent speaks without purpose.

**Failure mode:** Builder silently modifies a data query outside scope. Review misses it. Data exposure risk surfaces later.

**Recovery:** Scope deviations are non-optional in execution output. Silent expansion = automatic REJECT in review.

---

## LAYER 6 — QUALITY ARBITRATION (/review)

**What it protects against:** Bad output, regressions, unchecked assumptions

| Field | Value |
|---|---|
| Owner | /review command, QA (support), Security/Data for L3+ |
| Input | PM brief, scope lock, execution output, changed files, acceptance criteria |
| Output | Review verdict (PASS / FLAG / REJECT) |
| Quality gate | Verdict exists. Acceptance criteria were used as the judge. |

**Review verdict format:**
```
VERDICT: PASS / FLAG / REJECT

ACCEPTANCE CRITERIA: [met / partial / failed — per criterion]
SCOPE ALIGNMENT:     [in-scope / deviations found]
SAFETY CHECK:        [tenant isolation / auth / data / RLS — clean or flagged]
REGRESSION RISK:     [none / low / medium / high]

FLAGS (must fix before ship):
- [issue] at [file:line]

RISKS (review but not blocking):
- [concern]

SHIP RECOMMENDATION: [yes / internal only / no]
FOLLOW-UP TASKS:     [what was deferred, not blocked]
```

**Verdict routing:**
- PASS → closeout or deploy
- FLAG → closeout with known issue OR fix loop
- REJECT → return to execution

**Issue severity:**
- Blocker → REJECT
- Major → FLAG (must fix before public ship)
- Minor → FLAG (can ship internally)
- Follow-up → noted, not blocking

**Failure mode:** PASS given without testing mobile. Mobile broken. Ships to users.

**Recovery:** Review must state which surfaces/devices were tested. If untested, it is a FLAG.

---

## LAYER 7 — CLOSEOUT, MEMORY + LEARNING LOOP

**What it protects against:** Memory loss, fake "done," future context failure

| Field | Value |
|---|---|
| Owner | /closeout, Docs (primary), Robby PA (memory coordinator) |
| Input | All previous layer outputs — raw request through review verdict |
| Output | Closeout receipt, memory updates with status |
| Quality gate | Review verdict included. Memory status labeled. Follow-ups logged. |

**Closeout receipt format:**
```
CLOSEOUT RECEIPT

Original Request:   [preserved — not paraphrased]
Mode:              
Task Type:         
Work Completed:    [what was built/changed/decided]
Files Changed:     [exact paths]
Decisions Made:    [what was chosen + why]
Review Verdict:    [PASS / FLAG / REJECT + reason]
Risks Remaining:   [open flags or known issues]
Memory Updates:    [what was written to memory + status]
Follow-up Tasks:   [what was deferred]
Next Action:       [Robby's recommendation]
```

**Memory status labels (required on every update):**
- `Active` — current, trusted, use as-is
- `Partial` — complete for stated scope, gaps noted
- `Flagged` — known issue exists, do not treat as complete
- `Deprecated` — superseded by newer decision
- `Needs Review` — may be stale, verify before acting

**Failure mode:** Closeout says "dashboard redesign complete." Mobile FLAG remains open. Future agents treat dashboard as fully done.

**Recovery:** Closeout status must match review verdict. If review was FLAG, closeout status is `Flagged` or `Partial` — never `Active`.

---

## THE 10 SYSTEM RULES

These rules make the seven layers work. Violation of any one breaks the loop.

1. No work without mode
2. No mode without owner
3. No product work without PM Brief (except Quick Answer)
4. No build without scope lock
5. No scope expansion without BLOCKED escalation
6. No review without acceptance criteria
7. No done without closeout receipt
8. No memory without status label
9. No L3+ action without human approval
10. No agent speaks without purpose

---

## ACTIVATION BUDGET (cost + complexity control)

| Mode | Agents |
|---|---|
| Quick Answer | Robby + 1 specialist |
| Normal Playbook | Robby + PM Proxy + /scope + Builder + /review + /closeout |
| Design Playbook | Robby + PM Proxy + Design + Frontend + /review + /closeout |
| Bug | Robby + BreakFix + Builder + /review + /closeout |
| High-Risk Bug | Robby + BreakFix + Security/Data + Builder + /review + Guardian + /closeout |
| Client | Robby + PM Proxy + Brand/Docs + /review + /closeout |
| Sprint | Robby + PM Proxy + Architect + Builder + QA + Deploy + Docs |
| Incident | Robby + BreakFix + Builder + QA + Deploy + Observe + Docs |

Rule: If a task needs more than 6 agents, the task is too big. Break it.
