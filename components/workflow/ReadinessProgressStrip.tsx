import { Check } from "lucide-react"
import { cn } from "@/lib/utils"

/**
 * Replacement for the legacy WorkflowProgress strip on the job detail page.
 *
 * Pure display component. It maps the canonical readiness `displayState`
 * (produced by lib/readiness/evaluator.ts) onto a 5-step journey and renders a
 * horizontal progress strip. No backend calls, no routing, no coupling to the
 * evaluator module — it accepts the state as a plain string prop so it can be
 * dropped in without import cycles.
 */

type StepKey = "analyze" | "prove_fit" | "generate" | "review" | "apply"

const STEPS: { key: StepKey; label: string }[] = [
  { key: "analyze", label: "Analyze" },
  { key: "prove_fit", label: "Prove Fit" },
  { key: "generate", label: "Generate" },
  { key: "review", label: "Review" },
  { key: "apply", label: "Apply" },
]

/** Which step is "active" (in progress) for each readiness display state. */
const ACTIVE_STEP_INDEX: Record<string, number> = {
  analyze_needed: 0,
  evidence_needed: 1,
  coach_needed: 1,
  ready_to_generate: 2,
  package_review: 3,
  ready_to_apply: 4,
}

/** Post-pipeline states render a status badge instead of the live strip. */
const POST_PIPELINE: Record<string, { label: string; className: string }> = {
  applied: { label: "Applied", className: "bg-blue-50 text-blue-700 border-blue-200" },
  interviewing: { label: "Interviewing", className: "bg-indigo-50 text-indigo-700 border-indigo-200" },
  offered: { label: "Offered", className: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  rejected: { label: "Closed", className: "bg-rose-50 text-rose-600 border-rose-200" },
  archived: { label: "Archived", className: "bg-stone-100 text-stone-500 border-stone-200" },
}

export function ReadinessProgressStrip({
  displayState,
  displayLabel,
}: {
  displayState: string
  displayLabel: string
}) {
  const post = POST_PIPELINE[displayState]

  // Applied / interviewing / offered / rejected / archived: the 5-step journey
  // is complete. Show the final step as done plus an outcome badge.
  if (post) {
    return (
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500">
            <Check className="h-3 w-3 text-white" strokeWidth={3} />
          </div>
          <span className="text-xs font-medium text-emerald-600">Pipeline complete</span>
        </div>
        <span
          className={cn(
            "shrink-0 rounded-full border px-2.5 py-0.5 text-[10px] font-semibold",
            post.className,
          )}
        >
          {displayLabel || post.label}
        </span>
      </div>
    )
  }

  const activeIndex = ACTIVE_STEP_INDEX[displayState] ?? 0

  return (
    <div className="flex items-center gap-0" role="list" aria-label="Application readiness progress">
      {STEPS.map((step, i) => {
        const done = i < activeIndex
        const active = i === activeIndex
        const isLast = i === STEPS.length - 1
        return (
          <div key={step.key} className="flex flex-1 items-center" role="listitem">
            <div className="flex flex-1 flex-col items-center gap-1.5">
              <div className="flex w-full items-center">
                {/* left connector */}
                <div
                  className={cn(
                    "h-0.5 flex-1 rounded-full",
                    i === 0 ? "opacity-0" : done || active ? "bg-emerald-500" : "bg-border",
                  )}
                />
                {/* node */}
                <div
                  className={cn(
                    "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-[10px] font-bold tabular-nums transition-colors",
                    done && "border-emerald-500 bg-emerald-500 text-white",
                    active && "border-primary bg-primary/10 text-primary ring-2 ring-primary/20",
                    !done && !active && "border-border bg-background text-muted-foreground/50",
                  )}
                  aria-current={active ? "step" : undefined}
                >
                  {done ? <Check className="h-3 w-3" strokeWidth={3} /> : i + 1}
                </div>
                {/* right connector */}
                <div
                  className={cn(
                    "h-0.5 flex-1 rounded-full",
                    isLast ? "opacity-0" : done ? "bg-emerald-500" : "bg-border",
                  )}
                />
              </div>
              <span
                className={cn(
                  "hidden text-center text-[9px] font-medium uppercase leading-tight tracking-wide sm:block",
                  done && "text-emerald-600",
                  active && "text-primary",
                  !done && !active && "text-muted-foreground/50",
                )}
              >
                {step.label}
              </span>
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default ReadinessProgressStrip
