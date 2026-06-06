# HireWire Copilot/Cursor Alignment Prompt

> Use this in VS Code's Copilot Chat or Cursor to get AI assistance aligned with HireWire's architecture.

---

## Copy-paste this into your AI assistant prompt or `.cursorrules`:

```
You are assisting with HireWire, a Next.js Application Readiness Engine.

## Architecture Principles

1. **Single Source of Truth for Readiness**
   - All readiness decisions flow through `lib/readiness/evaluator.ts::evaluateReadiness()`
   - Never derive readiness in components; always call this function
   - ReadinessResult includes: isReady, canGenerate, canApply, nextAction, displayState, checklist, blockedReasons

2. **Scoring is Multi-Dimensional**
   - 5 dimensions: experience_relevance, evidence_quality, skills_match, seniority_alignment, ats_keywords
   - 50 role profiles with weighted combinations (always sum to 100)
   - Use lib/scoring-weights.ts for role lookups, lib/canonical-evidence.ts for scoring

3. **Coach is Conversational AI**
   - Uses AI SDK 6 with streaming
   - Sessions are scoped to (user, job, requirement) — always pass context
   - Every evidence save goes through claim-validator
   - Tool calls are idempotent and logged with correlation IDs
   - Key files: lib/coach/, components/coach-chat.tsx, components/coach/GapCoachDrawer.tsx

4. **TruthSerum Provenance**
   - Every generated bullet traces to real evidence
   - Decision types: confirmed, skipped, auto_mapped, needs_judgment
   - Quality flags: weak_evidence, conflicting_sources, outdated, inferred
   - Bullet traces stored in evidence_map.bullet_provenance

5. **Evidence Map is Canonical**
   - Stored in jobs.evidence_map column
   - Structure: CanonicalJobEvidenceMap with requirement_matches[], score_gaps[], bullet_provenance
   - Evidence changes must trigger auto-rebuild of map
   - Map rebuild emits domain event → readiness recomputes

6. **Generation Has Gates**
   - canGenerate gate: checks evidence completeness, coach step completion
   - quality_passed gate: user must accept package quality before apply
   - Export gate: NOT YET implemented — needs quality check before docx export
   - All gates checked server-side, never bypassed on client

7. **Coach Sessions are DB-Backed**
   - coach_sessions table tracks (user_id, job_id, requirement_id, session_id)
   - coach_sessions_messages stores all turns with streaming metadata
   - Sessions persist across page reloads
   - Use /api/coach/sessions endpoints only

8. **Domain Events Drive Recomputation**
   - lib/domain-events/ is canonical (NOT lib/events/)
   - Domain event table: id (bigint), event_type, job_id, payload, metadata, invalidates, recomputes, affected_routes
   - Audit events table: id (uuid), event_type, job_id, metadata (NOT payload), correlation_id, reason, outcome
   - Every mutation emits domain event with correlation ID
   - Readiness cascade: domain event → invalidateCache → recomputeReadiness → invalidate routes

9. **Communications are Centralized**
   - Every user-facing message has a CommunicationReason from lib/comms/registry.ts
   - Use COMMS_REGISTRY for message lookup
   - Never hardcode user messages in components
   - Messages include tone, channel, intent, and action

10. **Safety is Layered**
    - Injection detection: lib/safety/injection-detector.ts (1201 LOC) — blocks prompt injection
    - Content moderation: flags inappropriate content
    - PII detection: masks sensitive information
    - Claim validation: checks factuality before evidence save
    - Semantic gates: verifies meaning/coherence/completeness of generated content

## Common Tasks

### Adding a new job dimension to scoring:
1. Add to lib/scoring-weights.ts: DimensionWeights type and role profiles
2. Update analyze-job-core.ts to calculate new dimension
3. Update canonical-evidence.ts to explain new dimension in breakdown

### Modifying coach behavior:
1. Update system prompt in lib/coach/buildCoachPrompt.ts
2. If adding tools, update lib/coach/tools.ts + tool-router.ts
3. Always validate claims in lib/coach/claim-validator.ts
4. Test with /api/coach/sessions endpoints

### Changing readiness gates:
1. NEVER modify ReadinessResult type without versioning
2. Update evaluateReadiness() in lib/readiness/evaluator.ts
3. Emit domain event so dependent pages invalidate
4. Update readiness.checklist if adding/removing gates

### Evidence changes:
1. ALWAYS trigger rebuild-evidence-map after evidence_library INSERT/UPDATE/DELETE
2. Use lib/actions/evidence.ts for all mutations
3. Emit domain event with correlation ID
4. Wait for readiness recompute before showing user

### Generating content:
1. Call /api/generate-documents with canGenerate check
2. Use TruthSerum for provenance tracking
3. Generate strategy: call generation-strategy.ts for mode (conservative/balanced/aggressive)
4. Store generation_id + trace in document_generation_traces table

## Code Patterns

### Readiness check (always server-side):
```typescript
const readiness = await evaluateJobReadiness(supabase, userId, jobId)
if (!readiness.isReady && !userHasOverride) {
  return { error: readiness.blockedReasons }
}
```

### Domain event emission:
```typescript
import { emitDomainEvent } from "@/lib/domain-events/emit-event"
await emitDomainEvent({
  event_type: "evidence.confirmed",
  job_id: jobId,
  payload: { evidence_id, requirement_id },
  correlation_id,
})
```

### Coach session creation:
```typescript
const session = await POST /api/coach/sessions
  jobId, requirementId, userId
// Returns: coachSessionId for streaming chat
```

### Evidence validation:
```typescript
const valid = await validateClaim(evidence.text)
if (!valid.isValid) throw new AppError(valid.reason)
```

## File Structure

```
lib/
  readiness/           — readiness evaluation (canonical)
    evaluator.ts       — pure evaluateReadiness()
    readiness.ts       — DB-backed evaluateJobReadiness()
  coach/               — coach AI system (21 files)
  safety/              — content safety (4 files)
  intelligence/        — role/recruiter intelligence
  scoring-weights.ts   — role profiles + weights
  canonical-evidence.ts — evidence classification + scoring
  analyze/             — job analysis pipeline
  truthserum.ts        — provenance tracking
  domain-events/       — canonical domain event system
  comms/               — message registry
  contracts/           — data contracts
  errors/              — structured errors

components/
  coach/               — coach UI components
  coach-chat.tsx       — AI SDK chat
  coach/GapCoachDrawer.tsx — per-gap modal
  coach/GuidedRequirementCoachFlow.tsx — guided matching

app/api/
  coach/               — coach session + streaming endpoints
  generate-documents   — generation pipeline
  integrity/           — integrity checks (5 endpoints)
  evidence/            — evidence mutation endpoints
```

## Critical Rules

- **DO NOT** bypass readiness gates on client
- **DO NOT** store generated_resume/cover_letter on jobs table (use documents table)
- **DO NOT** cache readiness without versioning
- **DO NOT** skip claim validation before evidence save
- **DO NOT** emit domain events without correlation ID
- **DO NOT** hardcode messages (use COMMS_REGISTRY)
- **DO NOT** ignore injection detection or safety gates
- **DO NOT** modify evidence_map directly (use rebuild-evidence-map)
- **DO** always await readiness recompute after mutations
- **DO** use server actions for all data mutations
- **DO** trace all AI calls with correlation IDs
- **DO** version domain event payloads

## Integration Points

- Supabase: 116 tables, RLS policies, immutable audit triggers
- Stripe: billing integration (separate from readiness)
- AI SDK 6: coach streaming + generation
- Vercel Blob: document storage (resume/cover letter files)

## Feature Flags

- `CONTEXT_ENGINE_ENABLED` — advanced profile context (experimental)
- Pro-gated: interview prep, advanced integrity checks

---

## Quick Links

- Architecture: .github/copilot-instructions.md
- Quick ref: .cursorrules
- Memory: v0_memories/user/MEMORY.md
- Codebase: ~40k LOC across 40+ lib modules, 30+ API routes, 50+ components
```

---

## Where to use this:

**Option 1: VS Code Copilot Chat**
Copy the content under the "Copy-paste this into..." section and paste it into Copilot Chat at the start of your coding session.

**Option 2: Cursor IDE**
Add to `.cursor` folder or paste into Cursor's context window before asking for code generation.

**Option 3: GitHub Copilot Settings**
Use in your workspace settings for persistent context.

**Option 4: Custom instructions**
If using OpenAI/Claude directly, paste the section into your system prompt.

---

## What's Covered

This alignment prompt ensures any AI assistance understands:
- The real readiness engine architecture
- Coach system with session persistence
- TruthSerum provenance model
- Evidence mapping and auto-rebuild
- Scoring system (50 roles, 5 dimensions)
- Domain events cascade
- Safety layers (injection, moderation, PII, semantic gates)
- Communications registry
- Critical do's and don'ts
- Common code patterns
- File structure

It should prevent:
- Bypassing readiness gates on client
- Hardcoding messages
- Losing provenance
- Evidence map going stale
- Sessions losing context
- Correlated events without IDs
- Unsafe claim storage
