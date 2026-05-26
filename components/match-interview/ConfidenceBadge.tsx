"use client"

import { cn } from "@/lib/utils"
import { CONFIDENCE_CONFIG, type ConfidenceLevel } from "./types"

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
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold",
        config.className,
        className,
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full shrink-0", config.dotClass)} />
      {config.label}
    </span>
  )
}
