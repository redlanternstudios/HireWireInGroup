# HireWire — Audit Protocol v1.0 Implementation

## Start Here

You've been given a complete breakdown of what needs to be built to make HireWire formally Protocol-compliant.

### What You Have

**5 implementation documents in this folder:**

1. **START-HERE.md** ← You are here
2. **PROTOCOL-QUICK-REFERENCE.txt** - Checklist (use this daily)
3. **AUDIT-PROTOCOL-COMPLIANCE-MAP.md** - Deep implementation guide (55-60 hrs)
4. **PROTOCOL-IMPLEMENTATION-GUIDE.md** - Project plan & sequence
5. **The_Audit_Protocol_v1.pdf** - Original protocol specification

### TL;DR

**Current state:** HireWire is 99% built but 40% Protocol-compliant

**Missing formalization:**
- Atomic I/O contracts (175 interaction specs)
- State machines (formal diagrams)
- Trap state guards (prevent user lockup)
- Failure recovery (graceful error handling)
- Observability (correlation IDs, logging)
- Four audits (gap detection)
- Ship gate (launch verification)
- Decision log (architectural choices)

**Total effort:** 55-60 hours (parallelizable)

---

## Priority Sequence for You

### P0: Blocking Ship (17-21 hours) — Do first

1. **Section 8: Atomic I/O Registry (8-10 hrs)** ⭐ MOST IMPORTANT
   - Document all 175 user interactions formally
   - Read: AUDIT-PROTOCOL-COMPLIANCE-MAP.md § Section 8
   - Build: `lib/contracts/atomic-i-o-registry.ts`
   - This is the heart — everything else depends on this

2. **Section 17: Ship Gate (3 hrs)**
   - Pre-launch verification checklist
   - Read: AUDIT-PROTOCOL-COMPLIANCE-MAP.md § Section 17
   - Build: `/admin/ship-gate` page

3. **Four Audits (6-8 hrs)**
   - Use Section 8 to run audits
   - Find gaps automatically
   - Read: AUDIT-PROTOCOL-COMPLIANCE-MAP.md § Four Audits

### P1: Week 1 After P0 (18-19 hours)

- Section 5: State Machines (2-3 hrs)
- Section 16: Trap State Guards (4 hrs) ⭐ CRITICAL
- Section 15: Failure & Recovery (5 hrs)
- Section 9: Trigger Registry (4 hrs)
- Section 10: Hook/Cascade Registry (3 hrs)

### P2: Week 2 (12 hours)

- Section 11: Notifications (4 hrs)
- Section 14: Observability (4 hrs)
- Section 13: Controls (2 hrs)
- Section 7: Exit Points (2 hrs)

### P3: Later (1 hour)

- Section 18: Decision Log (1 hr)

---

## How to Use This

### In Codex/Claude:

**Step 1:** Open PROTOCOL-QUICK-REFERENCE.txt
- Gets you oriented in 5 minutes
- See what each section needs
- Check off as you go

**Step 2:** Deep dive on your section
- Open AUDIT-PROTOCOL-COMPLIANCE-MAP.md
- Find § Section X
- See code examples + exact files to create

**Step 3:** Build it
- Create files in your project
- Copy examples
- Write tests

**Step 4:** Move to next section
- Use PROTOCOL-IMPLEMENTATION-GUIDE.md for sequence

---

## Key Concepts

### Atomic I/O Contract

Every user interaction gets a formal spec:

```
User Action:     "Click 'Add Job' and paste URL"
API Called:      POST /api/jobs/analyze
Sends:           { url: string }
Returns:         { job_id, title, company, requirements[] }
DB Changes:      INSERT jobs, INSERT job_analyses
User Sees:       Toast "Job added" → Redirect to /jobs/[id]
Can Fail:        Invalid URL, timeout, duplicate
Recovery:        Show error, user re-enters
```

You need 175 of these (one per interaction).

### Trap States

States where user enters but CAN'T EXIT.

Examples in HireWire:
- Job stuck in "generating" (API crashes)
- Evidence stuck in "needs_judgment" (no way to confirm)
- Session timeout without warning

Your job: Find them, add timeout guards.

### The Four Audits

1. **Orphan audit:** Unused components/endpoints/tables?
2. **Blank-cell audit:** Incomplete specifications?
3. **Trap-state audit:** Users stuck anywhere?
4. **Fake-complete audit:** Features actually work?

Run these after Section 8.

---

## Critical Success Factors

✅ **Don't skip Section 8** - Foundation for everything
✅ **Run audits early** - Finds gaps automatically
✅ **Prioritize trap states** - Users stuck = system fails
✅ **Test everything** - No tests = incomplete
✅ **Document decisions** - Why is it this way?

---

## Questions?

- **"What do I build first?"** → Section 8 (Atomic I/O)
- **"How long will this take?"** → 55-60 hours total, parallelizable
- **"What if I find gaps?"** → Document them, run audits
- **"I'm stuck on Section X"** → See AUDIT-PROTOCOL-COMPLIANCE-MAP.md § Section X
- **"Do I really need to do all of this?"** → Yes. This makes it production-ready.

---

## Files in This Folder

| File | Purpose | Read Time |
|---|---|---|
| START-HERE.md | This file — orientation | 5 min |
| PROTOCOL-QUICK-REFERENCE.txt | Daily checklist | 10 min |
| AUDIT-PROTOCOL-COMPLIANCE-MAP.md | Implementation guide (deep) | 30 min/section |
| PROTOCOL-IMPLEMENTATION-GUIDE.md | Project plan & sequence | 15 min |
| The_Audit_Protocol_v1.pdf | Original specification | 30 min |

---

## Next Actions

1. ☐ Read: PROTOCOL-QUICK-REFERENCE.txt (10 min)
2. ☐ Read: AUDIT-PROTOCOL-COMPLIANCE-MAP.md § Section 8 (30 min)
3. ☐ Start: Building Atomic I/O Registry (8-10 hrs)
4. ☐ Complete: Section 8 before moving to others

Then follow PROTOCOL-IMPLEMENTATION-GUIDE.md for sequence.

---

## Status

**Analysis:** ✅ Complete  
**Documentation:** ✅ Complete  
**Your move:** Start Section 8

Go build it.
