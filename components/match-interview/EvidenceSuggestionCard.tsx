"use client"

import { FileText, CheckCircle, PlusCircle, XCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import type { EvidenceAction, SuggestedEvidence } from "./types"

const RELEVANCE_STYLE: Record<string, string> = {
  high: "border-emerald-200 bg-emerald-50/50",
  medium: "border-amber-200 bg-amber-50/50",
  low: "border-border bg-background",
}

const ACTIONS: {
  key: EvidenceAction
  label: string
  icon: React.ElementType
  className: string
}[] = [
  {
    key: "use",
    label: "Use this",
    icon: CheckCircle,
    className:
      "text-emerald-700 border-emerald-200 bg-emerald-50 hover:bg-emerald-100",
  },
  {
    key: "add_detail",
    label: "Add detail",
    icon: PlusCircle,
    className:
      "text-primary border-primary/20 bg-primary/5 hover:bg-primary/10",
  },
  {
    key: "not_relevant",
    label: "Not relevant",
    icon: XCircle,
    className:
      "text-muted-foreground border-border bg-background hover:bg-muted/60",
  },
]

export function EvidenceSuggestionCard({
  evidence,
  onAction,
  disabled = false,
  className,
}: {
  evidence: SuggestedEvidence
  onAction: (action: EvidenceAction, evidence: SuggestedEvidence) => void
  disabled?: boolean
  className?: string
}) {
  const relevanceStyle = RELEVANCE_STYLE[evidence.relevance ?? "low"]

  return (
    <div
      className={cn(
        "ml-9 rounded-xl border p-3 shadow-sm transition-colors",
        relevanceStyle,
        className,
      )}
    >
      <div className="flex items-start gap-2.5">
        <FileText className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold text-foreground leading-snug">
            {evidence.title}
          </p>
          {evidence.snippet && (
            <p className="mt-0.5 text-[11px] text-muted-foreground leading-relaxed line-clamp-2">
              {evidence.snippet}
            </p>
          )}
        </div>
        {evidence.relevance === "high" && (
          <span className="shrink-0 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-700">
            Relevant
          </span>
        )}
      </div>

      <div className="mt-2.5 flex items-center gap-2 flex-wrap">
        {ACTIONS.map(({ key, label, icon: Icon, className: cls }) => (
          <button
            key={key}
            onClick={() => onAction(key, evidence)}
            disabled={disabled}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-[11px] font-semibold transition-colors",
              "disabled:pointer-events-none disabled:opacity-40",
              cls,
            )}
          >
            <Icon className="h-3 w-3" />
            {label}
          </button>
        ))}
      </div>
    </div>
  )
}
