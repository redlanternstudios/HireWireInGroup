// External communication templates (recruiter, referral, follow up, etc.)

import type { CommunicationMessage } from './types'

export const externalTemplates: Record<string, CommunicationMessage> = {
  RECRUITER_INTRO: {
    id: 'RECRUITER_INTRO',
    domain: 'EMAIL_CAREER_OUTREACH',
    audience: 'RECRUITER',
    intent: 'SEND_EXTERNAL',
    channel: 'external_email',
    tone: 'formal',
    subject: 'Introduction: {{candidateName}} for {{roleTitle}}',
    body: 'Hello {{recruiterName}},\n\nI am reaching out to express interest in the {{roleTitle}} position at {{companyName}}. Based on my background in {{industry}}, I believe I am strongly aligned with the requirements. I would welcome the opportunity to discuss further.\n\nBest,\n{{candidateName}}',
    requiresApproval: true,
    isDraft: true,
    createdAt: new Date().toISOString(),
  },
  // Add more external templates as needed
}
