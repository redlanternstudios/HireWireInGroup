import type { VoiceDriftResult } from "@/lib/voice/voice-types"

export function isVoiceIntegrityPassed(drift: VoiceDriftResult | null): boolean {
  // null means the check hasn't run yet — don't block on missing data
  if (!drift) return true
  if (drift.driftLevel === "high") return false
  if (drift.driftLevel === "medium") return drift.passed
  return true
}

export function getVoiceBlockedReason(drift: VoiceDriftResult | null): string | null {
  if (!drift) return null
  if (drift.driftLevel === "high") return "Generated package does not preserve your professional voice"
  if (drift.driftLevel === "medium" && !drift.passed) return "Voice drift detected: review or regenerate"
  return null
}
