"use client"

import React from "react"
import type { VoiceProfile, VoiceDriftResult } from "@/lib/voice/voice-types"

export default function VoiceIntegrityCard({
  mode,
  profile,
  drift,
  status,
  onKeep,
  onRegenerateLess,
  onRegenerateMore,
  onEdit,
}: {
  mode: string
  profile: VoiceProfile | null
  drift: VoiceDriftResult | null
  status: "passed" | "needs_review" | "warning"
  onKeep?: () => void
  onRegenerateLess?: () => void
  onRegenerateMore?: () => void
  onEdit?: () => void
}) {
  return (
    <div className="hw-card p-4 space-y-3">
      <h3 className="font-semibold text-sm mb-1">Voice Integrity</h3>
      <div className="text-xs text-muted-foreground mb-1">Mode: <span className="text-foreground font-medium">{mode}</span></div>
      {profile && (
        <div className="text-xs mb-1">
          <div>Detected tone: <span className="font-medium">{profile.tone.primary}</span></div>
          <div>Formality: <span className="font-medium">{profile.formality}</span></div>
        </div>
      )}
      {drift && (
        <div className="text-xs mb-1">
          <div>Status: <span className={drift.passed ? "text-emerald-600" : "text-rose-600"}>{drift.passed ? "Passed" : "Needs review"}</span></div>
          <div>Drift: <span className="font-medium">{drift.driftLevel}</span></div>
          {drift.detectedIssues.length > 0 && (
            <div className="mt-1 text-rose-600">
              <strong>Issues:</strong>
              <ul className="list-disc ml-4">
                {drift.detectedIssues.map((issue) => (
                  <li key={issue}>{issue.replace(/_/g, " ")}</li>
                ))}
              </ul>
            </div>
          )}
          {drift.warnings.length > 0 && (
            <div className="mt-1 text-amber-600">
              <strong>Warnings:</strong>
              <ul className="list-disc ml-4">
                {drift.warnings.map((w) => (
                  <li key={w}>{w}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
      <div className="flex gap-2 mt-2">
        {onKeep && <button className="hw-btn-primary flex-1" onClick={onKeep}>Keep this voice</button>}
        {onRegenerateLess && <button className="hw-btn-primary flex-1 bg-muted text-foreground border" onClick={onRegenerateLess}>Regenerate with less polish</button>}
        {onRegenerateMore && <button className="hw-btn-primary flex-1 bg-muted text-foreground border" onClick={onRegenerateMore}>Regenerate with more polish</button>}
        {onEdit && <button className="hw-btn-primary flex-1 bg-muted text-foreground border" onClick={onEdit}>Edit manually</button>}
      </div>
    </div>
  )
}
