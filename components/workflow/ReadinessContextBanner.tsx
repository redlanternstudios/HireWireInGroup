import Link from "next/link"

import { Alert, AlertDescription } from "@/components/ui/alert"
import type {
  ReadinessNextAction,
  ReadinessStage,
} from "@/lib/readiness/evaluator"
import { cn } from "@/lib/utils"

interface ReadinessContextBannerProps {
  stage: ReadinessStage
  blockedReasons: string[]
  nextAction: ReadinessNextAction | null
  className?: string
}

export function ReadinessContextBanner({
  stage,
  blockedReasons,
  nextAction,
  className,
}: ReadinessContextBannerProps) {
  // renders null when no blockers
  if (blockedReasons.length === 0) return null

  const firstReason = blockedReasons[0]
  if (!firstReason) return null

  return (
    <Alert
      variant="destructive"
      data-readiness-stage={stage}
      className={cn("py-2", className)}
    >
      <AlertDescription className="flex flex-col gap-1 text-xs sm:flex-row sm:items-center sm:justify-between">
        <span>{firstReason}</span>
        {nextAction ? (
          <Link
            href={nextAction.href}
            className="font-semibold text-destructive underline-offset-2 hover:underline"
          >
            {nextAction.label}
          </Link>
        ) : null}
      </AlertDescription>
    </Alert>
  )
}
