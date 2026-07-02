# HireWire — Audit Protocol v1.0 Implementation Guide

## Start Here

You have three documents to guide Protocol implementation:

1. **PROTOCOL-QUICK-REFERENCE.txt** (this folder)
   - Quick checklist format
   - 5-minute overview
   - Track progress

2. **AUDIT-PROTOCOL-COMPLIANCE-MAP.md** (this folder)
   - Deep dive into all 18 sections
   - Code examples for each section
   - Implementation details

3. **PROTOCOL-IMPLEMENTATION-GUIDE.md** (this file)
   - How to work through The Protocol systematically
   - What to build first
   - How to parallelize work

---

## The Challenge

HireWire is **99% built** but **40% formalized** (per The Protocol).

The app works, but it's not **PROVEN** to work without ambiguity.

The Protocol asks: "Can you prove every interaction works correctly?"

### What That Means

**Current State:**
- Code exists (✅)
- Logic works (✅)
- Features function (✅)
- BUT: Interactions not formally documented (❌)
- BUT: Edge cases not formally tracked (❌)
- BUT: Trap states not formally guarded (❌)
- BUT: Failure modes not formally mapped (❌)

**Goal State:**
- Every interaction has an Atomic I/O contract (✅)
- Every edge case documented (✅)
- No trap states possible (✅)
- All failures have recovery paths (✅)
- System is formally verified (✅)

---

## High-Level Approach

### Phase 1: Foundation (Sections 1-4) — ✅ DONE
- Component map
- Route map
- API inventory
- Data model

*Already completed. Reference: COMPREHENSIVE-AUDIT-RE-DISCOVERY.md*

### Phase 2: Formalization (Sections 5-10) — BUILD NOW
- State machines (what changes?)
- Entry/exit points (how do users get in/out?)
- **Atomic I/O contracts (what happens at each interaction?)**
- Trigger registry (what causes actions?)
- Hook/cascade registry (what chains together?)

**Output:** Formal documentation proving all paths are defined

### Phase 3: Safeguards (Sections 11-16) — BUILD AFTER PHASE 2
- Notifications (what does user see?)
- Control gates (what prevents bad states?)
- Kill switches (how do we control it?)
- Observability (can we trace what happened?)
- Failure recovery (what when things break?)
- Trap state guards (users don't get stuck?)

**Output:** Defensive systems preventing bugs

### Phase 4: Verification (Sections 17-18 + Audits) — BUILD AFTER PHASE 3
- Ship gate checklist (is it ready?)
- Decision log (why is it this way?)
- Four audits (do we have gaps?)

**Output:** Proof that system is ready for production

---

## Recommended Build Sequence

### Week 1: Critical Path (P0)

**Day 1-2: Section 8 (Atomic I/O Registry) — 8-10 hours**

This is the heart. Every button, form submit, API call gets a formal contract.

```
What user does → What API is called → What data sent/received → What changes in DB → What user sees → What can go wrong → How to fix
```

**Deliverable:** Complete Atomic I/O table with 175 contracts (or prioritize 30 critical ones)

**Output file:** `lib/contracts/atomic-i-o-registry.ts`

**Example:**
```
Interaction: Click "Add Job"
  User input: Pastes URL
  API called: POST /api/jobs/analyze
  Request: { url: string }
  Response: { job_id, title, company, requirements[] }
  DB changes: INSERT jobs, INSERT job_analyses
  User sees: Toast "Job added" + redirect to /jobs/[id]
  Can fail: Invalid URL, parse error, duplicate
  Recovery: Show error, user re-enters
```

**Day 3: Section 17 (Ship Gate) — 3 hours**

Create pre-launch checklist + verification system.

**Deliverable:** Ship gate checklist UI + test suite

**Output file:** `/admin/ship-gate` page, `lib/ship-gate/checklist.ts`

**Day 4-5: The Four Audits — 6-8 hours**

Use Section 8 (Atomic I/O) to run audits.

1. **Orphan Audit:** Find components/endpoints not used
2. **Blank-Cell Audit:** Find incomplete contracts
3. **Trap-State Audit:** Find states with no exit
4. **Fake-Complete Audit:** Test features actually work

**Deliverable:** Audit reports + gap list

### Week 2: Formalization (P1)

**Day 1-2: Section 5 (State Machines) — 2-3 hours**

Formalize all state transitions.

**Deliverable:** State machine definitions for 4 entities

**Output files:** `lib/state-machines/*.ts`

**Day 2-3: Section 16 (Trap States) — 4 hours**

Prevent users from getting stuck.

**Deliverable:** Timeout guards + escape hatches

**Output files:** `lib/guards/*.ts`

**Day 4-5: Section 15 (Failure/Recovery) — 5 hours**

Handle things breaking gracefully.

**Deliverable:** Retry logic + dead-letter queue + recovery paths

**Output files:** `lib/resilience/*.ts`

### Week 3: Support Systems (P2)

**Section 9-10 (Triggers + Hooks):** 4+3 hours
**Section 14 (Observability):** 4 hours
**Section 11 (Notifications):** 4 hours

### Week 4: Polish (P3)

**Section 13 (Controls):** 2 hours
**Section 7 (Exit Points):** 2 hours
**Section 18 (Decision Log):** 1 hour

---

## How to Build Each Section

### Template: Building Section X

1. **Read the details** in AUDIT-PROTOCOL-COMPLIANCE-MAP.md § Section X

2. **Create the files**
   ```bash
   mkdir -p lib/X/
   touch lib/X/X.ts
   touch lib/X/X.test.ts
   ```

3. **Define the interface/type**
   ```ts
   export interface X {
     id: string
     name: string
     // ... other fields
   }
   ```

4. **Implement the logic**
   ```ts
   export function createX(...): X {
     // implementation
   }
   ```

5. **Add tests**
   ```ts
   describe('X', () => {
     it('should do Y', () => {
       // test
     })
   })
   ```

6. **Document**
   - Add comments explaining why
   - Link to protocol section
   - Document edge cases

7. **Integrate**
   - Wire into pages/components/API
   - Update related files
   - Test end-to-end

8. **Record in decision log**
   ```ts
   export const DECISION_X = {
     id: 'section_x',
     title: 'Implemented Section X',
     rationale: '...',
     codeReferences: ['lib/X/X.ts', 'app/api/Y.ts']
   }
   ```

---

## Tracking Progress

### Checklist Template

Use **PROTOCOL-QUICK-REFERENCE.txt** to track:

```
SECTION 5: STATE MACHINES (❌ MISSING) — 2-3 HOURS
  ☐ Create lib/state-machines/ directory
  ☐ Add job-lifecycle.ts
  ☐ Add evidence-lifecycle.ts
  ☐ Add document-generation.ts
  ☐ Add proof-decision.ts
  ☐ Add tests
```

As you complete each ☐, mark it ✅.

---

## Critical Points

### 1. **Section 8 is everything**
The Atomic I/O Contract Table is the heart of The Protocol.

If you only do one thing: **Complete Section 8.**

It will reveal what's missing in everything else.

### 2. **Run the four audits early**
After Section 8, run the audits.

They'll surface gaps faster than building blindly.

### 3. **Trap states are make-or-break**
Users stuck = bad system.

Prioritize Section 16 (Trap States) high.

### 4. **Testing is part of the protocol**
Every section needs tests.

Tests prove the implementation matches the protocol.

---

## When You Get Stuck

**"I don't know what to put in contract X"**
→ Go test it. Click the button, see what happens. Document what you see.

**"This section seems incomplete"**
→ It probably is. Document what's missing. Add a TODO.

**"I found a trap state"**
→ Excellent! Document it. Add a timeout guard. Test the guard works.

**"The code doesn't match the contract"**
→ Either fix the code or update the contract. They must match.

---

## End Goal

When Protocol implementation is complete:

✅ Every interaction formally documented (Atomic I/O)  
✅ Every state machine formal (state transitions)  
✅ Every entry/exit point defined (user journeys)  
✅ Every trigger inventoried (what causes actions)  
✅ Every cascade mapped (what chains together)  
✅ Every notification defined (user feedback)  
✅ Every gate documented (what prevents bad states)  
✅ Every failure path mapped (recovery procedures)  
✅ Every trap state guarded (users don't get stuck)  
✅ Every event traced (observability)  
✅ Every decision documented (why it's this way)  

Result: **PRODUCTION-READY, FORMALLY VERIFIED SYSTEM**

---

## Questions? 

Refer to:
1. **PROTOCOL-QUICK-REFERENCE.txt** — Am I building the right thing?
2. **AUDIT-PROTOCOL-COMPLIANCE-MAP.md** — How do I build it?
3. **The_Audit_Protocol_v1.pdf** — What does The Protocol say?

---

**Status:** Ready to implement  
**You build in:** Codex or Claude (your environment)  
**I advise from:** Here (this document + references)

Let's go.
