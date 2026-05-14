"use client"

import { useState } from "react"
import VoiceIntegrityCard from "./VoiceIntegrityCard"
import type { VoiceProfile, VoiceDriftResult } from "@/lib/voice/voice-types"

interface VoiceIntegritySectionProps {
  mode: string | null
  profile: VoiceProfile | null
  drift: VoiceDriftResult | null
}

export default function VoiceIntegritySection({ mode, profile, drift }: VoiceIntegritySectionProps) {
  const [dismissed, setDismissed] = useState(false)

  if (!mode || dismissed) return null

  const status: "passed" | "needs_review" | "warning" =
    !drift
      ? "warning"
      : drift.passed
        ? "passed"
        : drift.driftLevel === "high"
          ? "needs_review"
          : "warning"

  return (
    <VoiceIntegrityCard
      mode={mode}
      profile={profile}
      drift={drift}
      status={status}
      onKeep={() => setDismissed(true)}
    />
  )
}
