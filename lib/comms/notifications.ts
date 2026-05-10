// Notification templates and logic

import { CommunicationMessage } from './types'

export const notificationTemplates: Record<string, CommunicationMessage> = {
  'application.submitted': {
    id: 'application.submitted',
    domain: 'NOTIFICATIONS',
    audience: 'USER',
    intent: 'INFORM',
    channel: 'in_app',
    tone: 'calm',
    subject: 'Application submitted',
    body: 'Your application for {{roleTitle}} at {{companyName}} has been submitted.',
    createdAt: new Date().toISOString(),
  },
  // Add more notification templates as needed
}
