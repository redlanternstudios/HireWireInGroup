import type { VoiceProfile } from './voice-types'

export type VoiceMode = 'preserve_original' | 'polish_lightly' | 'professional_upgrade'

export function selectVoiceMode(profile: VoiceProfile): VoiceMode {
  if (
    profile.quality.grammarRisk === 'high' ||
    profile.quality.spellingRisk === 'high' ||
    profile.quality.clarityRisk === 'high'
  ) {
    return 'professional_upgrade'
  }
  if (
    profile.quality.grammarRisk === 'medium' ||
    profile.quality.clarityRisk === 'medium'
  ) {
    return 'polish_lightly'
  }
  return 'preserve_original'
}
