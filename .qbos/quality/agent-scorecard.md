# agent-scorecard.md — QuietBuild Agent Quality Standards
# By Red LLC · RedLantern Studios · Last updated: 2026-06-06

> Every agent has a quality bar. "Looks good" is not a quality bar.
> This file defines what good output looks like for each role.
> Use this to evaluate agent output before accepting it.

---

## HOW TO USE THIS

When an agent produces output, check it against its scorecard before passing to the next layer.
If output fails a REQUIRED criterion → send back. Do not advance.
If output fails a PREFERRED criterion → flag in handoff, advance with note.

---

## ROBBY PA — MODE CLASSIFIER

**REQUIRED:**
- [ ] Mode is named (not implied)
- [ ] Risk level is assigned (L0–L4)
- [ ] Primary owner is one agent (not "the team")
- [ ] Agent budget is within mode limit
- [ ] L3+ tasks have human approval path defined

**PREFERRED:**
- [ ] Confidence level stated (high / medium)
- [ ] If medium confidence, ambiguity is named
- [ ] Mixed requests are split into separate tracks

**Failure signal:** Robby activates 6 agents for a wording change.

---

## PM PROXY

**REQUIRED:**
- [ ] PROBLEM is one sentence — specific, not "improve UX"
- [ ] USER is named specifically — not "users" or "admins"
- [ ] SCOPE is bounded — a builder could start from this
- [ ] OUT OF SCOPE is explicit — at least 1 item stated
- [ ] CRITERIA are testable and binary (pass/fail, not "should feel good")
- [ ] RISK names at least one specific expansion risk

**PREFERRED:**
- [ ] PRIORITY includes a reason, not just P0/P1/P2
- [ ] If interpretation was required, it is labeled and confirmed
- [ ] Brief depth matches the mode (3 bullets for Quick, deep for Sprint)

**Failure signal:** PM Brief has no OUT OF SCOPE. Brief has acceptance criteria like "the feature works correctly."

---

## ARCHITECT (Claude Code)

**REQUIRED:**
- [ ] Files to touch are named before writing any code
- [ ] Files NOT to touch are stated explicitly
- [ ] VERIFIED / ASSUMED / RISK labels used on all state claims
- [ ] Done state is observable — not "should work"
- [ ] Forbidden patterns from BUILD_CONSTITUTION.md were checked

**PREFERRED:**
- [ ] Downstream impact assessed (what else could this affect)
- [ ] Schema or auth implications surfaced if present
- [ ] Verification command provided

**Failure signal:** Architect says "I'll touch the dashboard component and a few related files."

---

## BUILDER (Codex)

**REQUIRED:**
- [ ] Only files in the scope lock were touched
- [ ] Changed files are listed (not assumed from context)
- [ ] Scope deviations reported — even if minor (none = explicitly stated)
- [ ] Assumptions labeled as ASSUMED
- [ ] Verification command run and result included
- [ ] Done state is stated as confirmed or failed

**PREFERRED:**
- [ ] Risks introduced are named
- [ ] Anything spotted but not touched is flagged (not fixed silently)

**Failure signal:** Builder says "done" with no verification result. Builder modified a file not in scope without noting it.

---

## BREAKFIX

**REQUIRED:**
- [ ] SYMPTOM and ROOT CAUSE are separated
- [ ] ROOT CAUSE labeled as VERIFIED or LIKELY or ASSUMED (not asserted as fact)
- [ ] Patch plan names specific files and changes
- [ ] Verification steps state exactly how to confirm the fix worked
- [ ] Rollback plan exists for L2+ bugs

**PREFERRED:**
- [ ] Regression risk assessed ("what else could this break")
- [ ] Root cause classified: code bug / config / data / external dependency

**Failure signal:** BreakFix says "the button isn't working because of a state issue." No file. No line. No verification steps.

---

## /review (QA Gate)

**REQUIRED:**
- [ ] Verdict is PASS, FLAG, or REJECT — not "looks good"
- [ ] Each acceptance criterion from PM Brief is addressed (met / partial / failed)
- [ ] Scope alignment checked — were any files touched outside scope?
- [ ] Tenant/user safety check completed
- [ ] FLAGS are specific: issue + file + line when possible
- [ ] Ship recommendation stated

**PREFERRED:**
- [ ] Surfaces/devices tested are named (desktop, mobile, etc.)
- [ ] Follow-up tasks created for deferred items
- [ ] Issue severity classified (blocker / major / minor)

**Failure signal:** Review says "PASS — everything looks good." No criteria checked. No scope alignment.

---

## /closeout (Docs)

**REQUIRED:**
- [ ] Review verdict is included
- [ ] Memory status is labeled (Active / Partial / Flagged / Deprecated)
- [ ] Follow-up tasks are named (or explicitly "none")
- [ ] Next action is one specific move — not a list of options
- [ ] Decisions are stated with reasons, not just outcomes

**PREFERRED:**
- [ ] Commit message provided
- [ ] Blockers found this session are named
- [ ] Assumptions that need verification are called out

**Failure signal:** Closeout says "session complete" with memory status `Active` while review had a FLAG.

---

## UNIVERSAL FAILURE SIGNALS (any agent)

These fail any agent regardless of role:

- Output has no done state
- Output says "done" without evidence
- Output uses "looks good," "should work," "seems fine"
- Output has assumptions buried in prose (not labeled ASSUMED)
- Output expands scope without a BLOCKED escalation
- Output conflicts with BUILD_CONSTITUTION.md without flagging it

---

## QUALITY LEVELS

Use these when recording agent performance in memory:

| Level | Meaning |
|---|---|
| Strong | Met all REQUIRED + most PREFERRED. No rework needed. |
| Acceptable | Met all REQUIRED. Some PREFERRED missed. Minor flag noted. |
| Needs improvement | Failed 1–2 REQUIRED. Rework required. |
| Poor | Failed 3+ REQUIRED. Full redo. Pattern noted for agent tuning. |
