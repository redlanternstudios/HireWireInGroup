// Render and resolve communication messages for display or sending

import type { CommunicationMessage } from './types'

export function renderMessage(message: CommunicationMessage, variables?: Record<string, string | number>): CommunicationMessage {
  // Simple variable interpolation for subject/body
  let subject = message.subject || ''
  let body = message.body
  if (variables) {
    for (const [key, value] of Object.entries(variables)) {
      subject = subject.replace(new RegExp(`{{${key}}}`, 'g'), String(value))
      body = body.replace(new RegExp(`{{${key}}}`, 'g'), String(value))
    }
  }
  return { ...message, subject, body }
}
