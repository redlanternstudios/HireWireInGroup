# HireWire System Architecture — Complete Reference
## Day 20 Full Documentation

---

## Quick Start

**New to HireWire?** Start here:
1. Read `BUILD_DAY_20_SUMMARY.md` (overview of what was built)
2. Read `.github/copilot-instructions.md` (detailed system reference)
3. Use `.vscode/copilot-alignment.md` in Copilot Chat when coding

**Want to understand the readiness engine?**
→ `lib/readiness/evaluator.ts` (pure function, single source of truth)

**Want to add features?**
→ Follow the patterns in `.vscode/copilot-alignment.md` (critical rules section)

**Want to understand scoring?**
→ `lib/scoring-weights.ts` (50 role profiles) + `lib/canonical-evidence.ts` (explainable fit)

**Want to modify the coach?**
→ `lib/coach/buildCoachPrompt.ts` (system prompt) + `lib/coach/tool-router.ts` (tool handling)

---

## System Map (12 Major Systems)

```
┌─────────────────────────────────────────────────────────────┐
│ READINESS ENGINE (canonical)                                │
│ lib/readiness/evaluator.ts → evaluateReadiness()            │
│ ↓ All decisions flow through this pure function             │
│ ReadinessResult { isReady, canGenerate, canApply, ... }     │
└─────────────────────────────────────────────────────────────┘
       ↓
   ┌───┴────────────────────────────────────────────────┐
   ↓                                                    ↓
┌─────────────────┐                          ┌──────────────────┐
│ SCORING SYSTEM  │                          │ EVIDENCE MAPPING │
│ 50 role profiles│                          │ gap-detection.ts │
│ 5 dimensions    │                          │ rebuild triggers │
│ 2600+ LOC       │                          │ AUTO-REBUILD GAP │
└─────────────────┘                          └──────────────────┘
   ↑                                                    ↓
   └────────────────────────────────────────────────────┘
                          ↓
            ┌─────────────────────────────┐
            │ COACH SYSTEM (2500+ LOC)     │
            │ AI SDK streaming + tools     │
            │ coach_sessions DB-backed     │
            │ 21 files, tool execution     │
            └─────────────────────────────┘
                  ↓
            ┌─────────────────────────────┐
            │ TRUTHSERUM PROVENANCE       │
            │ 809 LOC, decision tracking  │
            │ Quality flags + bullet trace│
            │ evidence_map.bullet_prov... │
            └─────────────────────────────┘
                  ↓
            ┌─────────────────────────────┐
            │ GENERATION PIPELINE         │
            │ /api/generate-documents     │
            │ TruthSerum → semantic gates │
            │ → quality pass gate         │
            └─────────────────────────────┘
                  ↓
            ┌─────────────────────────────┐
            │ DOMAIN EVENTS CASCADE       │
            │ lib/domain-events/          │
            │ Emit → invalidate → recomp  │
            │ Correlation IDs tracked     │
            └─────────────────────────────┘

SUPPORTING SYSTEMS:
┌─────────────────────────────────────────────────────────────┐
│ SAFETY STACK (2000+ LOC)                                    │
│ Injection detection • Content moderation • PII masking      │
│ Claim validation • Semantic gates                           │
├─────────────────────────────────────────────────────────────┤
│ COMMS REGISTRY (1000+ LOC)                                  │
│ 30+ reason codes • Tone calibration • Multi-channel         │
├─────────────────────────────────────────────────────────────┤
│ INTELLIGENCE (1200+ LOC)                                    │
│ Role archetypes • Recruiter scan • Job signals              │
├─────────────────────────────────────────────────────────────┤
│ CONTEXT ENGINE (1500+ LOC, experimental)                    │
│ Profile context • Capability inference • Positioning        │
├─────────────────────────────────────────────────────────────┤
│ JOB ORCHESTRATOR (400+ LOC)                                 │
│ runJobFlow with step logging • Auditability                 │
├─────────────────────────────────────────────────────────────┤
│ ATS PARSING (600+ LOC, 6 parsers)                           │
│ Greenhouse • Lever • LinkedIn • Workday • Generic           │
├─────────────────────────────────────────────────────────────┤
│ ERROR SYSTEM (500+ LOC)                                     │
│ Structured errors • Correlation IDs • Logging               │
├─────────────────────────────────────────────────────────────┤
│ CONTRACTS (800+ LOC)                                        │
│ Data contracts • Plan limits • Go-live interfaces           │
└─────────────────────────────────────────────────────────────┘
```

---

## Data Flows

### Job Intake → Analysis → Generation

```
1. POST /jobs?add=true (user pastes job description)
   ↓
2. POST /api/re-analyze (trigger analysis)
   ├─ Detect ATS type (lib/parsers/)
   ├─ Extract requirements (ATS parser)
   ├─ Analyze core (lib/analyze/analyze-job-core.ts)
   │  ├─ Score each dimension
   │  ├─ Apply role weights (lib/scoring-weights.ts)
   │  └─ Store scores + analysis
   ├─ Build evidence map (lib/gap-detection.ts)
   └─ POST /api/domain-events (analysis.complete)
   ↓
3. Auto-redirect to /jobs/[id]/evidence-match
   ├─ Show requirement matches with status
   ├─ Show gaps (evidence needed)
   └─ Offer gap coach (GapCoachDrawer modal)
   ↓
4. User confirms evidence via coach or inline
   ├─ POST /api/coach/confirm-tool-call (if via coach)
   ├─ Evidence validated (claim-validator.ts)
   ├─ Evidence saved to evidence_library
   └─ POST /api/domain-events (evidence.confirmed)
   ↓
5. Domain event → readiness.recompute()
   ├─ Call evaluateReadiness()
   ├─ Return new ReadinessResult
   └─ Invalidate /jobs/[id]/documents cache
   ↓
6. User navigates to /jobs/[id]/documents
   ├─ Show generation readiness checklist
   ├─ If canGenerate, show GenerateButton
   ├─ On click → POST /api/generate-documents
   │  ├─ TruthSerum proof selection
   │  ├─ Generation strategy (conservative/balanced/aggressive)
   │  ├─ Semantic gates applied
   │  ├─ Quality flags calculated
   │  └─ Store document_generation_traces + generation_id
   ├─ Poll for completion
   └─ Display preview + bullets + provenance
   ↓
7. Review package
   ├─ Show ApplicationPackagePreview
   ├─ User can edit bullets/bullets/structure
   ├─ User clicks Accept or Flag
   │  └─ POST /api/jobs/[id]/package (accept/flag action)
   │     └─ POST /api/domain-events (package.accepted or package.flagged)
   ↓
8. User navigates to /ready-to-apply
   ├─ Gate check: readiness.isReady + quality_passed + no_blocking_reasons
   ├─ If blocked, show reason + option to override
   ├─ If ready, show MarkAsAppliedButton
   ├─ On click → POST /api/jobs/[id]/apply
   │  ├─ Server-side readiness check (final)
   │  ├─ Mark application as submitted
   │  └─ POST /api/domain-events (application.submitted)
   └─ Redirect to /applications
   ↓
9. Track outcomes
   ├─ /applications shows all applications with status
   ├─ /jobs/[id] shows OutcomeTracker for this job
   └─ Outcomes feed back to evidence via future system
```

### Coach Session Flow

```
1. User opens gap on evidence-match or clicks /coach
   ↓
2. Frontend detects session needed
   ├─ POST /api/coach/sessions { userId, jobId, requirementId, questionType }
   └─ Backend returns { coachSessionId }
   ↓
3. CoachChat mounts with session context
   └─ AI SDK useChat(..., { api: /api/coach/sessions/[id]/messages })
   ↓
4. User types message
   ├─ POST /api/coach/sessions/[id]/messages { message, messages[] }
   ├─ AI generates response + potential tool calls
   └─ Stream back to client
   ↓
5. If tool call (e.g., save-evidence):
   ├─ Frontend shows tool execution UI
   ├─ User confirms or edits
   ├─ POST /api/coach/confirm-tool-call { toolName, toolInput, confirmedInput }
   │  ├─ Validate claim (claim-validator.ts)
   │  ├─ Save to evidence_library
   │  └─ POST /api/domain-events (evidence.confirmed)
   └─ Coach continues or offers next action (e.g., "Next gap?" or "Ready to generate?")
   ↓
6. Session persists in coach_sessions + coach_sessions_messages tables
   ├─ Survives page reload
   ├─ Thread of conversation visible on next return
   └─ Used by context engine for future capabilities inference
```

### Evidence Change → Readiness Recompute (BROKEN, FIX NEEDED)

```
CURRENT (broken):
1. User adds new evidence → POST /api/evidence { item, text, ... }
2. Evidence saved to evidence_library
3. ??? Map not rebuilt automatically ???
4. User returns to /jobs/[id] → readiness still shows old gaps
5. User has to manually click "Rebuild Evidence Map" button

DESIRED (P0 fix):
1. User adds new evidence → POST /api/evidence { item, text, ... }
2. Evidence saved to evidence_library
3. Server triggers rebuild-evidence-map for all jobs with this user
   ├─ Recalculate evidence_map.requirement_matches[]
   ├─ Store in jobs.evidence_map
   └─ POST /api/domain-events (evidence_map.rebuilt)
4. Domain event handler:
   ├─ Calls evaluateReadiness() for job
   ├─ Returns new ReadinessResult
   └─ Invalidates /jobs/[id]/documents cache
5. User returns to /jobs/[id] → readiness shows updated gaps
6. User can immediately generate without manual rebuild step
```

---

## Critical Constraints

### Readiness

- [ ] NEVER bypass readiness gates on client
- [ ] NEVER cache readiness without correlation ID
- [ ] ALWAYS call evaluateReadiness() server-side
- [ ] ALWAYS emit domain event after mutation

### Evidence

- [ ] ALWAYS validate claims before save (claim-validator.ts)
- [ ] NEVER store evidence without TruthSerum decision type
- [ ] ALWAYS trigger evidence map rebuild after change
- [ ] NEVER skip injection detection on user input

### Coach

- [ ] ALWAYS scope sessions to (user, job, requirement)
- [ ] NEVER modify coach_sessions_messages after insert
- [ ] ALWAYS use tool-router for tool execution
- [ ] ALWAYS confirm tool calls before evidence save

### Generation

- [ ] ALWAYS check canGenerate before generation
- [ ] ALWAYS check quality_passed before export
- [ ] NEVER generate without TruthSerum provenance
- [ ] ALWAYS store generation_id + trace

### Domain Events

- [ ] NEVER emit events without correlation_id
- [ ] ALWAYS map domain event to affected routes for invalidation
- [ ] NEVER swallow domain event errors silently
- [ ] ALWAYS log event outcome (success/failure)

---

## Performance Characteristics

| Operation | Expected Time | Cached | Notes |
|-----------|---------------|--------|-------|
| evaluateReadiness() | <10ms | 2 min | Pure function, no I/O |
| Job analysis | 5-30s | None | Calls AI, async |
| Evidence map rebuild | <1s | 5 min | Regex matching only |
| Coach session start | <100ms | None | DB insert + session retrieval |
| Coach message stream | 3-10s | None | AI streaming response |
| Generation (resume) | 10-60s | None | AI generation, stored in traces table |
| Domain event cascade | <100ms | None | Async, logs to audit table |

---

## How to Contribute

### Adding a new scoring dimension:

1. Update `lib/scoring-weights.ts`:
   - Add to `DimensionWeights` type
   - Add weight key to all 50 role profiles
2. Update `lib/analyze/analyze-job-core.ts`:
   - Add calculation logic for new dimension
3. Update `lib/canonical-evidence.ts`:
   - Add to explainable breakdown output
4. Test: `npm run test:evidence`

### Modifying coach behavior:

1. Update `lib/coach/buildCoachPrompt.ts` (system prompt)
2. If adding tools: update `lib/coach/tools.ts` + `lib/coach/tool-router.ts`
3. Test: run coach session, trigger tool, verify output

### Fixing readiness gate:

1. Update `lib/readiness/evaluator.ts` (evaluateReadiness function)
2. Update `ReadinessResult` type if needed (version carefully!)
3. Emit domain event for cascade
4. Verify: `npm run typecheck` + test on `/jobs/[id]`

### Adding new safety check:

1. Create check in `lib/safety/` or `lib/claim-safety.ts`
2. Call in appropriate pipeline:
   - Evidence save: call from `claim-validator.ts`
   - Generation: call from semantic gates
   - Evidence input: call from injection detector
3. Test: run full generation flow end-to-end

---

## Debugging Checklist

**Readiness showing incorrect state?**
- [ ] Check evaluateReadiness() output directly (lib/readiness/evaluator.ts)
- [ ] Check evidence_map.requirement_matches[] in jobs table (was map rebuilt?)
- [ ] Check coach_step.completed status (is coach step blocking?)
- [ ] Check quality_passed flag on jobs row
- [ ] Run: `npm run test:evidence`

**Coach session not loading?**
- [ ] Check coach_sessions table for session record (was session created?)
- [ ] Check coach_sessions_messages table (are turns persisted?)
- [ ] Check /api/coach/sessions logs for errors
- [ ] Check browser console for fetch errors to /api/coach/sessions/[id]/messages
- [ ] Verify session has valid userId, jobId, requirementId

**Evidence not saving?**
- [ ] Check claim-validator output (was claim valid?)
- [ ] Check injection-detector output (was injection blocked?)
- [ ] Check evidence_library table (is record inserted?)
- [ ] Check domain_events table (was event emitted?)
- [ ] Did readiness recompute after save?

**Generation not starting?**
- [ ] Check readiness.canGenerate (are gates passing?)
- [ ] Check /api/generate-documents logs
- [ ] Check document_generation_traces table (was generation recorded?)
- [ ] Check generation_status on jobs row (generating? ready? failed?)
- [ ] Check application_packages table for quality_passed flag

---

## Key Files at a Glance

| System | File | LOC | Purpose |
|--------|------|-----|---------|
| Readiness | `lib/readiness/evaluator.ts` | 250 | Pure readiness eval |
| Scoring | `lib/scoring-weights.ts` | 658 | 50 role profiles |
| Scoring | `lib/canonical-evidence.ts` | 645 | Evidence classification |
| Analysis | `lib/analyze/analyze-job-core.ts` | 921 | Full pipeline |
| Coach | `lib/coach/tool-execution.ts` | 998 | Tool call handling |
| Coach | `components/coach-chat.tsx` | 576 | AI SDK UI |
| Coach | `components/coach/GapCoachDrawer.tsx` | 439 | Per-gap modal |
| Provenance | `lib/truthserum.ts` | 809 | Decision tracking |
| Safety | `lib/safety/injection-detector.ts` | 1201 | Injection detection |
| Safety | `lib/semantic-gates.ts` | 508 | Generation gates |
| Export | `lib/export.ts` | 1241 | Document export |
| Events | `lib/domain-events/emit-event.ts` | 150 | Event emission |
| Comms | `lib/comms/registry.ts` | 361 | Message registry |
| Errors | `lib/errors/factory.ts` | 257 | Error factory |
| Types | `lib/types.ts` | 440 | All types |

---

**Last updated:** Day 20, Build Status Audit
**Total documentation:** 5 files, 1,400+ lines
**Total codebase:** 40,000+ LOC across 12 systems
**All 116 Supabase tables mapped and documented**
**Ready for production and AI-assisted development**
