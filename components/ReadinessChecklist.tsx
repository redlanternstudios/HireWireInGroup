import { CheckCircle2, XCircle } from "lucide-react"

import type { ReadinessChecklistState } from "@/lib/readiness/evaluator"

type ReadinessChecklistProps = {
  checklist: ReadinessChecklistState
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

export default function ReadinessChecklist({ checklist }: ReadinessChecklistProps) {
  return (
    <div className="hw-card p-4">
      <h3 className="font-semibold mb-2 text-sm">Readiness</h3>

      <Item label="Resume" value={checklist.resume} />
      <Item label="Cover Letter" value={checklist.coverLetter} />
      <Item label="Evidence Match" value={checklist.evidence} />
      <Item label="Quality Check" value={checklist.quality} />
    </div>
  )
}
