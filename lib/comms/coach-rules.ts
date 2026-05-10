// Coach response modes and rules

export type CoachResponseMode =
  | 'QUICK_ANSWER'
  | 'STEP_BY_STEP'
  | 'STRATEGIC_REVIEW'
  | 'PIPELINE_AUDIT'
  | 'DOCUMENT_REVIEW'
  | 'INTERVIEW_PREP'
  | 'FOLLOW_UP_DRAFT'
  | 'ERROR_RECOVERY'
  | 'MOTIVATIONAL_RESET'
  | 'PACKAGE_BUILDER_GUIDANCE'

export const coachResponseRules: Record<CoachResponseMode, { description: string; maxLength: number }> = {
  QUICK_ANSWER: {
    description: 'Concise, actionable answer to a specific question.',
    maxLength: 400,
  },
  STEP_BY_STEP: {
    description: 'Break down a process or answer into clear steps.',
    maxLength: 600,
  },
  STRATEGIC_REVIEW: {
    description: 'High-level review with recommendations.',
    maxLength: 700,
  },
  PIPELINE_AUDIT: {
    description: 'Audit the user’s job pipeline and suggest improvements.',
    maxLength: 700,
  },
  DOCUMENT_REVIEW: {
    description: 'Review resume or cover letter and provide feedback.',
    maxLength: 700,
  },
  INTERVIEW_PREP: {
    description: 'Prepare the user for interviews with tips and practice questions.',
    maxLength: 700,
  },
  FOLLOW_UP_DRAFT: {
    description: 'Draft a follow-up message for applications or interviews.',
    maxLength: 400,
  },
  ERROR_RECOVERY: {
    description: 'Help the user recover from an error or blocked state.',
    maxLength: 400,
  },
  MOTIVATIONAL_RESET: {
    description: 'Encourage and reset user motivation.',
    maxLength: 300,
  },
  PACKAGE_BUILDER_GUIDANCE: {
    description: 'Guide the user through the application package builder.',
    maxLength: 600,
  },
}
