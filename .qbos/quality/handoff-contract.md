# handoff-contract.md — Universal Agent Handoff Format
# By Red LLC · RedLantern Studios · Last updated: 2026-06-06

> Every meaningful handoff between agents uses this format.
> No handoff format = no handoff. The next agent does not start on a vibe.

---

## WHEN TO USE THIS

Required at every:
- Agent-to-agent task transfer
- Layer boundary crossing (e.g., PM Proxy → Architect, Builder → /review)
- Blocker escalation
- Completion notification to next owner

Not required for:
- Quick Answer mode (no handoffs — direct answer only)
- Internal reasoning steps within a single agent's task

---

## HANDOFF FORMAT

```
HANDOFF

From:          [agent name]
To:            [agent name]
Mode:          [quick / playbook / sprint / incident / client]
Task Type:     [feature / bug / design / security / etc.]
Risk Level:    [L0 / L1 / L2 / L3 / L4]

Status:        [not started / in progress / blocked / ready for review / ready to ship]

Summary:       [what was done — one sentence per point, no fluff]

Evidence:      [files changed, artifacts produced, PRs, design links, test results]

Decisions Made:
- [decision + reason]

Assumptions Made:
- [what was inferred — label as ASSUMED]

Risks:
- [what could break or needs attention]

Open Items:
- [unresolved questions or deferred work]

Ask of Next Agent:
  [specific, actionable — what you need the next agent to do]

Definition of Done:
  [what must be true before this task can close]

Human Approval Needed: [yes / no — if yes, before which action]
```

---

## BLOCKER FORMAT

When an agent cannot proceed without a decision:

```
BLOCKED

Agent:         [who is blocked]
Blocked by:    [file / decision / missing context / permission]

Options:
  A: [description] — [tradeoff]
  B: [description] — [tradeoff]

Lean:          [agent's read — labeled as lean, not decision]
Risk if wrong: [what breaks]

Waiting for:   [Rory / Robby / Architect / specific agent]
```

---

## ESCALATION FORMAT

When an agent finds something outside its lane that needs attention:

```
ESCALATION

From:     [agent name]
Concern:  [what was found — specific]
Lane:     [this is outside my role — belongs to: X]
Evidence: [what was observed]
Urgency:  [blocking / should review / low priority]
Recommended: [suggested next step — labeled as recommendation, not decision]
```

---

## COMPLETION FORMAT (final handoff to /closeout)

```
READY FOR CLOSEOUT

Work Completed:   [what was built or changed]
Files Changed:    [exact paths]
Scope Deviations: [any — even minor. none = explicitly say none.]
Review Verdict:   [PASS / FLAG / REJECT]
Open Flags:       [from review — or none]
Memory Updates:   [what should be written to project memory]
Next Action:      [recommended follow-up or none]
```

---

## HANDOFF QUALITY RULES

1. Every handoff names one next owner — not "the team"
2. Decisions are stated, not implied
3. Assumptions are labeled ASSUMED — never buried in a summary
4. Risks are specific — not "it might break something"
5. Ask of next agent is one specific action, not a list of suggestions
6. No handoff ends with "let me know if you need anything" — state what you need or say nothing

---

## LAYER-BY-LAYER HANDOFF MAP

| From | To | Key content |
|---|---|---|
| Robby PA | PM Proxy | Classification, raw request, project context |
| PM Proxy | Architect | PM Brief, scope constraints, acceptance criteria |
| Architect | Builder (/scope) | Scope lock with files, constraints, done state |
| Builder | /review | Execution output with changed files, deviations, assumptions |
| /review | /closeout | Verdict, flags, follow-ups |
| /review | Builder (reject) | Specific failures + required fixes |
| /closeout | Robby PA | Receipt, memory updates, next action |
| BreakFix | Builder | Root cause, patch plan, risk, rollback |
| Builder | Deploy | Verification clean, scope deviations none, QA pass |
