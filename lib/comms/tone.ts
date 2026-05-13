// Tone helpers for communication messages

import type { Tone } from './types'

export function getToneDescription(tone: Tone): string {
  switch (tone) {
    case 'calm': return 'Reassuring and steady.'
    case 'direct': return 'Clear and to the point.'
    case 'strategic': return 'Focused on long-term goals.'
    case 'encouraging': return 'Supportive and positive.'
    case 'formal': return 'Professional and respectful.'
    case 'warm': return 'Friendly and approachable.'
    case 'urgent': return 'Requires immediate attention.'
    case 'neutral': return 'Objective and factual.'
    default: return ''
  }
}
