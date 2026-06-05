"use client"

import { cn } from "@/lib/utils"
import { CONFIDENCE_CONFIG, type ConfidenceLevel } from "./types"

const PROOF_BADGE_CLASS: Record<ConfidenceLevel, string> = {
  strong: "hw-badge-verified",
  partial: "hw-badge-inferred",
  weak: "hw-badge-inferred",
  missing: "hw-badge-unsupported",
  needs_review: "hw-badge-pending",
}

export function ConfidenceBadge({
  level,
  className,
}: {
  level: ConfidenceLevel
  className?: string
}) {
  const config = CONFIDENCE_CONFIG[level]
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5",
        PROOF_BADGE_CLASS[level] ?? config.className,
        className,
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full shrink-0", config.dotClass)} />
      {config.label}
    </span>
  )
}
