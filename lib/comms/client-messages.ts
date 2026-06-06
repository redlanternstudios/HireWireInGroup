// Client-facing system messages and UI copy

import { COMMS_REGISTRY } from './registry'
import { renderMessage } from './render'

export function getClientMessage(key: string, variables?: Record<string, string | number>) {
  const template = COMMS_REGISTRY[key]
  if (!template) return null
  return renderMessage(template, variables)
}
