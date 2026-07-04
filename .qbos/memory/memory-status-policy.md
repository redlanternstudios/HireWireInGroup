# memory-status-policy.md — QuietBuild Memory Status Policy
# By Red LLC · RedLantern Studios · Last updated: 2026-06-06

> Memory without status is poison.
> Every memory write must include a status label.
> Agents must verify memory status before acting on it.

---

## STATUS LABELS (required on every memory write)

| Status | Meaning | When to use |
|---|---|---|
| `Active` | Current, verified, trusted | Decision confirmed, fully implemented, no open flags |
| `Partial` | Complete for stated scope, gaps noted | Work done but not all surfaces tested, or scope limited |
| `Flagged` | Known issue exists — do not treat as complete | Review returned FLAG, or known regression risk |
| `Deprecated` | Superseded by a newer decision | Old approach replaced — note what superseded it |
| `Needs Review` | May be stale — verify before acting | Time-sensitive facts, API states, external dependencies |

**Rule:** Closeout status must match review verdict.
- Review PASS → memory status `Active`
- Review FLAG → memory status `Flagged` or `Partial`
- Review REJECT → no memory write until fix is complete

---

## MEMORY TIERS

Each tier is stored and queried separately. Do not mix them.

| Tier | What it holds | Lifespan |
|---|---|---|
| Session memory | What happened in this session | Expires at /closeout |
| Project memory | Product state, feature status, open work | Persists until deprecated |
| Decision memory | What was decided, why, by whom | Permanent (append-only) |
| Repo memory | File locations, module structure, known patterns | Updated on refactor |
| Bug memory | Known issues, previous fixes, regressions | Updated on fix or close |
| Client memory | Client preferences, promises, deliverable history | Persists per client |
| Design memory | Brand rules, UI patterns, component inventory | Updated on design change |
| Agent memory | Agent performance notes, known failure patterns | Reviewed quarterly |

---

## MEMORY WRITE RULES

1. **Every write includes:** content, status, tier, date, source (which agent wrote it)
2. **Never overwrite without deprecating.** Mark old entry `Deprecated` before writing new one.
3. **Decisions are append-only.** Decision memory is never deleted — only superseded with a note.
4. **Stale facts need `Needs Review`.** If a memory references an external API, price, or third-party state, mark it `Needs Review` after 30 days.
5. **Memory from intent capture is not facts.** Raw user requests are captured but not stored as product truth.

---

## MEMORY READ RULES

Before any agent acts on memory:

```
[ ] Check status label — is this Active, Partial, Flagged, Deprecated, or Needs Review?
[ ] If Deprecated — do not use. Find what superseded it.
[ ] If Flagged — use with caution. Note the flag in your output.
[ ] If Needs Review — verify against current state before acting.
[ ] If Partial — note the scope limitation in your output.
[ ] If Active — use as-is.
```

Never present memory as current fact without checking status.

---

## CLOSEOUT MEMORY UPDATE FORMAT

At /closeout, the agent writes:

```
MEMORY UPDATE

Tier:     [session / project / decision / repo / bug / client / design]
Status:   [Active / Partial / Flagged / Deprecated / Needs Review]
Content:  [the fact, decision, or state being stored]
Source:   [which agent wrote this]
Date:     [YYYY-MM-DD]
Supersedes: [previous memory entry — or none]
Note:     [context for future agents reading this]
```

---

## MEMORY POISONING PREVENTION

Common failure: Closeout writes `Active` status while a FLAG exists from review.

Guardrail: If review verdict is FLAG, closeout agent is blocked from writing `Active` status.
The memory must be `Partial` (scope-limited) or `Flagged` (known issue) until fix is verified.

Common failure: Agent reads old `Active` memory about a deprecated pattern and implements it.

Guardrail: Before any implementation that references memory older than 14 days,
the Architect must verify the memory status matches current repo state.
If it doesn't, the memory must be updated before build starts.

---

## MEMORY HYGIENE SCHEDULE

| Action | Frequency |
|---|---|
| Mark session memory as expired | Every /closeout |
| Review `Needs Review` items | Weekly (or before sprint) |
| Audit `Partial` and `Flagged` items | After each related task closes |
| Deprecate resolved bug memory | After fix is verified in production |
| Agent performance notes review | Monthly |
