/**
 * Onboarding State Machine
 *
 * Single source of truth for what "onboarded" means and how a user moves through it.
 * Constitution §6.3 protects the canonical onboarding route; this module protects its logic.
 *
 * Steps are ordered. A user is "complete" when all required steps are done.
 * Optional steps may be skipped without blocking completion.
 */

// ============================================================================
// STEP DEFINITIONS
// ============================================================================

export const ONBOARDING_STEPS = [
  "profile_created",     // Full name and headline saved
  "resume_uploaded",     // At least one resume parsed and stored
  "evidence_added",      // At least one evidence item in the library
  "path_selected",       // User has indicated their job search focus
] as const

export type OnboardingStep = typeof ONBOARDING_STEPS[number]

const OPTIONAL_STEPS = new Set<OnboardingStep>([
  "evidence_added",  // Valuable but not blocking — can add later
])

const STEP_ORDER: Record<OnboardingStep, number> = {
  profile_created: 0,
  resume_uploaded: 1,
  evidence_added: 2,
  path_selected: 3,
}

// ============================================================================
// STATE TYPE
// ============================================================================

export interface OnboardingState {
  completedSteps: Set<OnboardingStep>
  isComplete: boolean
}

export interface OnboardingProgress {
  completedSteps: OnboardingStep[]
  pendingSteps: OnboardingStep[]
  nextStep: OnboardingStep | null
  percentComplete: number
  isComplete: boolean
}

// ============================================================================
// CORE FUNCTIONS
// ============================================================================

/**
 * Build onboarding state from the raw data available on a user profile.
 * All inputs are optional — missing data means the step is not complete.
 */
export function deriveOnboardingState(params: {
  hasFullName: boolean
  hasResumeUploaded: boolean
  evidenceItemCount: number
  hasSelectedPath: boolean
  onboardingCompleteFlag?: boolean
}): OnboardingState {
  const { hasFullName, hasResumeUploaded, evidenceItemCount, hasSelectedPath, onboardingCompleteFlag } = params

  if (onboardingCompleteFlag === true) {
    return {
      completedSteps: new Set(ONBOARDING_STEPS),
      isComplete: true,
    }
  }

  const completedSteps = new Set<OnboardingStep>()

  if (hasFullName) completedSteps.add("profile_created")
  if (hasResumeUploaded) completedSteps.add("resume_uploaded")
  if (evidenceItemCount > 0) completedSteps.add("evidence_added")
  if (hasSelectedPath) completedSteps.add("path_selected")

  const isComplete = isOnboardingComplete(completedSteps)

  return { completedSteps, isComplete }
}

/**
 * Determine if all required (non-optional) steps are done.
 */
export function isOnboardingComplete(completedSteps: Set<OnboardingStep>): boolean {
  return ONBOARDING_STEPS.filter(step => !OPTIONAL_STEPS.has(step)).every(step =>
    completedSteps.has(step)
  )
}

/**
 * Get the next incomplete required step.
 */
export function getNextOnboardingStep(completedSteps: Set<OnboardingStep>): OnboardingStep | null {
  const pending = ONBOARDING_STEPS.filter(step => !completedSteps.has(step))
  if (pending.length === 0) return null
  return pending.sort((a, b) => STEP_ORDER[a] - STEP_ORDER[b])[0]
}

/**
 * Compute full progress report suitable for rendering a progress bar or checklist.
 */
export function getOnboardingProgress(state: OnboardingState): OnboardingProgress {
  const completedSteps = Array.from(state.completedSteps)
  const pendingSteps = ONBOARDING_STEPS.filter(s => !state.completedSteps.has(s))
  const nextStep = getNextOnboardingStep(state.completedSteps)
  const percentComplete = Math.round((state.completedSteps.size / ONBOARDING_STEPS.length) * 100)

  return {
    completedSteps,
    pendingSteps,
    nextStep,
    percentComplete,
    isComplete: state.isComplete,
  }
}

/**
 * Returns true if a specific step is complete.
 */
export function hasCompletedStep(state: OnboardingState, step: OnboardingStep): boolean {
  return state.completedSteps.has(step)
}

// ============================================================================
// UI DISPLAY CONFIG
// ============================================================================

export const ONBOARDING_STEP_CONFIG: Record<
  OnboardingStep,
  { label: string; description: string; isOptional: boolean }
> = {
  profile_created: {
    label: "Create your profile",
    description: "Add your name, headline, and summary",
    isOptional: false,
  },
  resume_uploaded: {
    label: "Upload your resume",
    description: "Parse your existing resume to seed your evidence library",
    isOptional: false,
  },
  evidence_added: {
    label: "Add evidence",
    description: "Document your work, projects, and achievements",
    isOptional: true,
  },
  path_selected: {
    label: "Set your job target",
    description: "Tell HireWire what roles and companies you're targeting",
    isOptional: false,
  },
}
