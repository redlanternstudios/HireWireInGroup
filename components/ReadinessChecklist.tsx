import Link from "next/link"
import { CheckCircle2, Sparkles, XCircle } from "lucide-react"

import type {
  ReadinessChecklistState,
  ReadinessNextAction,
} from "@/lib/readiness/evaluator"
import { Button } from "@/components/ui/button"

type ReadinessChecklistProps = {
  checklist: ReadinessChecklistState
  jobId?: string
  nextAction?: ReadinessNextAction | null
}

function Item({ label, value }: { label: string; value: boolean }) {
  const Icon = value ? CheckCircle2 : XCircle

  return (
    <div className="flex items-center justify-between py-1.5 text-sm">
      <span className="text-foreground">{label}</span>
      <Icon
        aria-label={value ? "Complete" : "Blocked"}
        className={value ? "h-4 w-4 text-emerald-600" : "h-4 w-4 text-rose-600"}
      />
    </div>
  )
}

export default function ReadinessChecklist({
  checklist,
  jobId,
  nextAction,
}: ReadinessChecklistProps) {
  const shouldShowRepairAction =
    jobId && nextAction && (!checklist.evidence || !checklist.coach)

  return (
    <div className="hw-card p-4">
      <h3 className="font-semibold mb-2 text-sm">Readiness</h3>

      <Item label="Resume" value={checklist.resume} />
      <Item label="Cover Letter" value={checklist.coverLetter} />
      <Item label="Evidence Match" value={checklist.evidence} />
      <Item label="Coach Step" value={checklist.coach} />
      <Item label="Quality Check" value={checklist.quality} />
      {shouldShowRepairAction && (
        <div className="mt-3 border-t border-border pt-3">
          <Link href={nextAction.href}>
            <Button size="sm" variant="outline" className="w-full gap-1.5 text-xs">
              <Sparkles className="h-3.5 w-3.5" />
              {nextAction.label}
            </Button>
          </Link>
        </div>
      )}
    </div>
  )
}
