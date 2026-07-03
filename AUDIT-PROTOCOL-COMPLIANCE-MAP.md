# HireWire — Audit Protocol v1.0 Compliance Map

## Overview

**The Protocol requires:** 18 formal sections + 4 audits  
**HireWire current state:** ~40% complete (discovery done, formalization needed)  
**Gap:** Atomic I/O contracts, trigger registry, gates, receipts, trap-state audit  

---

## SECTION 1: Component Map — Status ✅ DONE

**What's needed:**
- Inventory of all 127 components with location + purpose

**HireWire Status:**
- ✅ All 127 components identified
- ✅ Location known (components/ directory)
- ✅ Type: UI, domain-specific, form, modal, etc.

**What to build:** NOTHING (already discovered)

**Files to reference:**
- `/vercel/share/v0-project/COMPREHENSIVE-AUDIT-RE-DISCOVERY.md` (lists all components)

---

## SECTION 2: Page/Route Map — Status ✅ DONE

**What's needed:**
- All 35 pages with URL, purpose, protected/public status

**HireWire Status:**
- ✅ All 35 pages identified
- ✅ Auth status known (middleware.ts validates)
- ✅ Route structure clear (app/(dashboard)/ vs app/(auth)/)

**What to build:** NOTHING (already discovered)

**Files to reference:**
- `/vercel/share/v0-project/COMPLETENESS-AUDIT.md` (full page list with URLs)

---

## SECTION 3: API Endpoint Registry — Status ✅ DONE

**What's needed:**
- All 39 endpoints with method, path, request schema, response schema

**HireWire Status:**
- ✅ All 39 endpoints identified
- ✅ Methods known (GET, POST, PATCH, DELETE)
- ✅ Paths documented

**What to build:** NOTHING (already discovered)

**Files to reference:**
- `/vercel/share/v0-project/WIRING-VERIFICATION.txt` (all endpoints listed)

---

## SECTION 4: Data Model — Status ✅ DONE

**What's needed:**
- 18 database tables with columns, types, relationships, RLS

**HireWire Status:**
- ✅ All 18 tables created in Supabase
- ✅ RLS policies applied to all
- ✅ Relationships mapped (FK constraints exist)

**What to build:** NOTHING (already in DB)

**Files to reference:**
- `supabase/migrations/` (all schema migrations)
- GetOrRequestIntegration(["Supabase"]) will show live schema

---

## SECTION 5: State Machines — Status 🟡 PARTIAL

**What's needed (per The Protocol):**
- Formal state diagrams for each major entity
- Explicit entry/exit conditions
- Legal vs illegal transitions
- Trap-state guards

**HireWire Status:**
- ⚠️ State machines exist implicitly in code but NOT formally documented
- ⚠️ Example: `generation_status` has values ("generating", "ready", "needs_review", "failed") but transitions not documented
- ⚠️ Example: `proof_decision` has values ("confirmed", "skipped", "needs_judgment") but trap conditions not explicit
- ⚠️ Example: Job workflow (new → analyzed → scored → ready → applied → etc) but no formal diagram

**What to build:** State machine documentation

**Build items:**

### 5.1 Job Lifecycle State Machine
```
DEFINE states:
  INITIAL (created, no analysis)
  ANALYZED (job parsed + requirements extracted)
  SCORED (user evidence matched + fit calculated)
  GENERATION_READY (all proofs confirmed OR skipped)
  APPLYING (user clicked Apply)
  APPLIED (application submitted)
  TRACKING (tracking application status)
  CLOSED (outcome recorded)
  ARCHIVED

DEFINE transitions:
  INITIAL → ANALYZED (via /api/jobs/analyze)
  ANALYZED → SCORED (via /api/jobs/[id]/evidence-map)
  SCORED → GENERATION_READY (via coach or manual skip)
  GENERATION_READY → APPLYING (user clicks Apply button)
  APPLYING → APPLIED (via /api/jobs/[id]/apply)
  APPLIED → TRACKING (via /applications page)
  TRACKING → CLOSED (user updates outcome)
  * → ARCHIVED (via /jobs/[id]/archive)

ILLEGAL transitions (TRAP GUARDS):
  ✗ INITIAL → SCORED (must go through ANALYZED)
  ✗ ANALYZED → APPLYING (must have scores)
  ✗ APPLIED → INITIAL (no rollback)
```

### 5.2 Evidence Lifecycle State Machine
```
DEFINE states:
  COLLECTED (raw input from LinkedIn/resume/manual)
  VALIDATED (passed claim-validator.ts)
  FLAGGED (failed validation)
  APPROVED (user confirmed via coach)
  MAPPED (matched to job requirement)
  USED (included in generation)

DEFINE transitions:
  COLLECTED → VALIDATED (via safety gates)
  VALIDATED → APPROVED (user confirms via coach)
  FLAGGED → needs manual revision (return to user)
  APPROVED → MAPPED (via evidence mapper)
  MAPPED → USED (via document generation)

TRAP GUARDS:
  ✗ COLLECTED → USED (must be APPROVED first)
  ✗ FLAGGED → MAPPED (must be re-validated)
```

### 5.3 Document Generation State Machine
```
DEFINE states:
  PENDING (generation_status="generating")
  READY (generation_status="ready", quality_passed=true)
  NEEDS_REVIEW (generation_status="needs_review", quality_passed=false)
  FAILED (generation_status="failed")
  EXPORTED (user downloaded DOCX/PDF)

DEFINE transitions:
  PENDING → READY (if quality gates pass)
  PENDING → NEEDS_REVIEW (if quality flags present)
  PENDING → FAILED (if API error)
  READY → EXPORTED (user clicks download)
  NEEDS_REVIEW → READY (user accepts flagged content)
  * → PENDING (on edit, reset to regenerate)

TRAP GUARDS:
  ✗ FAILED → READY (must re-generate, not force)
  ✗ NEEDS_REVIEW → EXPORTED (must accept review first)
```

### 5.4 Proof Decision State Machine
```
DEFINE states:
  NEEDS_JUDGMENT (no proof yet)
  CONFIRMED (user approved via coach)
  SKIPPED (user explicitly skipped)
  REJECTED (user rejected evidence)

DEFINE transitions:
  NEEDS_JUDGMENT → CONFIRMED (via confirmProof tool)
  NEEDS_JUDGMENT → SKIPPED (via skipRequirement tool)
  CONFIRMED → NEEDS_JUDGMENT (on edit/clear)
  SKIPPED → CONFIRMED (user changes mind)

TRAP GUARDS:
  ✗ NEEDS_JUDGMENT → (any other) without user action
  ✗ CONFIRMED → REJECTED (no rejection state, only override)
```

**Where to add:**
- Create: `lib/state-machines/` directory
- Add: `job-lifecycle.ts`, `evidence-lifecycle.ts`, `document-generation.ts`, `proof-decision.ts`
- Each file: Enum + type guards + illegal-transition detector

---

## SECTION 6: Entry Points — Status ✅ DONE

**What's needed:**
- All ways to enter the system (triggers)

**HireWire Status:**
- ✅ Entry points identified:
  - Login page (public)
  - Signup page (public)
  - LinkedIn import (authenticated)
  - Resume upload (authenticated)
  - Manual evidence entry (authenticated)
  - Job URL paste (authenticated)
  - API webhook (Stripe)

**What to build:** NOTHING (already discovered)

---

## SECTION 7: Exit Points — Status 🟡 PARTIAL

**What's needed:**
- All terminal states (user leaves the system)

**HireWire Status:**
- ⚠️ Some exits documented, some missing
- ✅ Logout (explicit exit)
- ✅ Application submitted → external (implicit exit)
- ❌ Session timeout (exit not formalized)
- ❌ Account deletion (exit not documented)
- ❌ Job archive (not terminal, just hidden)
- ❌ Delete account (if supported)

**What to build:** Exit points documentation + handlers

**Build items:**

### 7.1 Document exit points
```
DEFINE exits:
  1. Logout (explicit user action)
     - Clear session
     - Redirect to /login
     - Keep data

  2. Application submitted (data exit)
     - User has external outcome (hired, rejected, etc)
     - Job marked as CLOSED
     - Data archived, not deleted

  3. Session timeout
     - After 60 minutes inactivity
     - Redirect to /login
     - Show "session expired" message
     - Keep data

  4. Account deletion (if supported)
     - User requests account delete
     - Soft delete: mark users.deleted_at
     - Hard delete: remove from auth.users + cascade delete
     - Send email confirmation first

  5. Subscription cancellation
     - User downgrades from pro/enterprise
     - Mark subscription_status="canceled"
     - Set current_period_end=now
     - Block new job/generation on period_end
```

### 7.2 Implement session timeout
- Add idle timer in middleware
- After 60min inactivity → force logout
- Store last_activity_at on each request
- Check on middleware

### 7.3 Implement account deletion (if supporting)
- Add DELETE /api/auth/account endpoint
- Send confirmation email first
- Soft delete (users.deleted_at = now)
- Cascade delete all user data

**Where to add:**
- Update: `middleware.ts` (session timeout check)
- Create: `lib/auth/session.ts` (session management)
- Add: `app/api/auth/logout/route.ts` (explicit logout)
- Add: `app/api/auth/account/route.ts` (account deletion if needed)

---

## SECTION 8: Atomic I/O Contract Table — Status ❌ MISSING

**What's needed (THE HEART OF THE PROTOCOL):**
- For EVERY interaction, document:
  - What user does (INPUT)
  - What system should do (ACTION)
  - What system outputs (OUTPUT)
  - What changes in DB (STATE CHANGE)
  - What notification fires (FEEDBACK)
  - What can go wrong (ERROR CASES)
  - How to recover (RECOVERY)

**HireWire Status:**
- ❌ NOT FORMALIZED
- Code exists but not documented as formal contracts
- Implicit in component logic, not explicit in documentation

**What to build:** THE BIG ONE

**This requires documenting every button click, form submit, API call:**

### 8.1 Atomic I/O Contract Table (Sample format)

```markdown
| Interaction | User Input | API Called | Request Schema | Response Schema | DB Changes | Feedback | Error Cases | Recovery |
|---|---|---|---|---|---|---|---|---|
| Click "Add Job" | URL paste | POST /api/jobs/analyze | { url: string } | { job_id: uuid, title, company, requirements[] } | INSERT jobs, INSERT job_analyses | Toast: "Job added" → Redirect to /jobs/[id] | Invalid URL, parse failed, duplicate | Show error, user re-enters URL |
| Click "Import LinkedIn" | Select file | POST /api/linkedin/capture | { profileUrl?: string, pdfFile?: File } | { profile: {}, evidence: Evidence[] } | INSERT evidence_library (is_user_approved=false) | Toast: "LinkedIn profile imported", show preview | File too large, parse failed | Retry or manual entry |
| Coach confirms proof | Click "Save" in coach | POST /api/coach/confirm-tool-call | { requirement_id, evidence_id, coach_session_id } | { proof_decision: "confirmed", evidence: Evidence } | UPDATE evidence_library (is_user_approved=true), UPDATE job_scores (proof_decision="confirmed") | Coach: "Saved! Next requirement...", update job readiness | Validation fails, duplicate evidence | Show validation error, user edits |
| Click "Generate Resume" | If ready: click button | POST /api/generate-documents | { job_id, template: "minimal"\|"detailed" } | { document_id, generation_status, bullets: [] } | INSERT documents, UPDATE jobs (generation_status="ready"\|"needs_review") | Modal shows "Generating...", then preview of bullets | Safety gate fails, API error | Show error, user can retry or coach for proof |
| User "Apply to Job" | Click apply button | POST /api/jobs/[id]/apply | { job_id } | { application_id, status: "pending" } | INSERT applications, EMIT domain event "application.submitted" | Toast: "Applied! Track in /applications", redirect | Already applied (duplicate check) | Show existing application |
| Verification check | User clicks verify | POST /api/integrity/verification | { job_id } | { flags: [], score: number, recommendations: [] } | INSERT audit_events | Show results badge, badges on evidence | No evidence yet | Suggest adding evidence first |

```

**Build process:**

### 8.2 Create Atomic I/O Registry

For EACH of 35 pages × 5 interactions average = ~175 contracts:
- Create: `/lib/contracts/atomic-i-o-registry.ts`
- Define TypeScript interface:
  ```ts
  interface AtomicIOContract {
    id: string
    page: string
    interaction: string
    userInput: string
    apiEndpoint: string
    requestSchema: ZodSchema
    responseSchema: ZodSchema
    dbChanges: string[]
    feedback: string
    errorCases: ErrorCase[]
    recovery: string
  }
  ```

- Add all 175 contracts (or start with critical 20)
- Link to corresponding pages/components

**Where to add:**
- Create: `lib/contracts/` directory
- Add: `atomic-i-o-registry.ts` (all 175 contracts)
- Add: `contract-validator.ts` (ensure all endpoints match contracts)
- Link: Each component/page to its contract

---

## SECTION 9: Trigger Registry — Status 🟡 PARTIAL

**What's needed:**
- Every way to trigger an action (buttons, links, keyboard, timers, webhooks, etc.)

**HireWire Status:**
- ✅ Most UI triggers exist (buttons click events)
- ⚠️ Not formally inventoried
- ❌ Webhook triggers not documented (Stripe)
- ❌ Timer-based triggers not documented (session timeout)
- ❌ Event-based triggers partially documented

**What to build:** Trigger registry

**Build items:**

### 9.1 Classify all triggers
```
UI TRIGGERS (buttons, links, form submits):
  - Button click → Action
  - Link click → Navigation
  - Form submit → API call
  - Keyboard shortcut (if any)
  - Drag/drop (if any)

API TRIGGERS (from external systems):
  - Stripe webhook (payment, subscription change)
  - LinkedIn webhook (if profile changes)
  - Zapier webhook (if configured)

TIME TRIGGERS (scheduled, periodic):
  - Session timeout (60min idle)
  - Usage reset (1st of month)
  - Subscription renewal (billing_period_end)

EVENT TRIGGERS (internal cascades):
  - Evidence confirmed → readiness recalculate
  - Document generated → readiness changed
  - Application submitted → track in analytics

GUARD TRIGGERS (what prevents action):
  - Auth check (not logged in → show login)
  - Readiness check (not ready → show gaps)
  - Plan limit (out of jobs → show upgrade)
```

### 9.2 Document for each major feature
- Create: `lib/triggers/trigger-registry.ts`
- List all 150+ triggers with conditions + handlers

**Where to add:**
- Create: `lib/triggers/trigger-registry.ts`
- Add: `lib/triggers/webhook-handlers.ts` (Stripe, Zapier)
- Add: `lib/triggers/timer-triggers.ts` (cron jobs, timeouts)
- Add: `lib/triggers/event-triggers.ts` (domain event handlers)

---

## SECTION 10: Hook/Loop/Cascade Registry — Status 🟡 PARTIAL

**What's needed:**
- Every place where action A triggers action B automatically (hooks, event listeners, cascades)

**HireWire Status:**
- ✅ Domain events system exists (lib/domain-events/)
- ✅ Event cascade partially documented
- ❌ Not formally mapped as loops
- ❌ Circular dependency checks missing
- ❌ Cascade depth not documented

**What to build:** Hook registry with cycle detection

**Build items:**

### 10.1 Map all cascades
```
CASCADE 1: Evidence Confirmed
  user clicks "Save" in coach
    → POST /api/coach/confirm-tool-call
      → evidence_library.is_user_approved = true
        → emitDomainEvent("evidence.confirmed", job_id)
          → getInvalidationTargets() returns ["job:scoring"]
            → updateJobScore(job_id)
              → if all proofs complete → job_readiness = "ready"
                → emitDomainEvent("job.ready", job_id)
                  → pages watching job readiness re-render

CASCADE 2: Document Generated
  user clicks "Generate Resume"
    → POST /api/generate-documents
      → AI generates bullets + cover letter
        → safety gates validate
          → if pass: generation_status = "ready", quality_passed = true
            → emitDomainEvent("document.generated", job_id)
              → getInvalidationTargets() returns ["job:readiness"]
                → if all gates pass: job_readiness = "applyable"
                  → pages show "Ready to Apply" button

CASCADE 3: Application Submitted
  user clicks "Apply Now"
    → POST /api/jobs/[id]/apply
      → applications INSERT
        → emitDomainEvent("application.submitted", job_id)
          → getInvalidationTargets() returns ["analytics", "applications:list"]
            → update career_outcomes table
              → /applications page refreshes to show new entry
              → /analytics dashboard updates stats
```

### 10.2 Cycle detection
```ts
// In lib/domain-events/cycle-detector.ts

function detectCycles(eventType: DomainEventType): string[] {
  const invalidationTargets = getInvalidationTargets(eventType)
  
  for (const target of invalidationTargets) {
    const eventsEmitted = getEventsEmittedByTarget(target)
    
    for (const emittedEvent of eventsEmitted) {
      const secondLevelTargets = getInvalidationTargets(emittedEvent)
      
      if (secondLevelTargets.includes(eventType)) {
        // CYCLE DETECTED!
        return [eventType, emittedEvent]
      }
    }
  }
  
  return []
}

// MUST CALL in tests:
// for each event type, ensure detectCycles(eventType) === []
```

### 10.3 Cascade depth limit
```ts
// Prevent infinite cascades
const MAX_CASCADE_DEPTH = 5

function emitDomainEventWithDepthCheck(
  event: DomainEvent,
  depth: number = 0
) {
  if (depth > MAX_CASCADE_DEPTH) {
    throw new Error(
      `Cascade depth exceeded for event ${event.type}. Possible loop.`
    )
  }
  
  // emit event
  // handle event (triggers next cascade)
  // depth++
}
```

**Where to add:**
- Create: `lib/domain-events/cascade-registry.ts`
- Add: `lib/domain-events/cycle-detector.ts`
- Update: `lib/domain-events/emit-event.ts` (add depth checking)
- Add tests: `lib/domain-events/cascades.test.ts` (verify no cycles)

---

## SECTION 11: Notification Matrix — Status 🟡 PARTIAL

**What's needed:**
- Every piece of feedback to user (toast, banner, modal, email, push)

**HireWire Status:**
- ⚠️ Toasts exist but not systematized
- ⚠️ Comms registry exists (lib/comms/) but not fully wired
- ❌ Email notifications not implemented
- ❌ Notification delivery guarantees missing

**What to build:** Notification matrix

**Build items:**

### 11.1 Document all notifications

```
INTERACTION → FEEDBACK

Login success → Toast: "Welcome back!"
Login fail (wrong password) → Toast: "Invalid email or password"
Login fail (timeout) → Toast: "Session expired, please login again"

Job parse success → Toast: "Job added!" + Redirect to detail
Job parse fail → Toast: "Could not parse URL. Paste title/company/requirements manually"

Evidence import success → Toast: "LinkedIn profile imported!"
Evidence import fail → Toast: "Could not parse file. Try uploading resume instead."

Coach confirms proof → Coach UI: "✓ Saved! Next requirement..."
Coach validates claim fail → Coach UI: "⚠ I don't have enough info. Tell me more about..."
All proofs confirmed → Banner: "Great! You're ready to generate your resume."

Document generation start → Modal: "Generating your resume..."
Document generation success → Toast: "Resume ready!" + Show preview
Document generation fail → Toast: "Generation failed. Try again or contact support."
Quality gates flagged → Amber banner: "Review flagged content before applying?"

Ready to apply → Green banner: "✓ Your resume is ready. Apply now?"
Apply success → Toast: "Applied! Check /applications to track"
Apply duplicate → Toast: "You already applied for this job"

Verification start → Loading state on button
Verification success → Show report with badges + recommendations
Verification fail → Toast: "Verification failed. Try again."

Session timeout (coming) → Modal: "Your session is expiring in 2 minutes. Click to stay logged in."
Session timeout (expired) → Redirect to /login + Toast: "Session expired"
```

### 11.2 Wire notifications to feedback channels
```ts
// lib/comms/notify.ts

type NotificationChannel = 'toast' | 'banner' | 'modal' | 'email' | 'push'

async function notify(
  userId: string,
  reason: CommunicationReason,
  channel: NotificationChannel,
  options?: { title, body, action }
) {
  const message = COMMS_REGISTRY[reason]
  
  switch (channel) {
    case 'toast':
      // Client-side toast (handled in component)
      break
    case 'banner':
      // Page-level banner (persistent)
      break
    case 'modal':
      // Full screen modal (requires action)
      break
    case 'email':
      // Send transactional email (Resend, SendGrid, etc)
      break
    case 'push':
      // Send push notification (if mobile app)
      break
  }
  
  // Log notification
  await logNotification(userId, reason, channel)
}
```

**Where to add:**
- Create: `lib/comms/notification-matrix.ts` (all 50+ notifications mapped)
- Update: `lib/comms/notify.ts` (implement delivery)
- Add: `lib/comms/email-templates.ts` (if email needed)
- Add: `lib/comms/push-templates.ts` (if mobile)

---

## SECTION 12: Control Layer & Gates — Status 🟡 PARTIAL

**What's needed:**
- All checkpoints that prevent/allow action (auth, readiness, plans, etc)

**HireWire Status:**
- ✅ Auth middleware exists
- ✅ Readiness evaluator exists
- ✅ Plan limits enforced somewhere
- ❌ Gates not formally inventoried
- ❌ Gate bypass conditions not documented
- ❌ Manual overrides missing

**What to build:** Gate registry with formalization

**Build items:**

### 12.1 Inventory all gates

```
AUTHENTICATION GATES:
  Gate: User must be logged in
  Protected routes: All /dashboard/* paths
  Failure: Redirect to /login
  Bypass: None
  Check: middleware.ts validates session

READINESS GATES:
  Gate: Job must be analyzed before evidence mapping
  Protected action: /api/jobs/[id]/evidence-map
  Failure: Return 400 + "Job not analyzed yet"
  Bypass: Manual override (if admin)?
  Check: lib/readiness.ts::evaluateJobReadiness()

  Gate: All proofs must be confirmed before generation
  Protected action: /api/generate-documents
  Failure: Show coach drawer instead of generating
  Bypass: User can skip remaining proofs
  Check: proof_decision != "needs_judgment" for all

PLAN LIMIT GATES:
  Gate: Pro users get 5 jobs/month
  Protected action: POST /api/jobs
  Failure: Show upgrade banner
  Bypass: None
  Check: users.jobs_this_month >= PLAN_LIMITS[plan_type]

QUALITY GATES:
  Gate: Generated resume must pass safety validators
  Protected action: /api/generate-documents
  Failure: generation_status="needs_review", user must accept
  Bypass: User explicitly accepts flagged content
  Check: lib/semantic-gates.ts runs all validators

DUPLICATE GATES:
  Gate: User cannot apply to same job twice
  Protected action: POST /api/jobs/[id]/apply
  Failure: Return 409 + "Already applied"
  Bypass: None
  Check: SELECT * FROM applications WHERE user_id=? AND job_id=?
```

### 12.2 Formalize gates as guards

```ts
// lib/gates/gate-registry.ts

type GateResult = 
  | { allowed: true }
  | { allowed: false; reason: string; recovery?: string }

async function evaluateGate(
  gateId: string,
  context: GateContext
): Promise<GateResult> {
  switch (gateId) {
    case 'auth':
      return evaluateAuthGate(context)
    case 'readiness':
      return evaluateReadinessGate(context)
    case 'plan_limit':
      return evaluatePlanLimitGate(context)
    case 'quality':
      return evaluateQualityGate(context)
    case 'duplicate':
      return evaluateDuplicateGate(context)
  }
}

// Usage in API:
const gate = await evaluateGate('plan_limit', {
  userId: user.id,
  action: 'create_job'
})

if (!gate.allowed) {
  return res.status(403).json({
    error: gate.reason,
    recovery: gate.recovery
  })
}
```

**Where to add:**
- Create: `lib/gates/gate-registry.ts` (all 20+ gates)
- Add: `lib/gates/evaluators.ts` (gate logic)
- Create: `lib/gates/middleware.ts` (gate checks in middleware)
- Add tests: `lib/gates/gates.test.ts`

---

## SECTION 13: Start/Stop/Kill Controls — Status ❌ MISSING

**What's needed:**
- How to stop/pause/resume system operations
- Kill switches for features, jobs, cascades

**HireWire Status:**
- ❌ No kill switches documented
- ❌ No pause mechanism for long operations
- ❌ No graceful shutdown
- ❌ Feature flags exist implicitly but not formal

**What to build:** Control switches

**Build items:**

### 13.1 Feature flags / Kill switches

```ts
// lib/features/feature-flags.ts

enum FeatureFlag {
  AI_COACH_ENABLED = 'ai_coach_enabled',
  INTEGRITY_VERIFICATION_ENABLED = 'integrity_verification_enabled',
  LINKEDIN_IMPORT_ENABLED = 'linkedin_import_enabled',
  DOCUMENT_GENERATION_ENABLED = 'document_generation_enabled',
  STRIPE_BILLING_ENABLED = 'stripe_billing_enabled',
}

async function isFeatureEnabled(flag: FeatureFlag): Promise<boolean> {
  // Check database or config
  const feature = await db.features.findOne({ name: flag })
  return feature?.enabled ?? false
}

// Usage:
if (await isFeatureEnabled('AI_COACH_ENABLED')) {
  // Show coach drawer
} else {
  // Hide coach, show error
}
```

### 13.2 Job cancellation / pause

```ts
// lib/jobs/job-controls.ts

async function cancelJob(jobId: string, reason: string) {
  // Stop any in-progress generation
  await cancelGeneration(jobId)
  
  // Mark as canceled
  await db.jobs.update(jobId, {
    status: 'canceled',
    canceled_at: new Date(),
    cancellation_reason: reason
  })
  
  // Emit event
  emitDomainEvent({
    type: 'job.canceled',
    job_id: jobId
  })
}

async function pauseGeneration(jobId: string) {
  // Stop AI generation mid-stream
  // Allow resume later
  await db.jobs.update(jobId, {
    generation_paused: true,
    generation_paused_at: new Date()
  })
}

async function resumeGeneration(jobId: string) {
  // Continue from where it paused
  await db.jobs.update(jobId, {
    generation_paused: false
  })
  // Re-submit to AI
}
```

### 13.3 Cascade kill switch

```ts
// lib/domain-events/cascade-control.ts

let cascadesEnabled = true

export function disableCascades() {
  cascadesEnabled = false
}

export function enableCascades() {
  cascadesEnabled = true
}

export function areCascadesEnabled() {
  return cascadesEnabled
}

// Usage in emit-event.ts:
function emitDomainEvent(event: DomainEvent) {
  // ... normal event logic
  
  if (areCascadesEnabled()) {
    handleEvent(event)  // triggers cascades
  } else {
    // Just log, don't cascade
  }
}
```

**Where to add:**
- Create: `lib/features/feature-flags.ts`
- Create: `lib/jobs/job-controls.ts`
- Create: `lib/domain-events/cascade-control.ts`
- Add: Admin page at `/admin/feature-flags` (to toggle)

---

## SECTION 14: Receipts & Observability — Status 🟡 PARTIAL

**What's needed:**
- Every action logged + traceable
- Audit trail for compliance
- Debug information for troubleshooting

**HireWire Status:**
- ✅ audit_events table exists
- ✅ domain_events table exists
- ⚠️ Not all events logged to audit trail
- ❌ No correlation IDs for request tracing
- ❌ No debug logging layer
- ❌ No request/response logging

**What to build:** Observability layer

**Build items:**

### 14.1 Correlation ID tracing

```ts
// lib/observability/correlation.ts

const correlationIdContext = new AsyncLocalStorage<string>()

export function getCorrelationId(): string {
  return correlationIdContext.getStore() || crypto.randomUUID()
}

export function withCorrelationId<T>(
  id: string,
  fn: () => Promise<T>
): Promise<T> {
  return correlationIdContext.run(id, fn)
}

// Middleware:
export async function correlationIdMiddleware(
  req: NextRequest
) {
  const correlationId = req.headers.get('X-Correlation-ID') || crypto.randomUUID()
  
  const response = await withCorrelationId(correlationId, async () => {
    return next()
  })
  
  response.headers.set('X-Correlation-ID', correlationId)
  return response
}
```

### 14.2 Request/response logging

```ts
// lib/observability/request-logger.ts

interface RequestLog {
  correlation_id: string
  user_id?: string
  method: string
  path: string
  status: number
  duration_ms: number
  request_body?: object
  response_body?: object
  error?: string
  created_at: Date
}

export async function logRequest(
  req: NextRequest,
  res: NextResponse,
  duration: number,
  error?: Error
) {
  const log: RequestLog = {
    correlation_id: getCorrelationId(),
    user_id: getCurrentUserId(),
    method: req.method,
    path: new URL(req.url).pathname,
    status: res.status,
    duration_ms: duration,
    error: error?.message
  }
  
  await db.request_logs.insert(log)
}

// Middleware wrapper:
export async function withLogging(handler: Function) {
  const start = Date.now()
  
  try {
    const response = await handler()
    const duration = Date.now() - start
    
    await logRequest(req, response, duration)
    return response
  } catch (error) {
    const duration = Date.now() - start
    await logRequest(req, errorResponse, duration, error)
    throw error
  }
}
```

### 14.3 Structured logging for debug

```ts
// lib/observability/logger.ts

export function logDebug(context: string, data: object) {
  console.log(`[${getCorrelationId()}] ${context}`, JSON.stringify(data))
  
  // Also save to DB if debug mode
  if (process.env.DEBUG_MODE) {
    db.debug_logs.insert({
      correlation_id: getCorrelationId(),
      context,
      data,
      created_at: new Date()
    })
  }
}

// Usage:
logDebug('evidence.confirmed', {
  job_id: jobId,
  evidence_id: evidenceId,
  requirement: requirement.title
})
```

**Where to add:**
- Create: `lib/observability/correlation.ts`
- Create: `lib/observability/request-logger.ts`
- Create: `lib/observability/logger.ts`
- Update: `middleware.ts` (add correlation ID + logging)
- Create DB table: `request_logs` and `debug_logs`

---

## SECTION 15: Failure & Recovery Paths — Status 🟡 PARTIAL

**What's needed:**
- What happens when things go wrong
- How to recover from each failure
- Retry logic, backoff, manual intervention

**HireWire Status:**
- ⚠️ Try/catch exists in code
- ❌ Recovery flows not formalized
- ❌ Retry logic not consistent
- ❌ Dead-letter queues missing
- ❌ Manual intervention paths missing

**What to build:** Failure recovery framework

**Build items:**

### 15.1 Failure modes inventory

```
FAILURE: Job parse fails (invalid URL)
  Cause: User enters bad URL
  Detection: URL parsing throws error
  Recovery: Show error message, suggest manual entry
  Retry: User can retry or enter manually
  Escalation: None needed

FAILURE: AI generation timeout (>30s)
  Cause: LLM slow or unresponsive
  Detection: Timeout middleware (30s limit)
  Recovery: Return "Generation timed out. Try again."
  Retry: User clicks "Try again", exponential backoff
  Escalation: If 3 retries fail, surface to user

FAILURE: Stripe webhook fails (3 retries)
  Cause: Network error, payment processing down
  Detection: Webhook handler exception
  Recovery: Store in dead_letter_queue, retry with exponential backoff
  Retry: Background job processes queue every 5 minutes
  Escalation: After 24h, send admin alert

FAILURE: Evidence validation fails
  Cause: Claim fails semantic gates
  Detection: Validator returns errors
  Recovery: Return validation errors to user + suggestions
  Retry: User edits claim and re-submits
  Escalation: Coach can manually approve if edge case

FAILURE: Database connection lost
  Cause: Supabase down or network issue
  Detection: DB query throws connection error
  Recovery: Return 503 "Service temporarily unavailable"
  Retry: Automatic retry with exponential backoff (1s, 2s, 4s)
  Escalation: If all retries fail, Page shows "Offline, try again later"
```

### 15.2 Implement retry logic

```ts
// lib/resilience/retry.ts

interface RetryOptions {
  maxAttempts: number
  initialDelayMs: number
  maxDelayMs: number
  backoffMultiplier: number
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {
    maxAttempts: 3,
    initialDelayMs: 1000,
    maxDelayMs: 30000,
    backoffMultiplier: 2
  }
): Promise<T> {
  let attempt = 0
  let delay = options.initialDelayMs
  
  while (attempt < options.maxAttempts) {
    try {
      return await fn()
    } catch (error) {
      attempt++
      
      if (attempt >= options.maxAttempts) {
        throw error
      }
      
      await sleep(delay)
      delay = Math.min(delay * options.backoffMultiplier, options.maxDelayMs)
    }
  }
}

// Usage:
const result = await withRetry(
  () => generateDocument(jobId),
  {
    maxAttempts: 3,
    initialDelayMs: 2000,
    maxDelayMs: 30000
  }
)
```

### 15.3 Dead-letter queue for async failures

```ts
// lib/resilience/dead-letter-queue.ts

interface DeadLetterItem {
  id: string
  event_type: string
  payload: object
  error: string
  attempt_count: number
  last_attempted_at: Date
  created_at: Date
}

export async function sendToDeadLetterQueue(
  eventType: string,
  payload: object,
  error: Error
) {
  await db.dead_letter_queue.insert({
    event_type: eventType,
    payload,
    error: error.message,
    attempt_count: 0,
    created_at: new Date()
  })
}

export async function processDeadLetterQueue() {
  // Run every 5 minutes via cron
  const items = await db.dead_letter_queue.findMany({
    attempt_count: { $lt: 5 },
    last_attempted_at: { $lt: 5.minutes.ago() }
  })
  
  for (const item of items) {
    try {
      // Re-process event
      await handleEvent({
        type: item.event_type,
        payload: item.payload
      })
      
      // Remove from queue
      await db.dead_letter_queue.delete(item.id)
    } catch (error) {
      // Increment attempt + log
      await db.dead_letter_queue.update(item.id, {
        attempt_count: item.attempt_count + 1,
        last_attempted_at: new Date()
      })
    }
  }
}
```

**Where to add:**
- Create: `lib/resilience/retry.ts` (exponential backoff)
- Create: `lib/resilience/dead-letter-queue.ts` (failed event storage)
- Create: `lib/resilience/circuit-breaker.ts` (fail-fast for broken services)
- Add: Cron job to process DLQ every 5 minutes
- Create DB table: `dead_letter_queue`

---

## SECTION 16: Trap States & Guards — Status ❌ MISSING

**What's needed (CRITICAL):**
- States where user can enter but not exit (find + block these)
- Guard conditions to prevent trap states

**HireWire Status:**
- ❌ Trap states not formally analyzed
- ⚠️ Example potential trap: Job in "generating" forever if API crashes
- ⚠️ Example potential trap: Evidence in "needs_judgment" with no path to confirm
- ❌ No timeout for long-running states
- ❌ No escape hatches documented

**What to build:** Trap state detection + guards

**Build items:**

### 16.1 Identify potential traps

```
POTENTIAL TRAP 1: Job stuck in "generating"
  Entry: User clicks "Generate", jobs.generation_status = "generating"
  Exit: API completes, returns success/failure
  Trap condition: If API crashes mid-stream, job stays "generating" forever
  
  GUARD: Timeout after 5 minutes
  - If generation_status still "generating" after 5min → auto-fail
  - Set to generation_status="failed", show retry option
  
  Implementation:
    CREATE INDEX ON jobs(generation_status, updated_at)
    
    -- Cron job (every 5 min):
    UPDATE jobs 
    SET generation_status = 'failed'
    WHERE generation_status = 'generating' 
    AND updated_at < NOW() - 5 minutes

POTENTIAL TRAP 2: Evidence in "needs_judgment" with no coach available
  Entry: Job created with requirements, but no evidence
  Exit: User confirms/skips each requirement via coach
  Trap condition: If user never opens coach drawer, stuck with "needs_judgment"
  
  GUARD: Show persistent UI hint
  - Show banner on job page: "3 requirements need proof. Open Coach?"
  - Allow manual skip: User can click "Skip this" to skip requirement
  
  Implementation:
    Add skip_requirement button on job detail page
    Update proof_decision = "skipped" when clicked

POTENTIAL TRAP 3: Application status never updates
  Entry: User applies for job, status = "pending"
  Exit: User updates status to "screening" → "interview" → "offer"
  Trap condition: If user forgets to update, stuck in "pending" forever
  
  GUARD: Prompt after 2 weeks
  - Send email: "Still pending? Update status or archive."
  - Auto-archive after 90 days of inactivity
  
  Implementation:
    Email job: "UPDATE applications SET status='archived' 
               WHERE status='pending' AND created_at < 90 days ago"

POTENTIAL TRAP 4: Session timeout but no warning
  Entry: User logged in, idle
  Exit: User interacts with page
  Trap condition: If timeout happens silently, user lost work
  
  GUARD: Warn before timeout
  - Show modal: "Your session expires in 2 minutes"
  - Allow 1-click extend
  - Save draft before timeout
  
  Implementation:
    Countdown modal at T - 2 minutes
    Auto-save drafts to sessionStorage

POTENTIAL TRAP 5: Subscription canceled but feature usage continues
  Entry: User cancels subscription, plan_type = "free"
  Exit: User acknowledges free tier limitations
  Trap condition: If user tries to use pro features, confused error
  
  GUARD: Downgrade warning + feature disable
  - Show warning: "You're downgrading to free. You can't generate more than X documents."
  - Disable pro-only buttons
  - Show upgrade button on every pro feature
  
  Implementation:
    Add PRO_ONLY flag to every pro feature
    Check plan_type before showing button
```

### 16.2 Timeout guards for long-running states

```ts
// lib/guards/state-timeouts.ts

const STATE_TIMEOUTS = {
  'job:generating': 5 * 60 * 1000,        // 5 minutes
  'evidence:validating': 2 * 60 * 1000,   // 2 minutes
  'coach:session': 60 * 60 * 1000,        // 1 hour
  'user:session': 60 * 60 * 1000,         // 1 hour
}

export async function enforceStateTimeouts() {
  // Cron job: runs every 5 minutes
  
  // Find jobs stuck in "generating"
  const stuckJobs = await db.jobs.findMany({
    generation_status: 'generating',
    updated_at: {
      $lt: new Date(Date.now() - STATE_TIMEOUTS['job:generating'])
    }
  })
  
  for (const job of stuckJobs) {
    await db.jobs.update(job.id, {
      generation_status: 'failed',
      generation_error: 'Generation timed out'
    })
    
    emitDomainEvent({
      type: 'job.generation_timeout',
      job_id: job.id
    })
  }
  
  // Similar for other states...
}
```

### 16.3 Escape hatches (manual override)

```ts
// lib/guards/manual-overrides.ts

export async function adminSkipRequirement(
  jobId: string,
  requirementId: string,
  reason: string
) {
  // Admin can manually skip a stuck requirement
  
  await db.job_requirements.update(requirementId, {
    proof_decision: 'skipped_by_admin',
    skip_reason: reason
  })
  
  // Recalculate readiness
  await evaluateJobReadiness(jobId)
  
  // Log for audit
  await db.audit_events.insert({
    event_type: 'admin.skip_requirement',
    user_id: adminUserId,
    job_id: jobId,
    reason: reason
  })
}

export async function adminResetJobGeneration(jobId: string) {
  // Clear stuck generation state
  
  await db.jobs.update(jobId, {
    generation_status: 'ready',
    generation_error: null
  })
  
  emitDomainEvent({
    type: 'job.generation_reset',
    job_id: jobId
  })
}
```

**Where to add:**
- Create: `lib/guards/trap-state-detector.ts` (find traps)
- Create: `lib/guards/state-timeouts.ts` (enforce timeouts via cron)
- Create: `lib/guards/manual-overrides.ts` (escape hatches)
- Add cron job: `/api/cron/enforce-state-timeouts` (runs every 5 min)
- Add admin actions: `/admin/manual-overrides` (debug page)

---

## SECTION 17: Ship Gate Checklist — Status ❌ MISSING

**What's needed:**
- Pre-launch checklist with verification + receipts

**HireWire Status:**
- ❌ No formal ship checklist
- ❌ No verification receipts documented

**What to build:** Ship gate

**Build items:**

### 17.1 Pre-launch checklist

```markdown
# Ship Gate Checklist

## Authentication (P0 - BLOCKER)
- [ ] Password login works + session persists
  - Receipt: Test account login + refresh page
- [ ] Session timeout works after 60min
  - Receipt: Timestamp session creation + verify logout
- [ ] Logout clears session
  - Receipt: Verify auth.users session cleared

## Critical Wiring (P1)
- [ ] Evidence import works (LinkedIn, resume, manual)
  - Receipt: Import 3 sources, verify all in DB
- [ ] Job analysis works
  - Receipt: Parse job URL, verify job_analyses row created
- [ ] Evidence mapping works
  - Receipt: Match evidence to requirement, verify job_scores updated
- [ ] Document generation works
  - Receipt: Generate resume, verify documents table + PDF valid
- [ ] AI Coach works (streaming, tool calling, save)
  - Receipt: Full conversation flow, verify evidence confirmed
- [ ] Application tracking works
  - Receipt: Apply to job, verify applications table + /applications shows it
- [ ] Readiness evaluation works
  - Receipt: Verify all job states update correctly

## Safety Gates (P1)
- [ ] Injection detection active
  - Receipt: Submit malicious prompt, verify blocked
- [ ] PII detection active
  - Receipt: Submit email/SSN, verify masked
- [ ] Content moderation active
  - Receipt: Submit inappropriate text, verify flagged
- [ ] Quality gates active
  - Receipt: Generate low-quality bullet, verify flagged

## Security (P1)
- [ ] RLS policies enforced on all tables
  - Receipt: Attempt cross-user data access, verify denied
- [ ] User data isolation complete
  - Receipt: Verify user1 can't see user2 jobs
- [ ] Stripe webhook signature verification
  - Receipt: Verify webhook with wrong signature rejected

## Billing (P1)
- [ ] Plan limits enforced
  - Receipt: Try to create 6th job on free tier, verify blocked
- [ ] Usage tracking works
  - Receipt: Verify jobs_this_month increments
- [ ] Stripe checkout works
  - Receipt: Complete payment flow, verify user upgraded

## Observability (P2)
- [ ] Audit trail complete
  - Receipt: Verify major actions logged to audit_events
- [ ] Correlation IDs working
  - Receipt: Verify all requests have X-Correlation-ID
- [ ] Error logging working
  - Receipt: Trigger error, verify logged + searchable

## Polish (P2)
- [ ] Error boundaries on all pages
  - Receipt: Trigger error on each page, verify caught
- [ ] Loading states showing
  - Receipt: Verify spinners during async operations
- [ ] Empty states showing
  - Receipt: Verify message when no jobs/evidence
- [ ] Mobile responsive
  - Receipt: Test on mobile (375px width)

## Performance (P3)
- [ ] LCP < 2.5s
  - Receipt: WebVitals measurement
- [ ] FID < 100ms
  - Receipt: WebVitals measurement
- [ ] CLS < 0.1
  - Receipt: WebVitals measurement

## Launch Readiness
- [ ] All P0 checks: PASS
- [ ] All P1 checks: PASS
- [ ] All P2 checks: PASS
- [ ] No critical bugs found
- [ ] No security vulnerabilities
- [ ] Performance acceptable
- [ ] Documentation complete
- [ ] Team trained

Status: _______________
Ship Date: _______________
Sign-off: _______________
```

### 17.2 Verification receipts

```ts
// lib/ship-gate/ship-gate-checklist.ts

interface ShipGateReceipt {
  checkName: string
  status: 'pass' | 'fail' | 'pending'
  testCommand: string
  result: object
  timestamp: Date
  verifier: string
}

export async function recordShipGateReceipt(
  checkName: string,
  testCommand: string,
  result: object,
  verifier: string
) {
  const receipt: ShipGateReceipt = {
    checkName,
    status: result.passed ? 'pass' : 'fail',
    testCommand,
    result,
    timestamp: new Date(),
    verifier
  }
  
  await db.ship_gate_receipts.insert(receipt)
  
  return receipt
}

// Usage:
const loginTest = await testPasswordLogin()
await recordShipGateReceipt(
  'Password login works',
  'npm run test:auth:login',
  loginTest,
  'v0@hirewire.io'
)
```

**Where to add:**
- Create: `/admin/ship-gate` page (checklist UI)
- Create: `lib/ship-gate/ship-gate-checklist.ts`
- Create: `lib/ship-gate/tests.ts` (automated verification)
- Create DB table: `ship_gate_receipts`

---

## SECTION 18: Change & Decision Log — Status ❌ MISSING

**What's needed:**
- Document all major decisions + changes
- Audit trail of product evolution
- Why things are the way they are

**HireWire Status:**
- ❌ No formal decision log
- ⚠️ Some decisions in CLAUDE.md but not systematized

**What to build:** Decision log

**Build items:**

### 18.1 Create decision log

```markdown
# HireWire — Decision & Change Log

## Decision 1: Readiness Evaluation Centralization
**Date:** [Date]
**Decision:** All readiness checks must go through `lib/readiness/evaluator.ts`
**Rationale:** Single source of truth, no duplicate logic, easier to test
**Impact:** All components/API routes that check readiness must use this function
**Status:** Implemented, verified in code

## Decision 2: Domain Events for State Cascades
**Date:** [Date]
**Decision:** Major state changes emit domain events, not direct DB updates
**Rationale:** Decoupled systems, easier to add features, audit trail
**Impact:** All mutations should emit events, event handlers process cascades
**Status:** Implemented, verify all state changes emit events

## Decision 3: Evidence Deduplication Strategy
**Date:** [Date]
**Decision:** Multiple sources can provide same evidence, use TruthSerum for dedup
**Rationale:** User uploads resume + imports LinkedIn = duplicate experience
**Impact:** All evidence saved to single table with source tracking
**Status:** Implemented, verify dedup logic in canonical-evidence.ts

## Decision 4: AI Coach Tool-Based Evidence Confirmation
**Date:** [Date]
**Decision:** Coach has tools (confirmProof, skipRequirement, etc) instead of UI buttons
**Rationale:** Coach controls flow, user confirms via tool, reduces UX ambiguity
**Impact:** Evidence only saved via tool execution, not direct form submission
**Status:** Implemented, verify all evidence flows through coach tools

## Decision 5: Generation Status vs Quality Passed (Two-Axis Gate)
**Date:** [Date]
**Decision:** Documents have both `generation_status` (process state) + `quality_passed` (verification state)
**Rationale:** Can generate low-quality resume (needs_review) or high-quality (ready)
**Impact:** Apply gate checks both axes, not just one
**Status:** Implemented, verify apply gate logic

## Change 1: Removed Direct Evidence Save API
**Date:** [Date]
**What Changed:** Removed POST /api/evidence/create endpoint
**Why:** Evidence should only be created via coach tools or import (no random manual saves)
**Impact:** All evidence creation now goes through coach or import endpoints
**Status:** Completed

## Change 2: Added Proof Decision Tracking
**Date:** [Date]
**What Changed:** Added `proof_decision` column to job_requirements
**Why:** Need to know which requirements have confirmed proofs vs still need judgment
**Impact:** All requirements now tracked individually, gates check per-requirement
**Status:** Completed

[Add more as they happen...]
```

### 18.2 Link decisions to code

```ts
// lib/decisions/decision-index.ts

interface Decision {
  id: string
  title: string
  date: Date
  rationale: string
  impact: string
  codeReferences: string[]  // File paths + line numbers
  status: 'active' | 'deprecated' | 'pending'
}

export const DECISIONS: Decision[] = [
  {
    id: 'readiness_centralization',
    title: 'Readiness Evaluation Centralization',
    date: new Date('2024-...'),
    rationale: 'Single source of truth',
    impact: 'All readiness checks must use lib/readiness/evaluator.ts',
    codeReferences: [
      'lib/readiness/evaluator.ts:evaluateReadiness()',
      'app/(dashboard)/jobs/[id]/page.tsx:34 (uses evaluator)',
      'app/api/jobs/[id]/apply/route.ts:45 (uses evaluator)'
    ],
    status: 'active'
  },
  // ... more decisions
]
```

**Where to add:**
- Create: `/admin/decisions` page (view decision log)
- Create: `lib/decisions/decision-index.ts`
- Create: `DECISIONS.md` in repo root (public record)
- Add: Decision ID references in code comments

---

## THE FOUR AUDITS — Status 🟡 PARTIAL

**What The Protocol requires:** Run 4 formal audits to find gaps

### Audit 1: Orphan Audit
**Question:** Are there any components/endpoints/pages not connected to the system?

**What to check:**
```
- Export every component in /components
- Search for usage of each component in pages + other components
- If ZERO usages found → ORPHAN

- Inventory every /api endpoint
- Search for calls to each endpoint in pages + client code
- If ZERO calls found → ORPHAN

- List all database tables
- Search for SELECT/INSERT/UPDATE on each table
- If ZERO calls found → ORPHAN

- List all lib modules
- Search for imports of each module
- If ZERO imports found → ORPHAN
```

**Action:** Run this audit, document findings

### Audit 2: Blank-Cell Audit
**Question:** Is every Atomic I/O contract complete (no blank cells)?

**What to check:**
```
- For each of 175 Atomic I/O contracts:
  ✓ User input defined?
  ✓ API endpoint specified?
  ✓ Request schema documented?
  ✓ Response schema documented?
  ✓ DB changes listed?
  ✓ Feedback specified?
  ✓ Error cases enumerated?
  ✓ Recovery path described?
```

**Action:** Create Atomic I/O table, fill in all cells

### Audit 3: Trap-State Audit
**Question:** Are there states user can enter but not exit?

**What to check:**
```
- For each state (job status, evidence status, doc status, etc):
  ✓ Entry condition clear?
  ✓ Exit condition clear?
  ✓ Can user get stuck? (timeout guard?)
  ✓ Is there an escape hatch? (admin override?)
```

**Action:** Document all states, identify + guard traps

### Audit 4: Fake-Complete Audit
**Question:** Are verified claims actually verified?

**What to check:**
```
- For each shipped feature:
  ✓ Does it actually work or just look good?
  ✓ Is there a test for it?
  ✓ Has it been used in production?
  ✓ Do error cases handle gracefully?
```

**Action:** Test each feature end-to-end, document results

---

## Summary Table: What to Build

| Section | Status | Effort | Priority | Files to Create |
|---------|--------|--------|----------|-----------------|
| 1-4 | ✅ Done | - | - | (already done) |
| 5: State Machines | ❌ Missing | 2-3 hrs | P1 | `lib/state-machines/*.ts` |
| 6-7: Entry/Exit | 🟡 Partial | 2 hrs | P1 | `lib/auth/session.ts`, docs |
| 8: Atomic I/O | ❌ Missing | 8-10 hrs | P0 | `lib/contracts/atomic-i-o-registry.ts` |
| 9: Triggers | 🟡 Partial | 4 hrs | P1 | `lib/triggers/*.ts` |
| 10: Hooks/Cascades | 🟡 Partial | 3 hrs | P1 | `lib/domain-events/cascade-registry.ts` |
| 11: Notifications | 🟡 Partial | 4 hrs | P2 | `lib/comms/notification-matrix.ts` |
| 12: Gates | 🟡 Partial | 3 hrs | P1 | `lib/gates/*.ts` |
| 13: Controls | ❌ Missing | 2 hrs | P2 | `lib/features/feature-flags.ts` |
| 14: Receipts | 🟡 Partial | 4 hrs | P2 | `lib/observability/*.ts` |
| 15: Failure/Recovery | 🟡 Partial | 5 hrs | P1 | `lib/resilience/*.ts` |
| 16: Trap States | ❌ Missing | 4 hrs | P1 | `lib/guards/*.ts` |
| 17: Ship Gate | ❌ Missing | 3 hrs | P0 | `/admin/ship-gate`, docs |
| 18: Decision Log | ❌ Missing | 1 hr | P3 | `/admin/decisions`, docs |
| 4 Audits | ❌ Missing | 6-8 hrs | P1 | Audit reports |

**Total Effort:** ~55-60 hours  
**Can be parallelized:** Yes (sections are mostly independent)

---

## Recommended Build Order

**P0 (Today - Blocking Ship):**
1. Section 8: Atomic I/O Registry (formalize all interactions)
2. Section 17: Ship Gate Checklist (verify readiness)
3. Run 4 Audits (find gaps)

**P1 (This Week - Before Launch):**
4. Section 5: State Machines (prevent traps)
5. Section 16: Trap State Guards (enforce timeouts)
6. Section 15: Failure/Recovery (resilience)
7. Section 9: Trigger Registry (document all inputs)
8. Section 10: Hook Registry (formalize cascades)

**P2 (Next Week - Polish):**
9. Section 11: Notification Matrix (complete feedback)
10. Section 14: Receipts/Observability (debug layer)
11. Section 13: Controls (feature flags)
12. Section 7: Exit Points (clean shutdown)

**P3 (Later - Knowledge Base):**
13. Section 18: Decision Log (why it's this way)

---

## Next Steps

Ready to go through any specific section in detail. Which one should we start with?

Recommend starting with **Section 8 (Atomic I/O Registry)** since it's the heart of The Protocol and will help identify what else is missing.
