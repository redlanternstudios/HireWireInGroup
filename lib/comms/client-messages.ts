// Client-facing system messages and UI copy

import { commsRegistry } from './registry'
import { renderMessage } from './render'

export function getClientMessage(key: string, variables?: Record<string, string | number>) {
  const template = commsRegistry[key]
  if (!template) return null
  return renderMessage(template, variables)
}
