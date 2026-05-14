"use client"

import { useState } from "react"
import {
  Phone,
  XCircle,
  Ghost,
  Calendar,
  CheckCircle2,
  Gift,
  ThumbsUp,
  ThumbsDown,
  LogOut,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  AlertTriangle,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

// ─── Types ────────────────────────────────────────────────────────────────────

type OutcomeValue =
  | "callback"
  | "rejection"
  | "ghosted"
  | "interview_scheduled"
  | "interview_completed"
  | "offer_received"
  | "offer_accepted"
  | "offer_declined"
  | "application_withdrawn"

interface OutcomeOption {
  value: OutcomeValue
  label: string
  icon: React.ElementType
  color: string
  description: string
}

const OUTCOME_OPTIONS: OutcomeOption[] = [
  {
    value: "callback",
    label: "Got a callback",
    icon: Phone,
    color: "text-emerald-700 bg-emerald-50 border-emerald-200 hover:bg-emerald-100",
    description: "Recruiter or hiring manager reached out",
  },
  {
    value: "interview_scheduled",
    label: "Interview scheduled",
    icon: Calendar,
    color: "text-blue-700 bg-blue-50 border-blue-200 hover:bg-blue-100",
    description: "First interview confirmed",
  },
  {
    value: "interview_completed",
    label: "Interview completed",
    icon: CheckCircle2,
    color: "text-blue-700 bg-blue-50 border-blue-200 hover:bg-blue-100",
    description: "Finished one or more interview rounds",
  },
  {
    value: "offer_received",
    label: "Offer received",
    icon: Gift,
    color: "text-violet-700 bg-violet-50 border-violet-200 hover:bg-violet-100",
    description: "Formal offer extended",
  },
  {
    value: "offer_accepted",
    label: "Offer accepted",
    icon: ThumbsUp,
    color: "text-violet-700 bg-violet-50 border-violet-200 hover:bg-violet-100",
    description: "You accepted the offer",
  },
  {
    value: "offer_declined",
    label: "Offer declined",
    icon: ThumbsDown,
    color: "text-stone-600 bg-stone-50 border-stone-200 hover:bg-stone-100",
    description: "You declined the offer",
  },
  {
    value: "rejection",
    label: "Rejected",
    icon: XCircle,
    color: "text-rose-700 bg-rose-50 border-rose-200 hover:bg-rose-100",
    description: "Company passed on your application",
  },
  {
    value: "ghosted",
    label: "Ghosted",
    icon: Ghost,
    color: "text-stone-600 bg-stone-50 border-stone-200 hover:bg-stone-100",
    description: "No response after 3+ weeks",
  },
  {
    value: "application_withdrawn",
    label: "Withdrawn",
    icon: LogOut,
    color: "text-stone-600 bg-stone-50 border-stone-200 hover:bg-stone-100",
    description: "You withdrew your application",
  },
]

function outcomeColor(outcome: string) {
  const map: Record<string, string> = {
    callback: "text-emerald-700 bg-emerald-50 border-emerald-200",
    interview_scheduled: "text-blue-700 bg-blue-50 border-blue-200",
    interview_completed: "text-blue-700 bg-blue-50 border-blue-200",
    offer_received: "text-violet-700 bg-violet-50 border-violet-200",
    offer_accepted: "text-violet-700 bg-violet-50 border-violet-200",
    offer_declined: "text-stone-600 bg-stone-50 border-stone-200",
    rejection: "text-rose-700 bg-rose-50 border-rose-200",
    ghosted: "text-stone-600 bg-stone-50 border-stone-200",
    application_withdrawn: "text-stone-600 bg-stone-50 border-stone-200",
  }
  return map[outcome] ?? "text-stone-600 bg-stone-50 border-stone-200"
}

function outcomeLabel(outcome: string) {
  return OUTCOME_OPTIONS.find(o => o.value === outcome)?.label ?? outcome
}

// ─── Component ────────────────────────────────────────────────────────────────

interface Props {
  jobId: string
  currentOutcome?: string | null
  currentStatus?: string | null
}

export function OutcomeTracker({ jobId, currentOutcome, currentStatus }: Props) {
  const [expanded, setExpanded] = useState(false)
  const [selected, setSelected] = useState<OutcomeValue | null>(null)
  const [notes, setNotes] = useState("")
  const [interviewRounds, setInterviewRounds] = useState<string>("")
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeOutcome, setActiveOutcome] = useState(currentOutcome ?? null)

  const hasOutcome = !!activeOutcome
  const isTerminal = ["offer_accepted", "offer_declined", "rejection", "application_withdrawn"].includes(activeOutcome ?? "")

  async function handleSave() {
    if (!selected) return
    setLoading(true)
    setError(null)
    try {
      const body: Record<string, unknown> = { outcome: selected }
      if (notes.trim()) body.notes = notes.trim()
      if (interviewRounds.trim()) body.interview_rounds = parseInt(interviewRounds, 10)

      const res = await fetch(`/api/jobs/${jobId}/outcome`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok || !data.success) {
        setError(data.error ?? "Failed to save outcome")
        return
      }
      setActiveOutcome(selected)
      setSaved(true)
      setExpanded(false)
      setTimeout(() => setSaved(false), 3000)
    } catch {
      setError("Network error — try again")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="hw-card overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setExpanded((v: boolean) => !v)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-accent/40 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-foreground">Track Outcome</span>
            {hasOutcome && (
              <Badge
                variant="outline"
                className={`text-[10px] font-medium ${outcomeColor(activeOutcome!)}`}
              >
                {outcomeLabel(activeOutcome!)}
              </Badge>
            )}
            {saved && (
              <span className="text-[10px] text-emerald-700 flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" /> Saved
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {!hasOutcome && (
            <span className="text-[10px] text-muted-foreground">What happened?</span>
          )}
          {expanded ? (
            <ChevronUp className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          )}
        </div>
      </button>

      {/* Expanded panel */}
      {expanded && (
        <div className="px-5 pb-5 border-t border-border">
          <div className="pt-4 space-y-4">
            {/* Why this matters */}
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Every outcome you log trains your intelligence. HireWire learns which signals, narratives, and archetypes actually convert — not just which resumes look good.
            </p>

            {/* Outcome grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {OUTCOME_OPTIONS.map((opt) => {
                const Icon = opt.icon
                const isSelected = selected === opt.value
                return (
                  <button
                    key={opt.value}
                    onClick={() => setSelected(opt.value)}
                    className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg border text-xs font-medium transition-all text-left ${
                      isSelected
                        ? `${opt.color} ring-2 ring-offset-1 ring-current`
                        : "bg-card border-border text-foreground hover:bg-accent/40"
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5 shrink-0" />
                    <span className="leading-tight">{opt.label}</span>
                  </button>
                )
              })}
            </div>

            {/* Context fields — show when interview-related */}
            {selected && ["interview_completed", "offer_received", "offer_accepted"].includes(selected) && (
              <div>
                <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide block mb-1.5">
                  Interview rounds completed
                </label>
                <input
                  type="number"
                  min={1}
                  max={10}
                  value={interviewRounds}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setInterviewRounds(e.target.value)}
                  placeholder="e.g. 3"
                  className="w-24 text-xs px-3 py-1.5 rounded-lg border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            )}

            {/* Notes */}
            {selected && (
              <div>
                <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide block mb-1.5">
                  Notes (optional)
                </label>
                <textarea
                  value={notes}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNotes(e.target.value)}
                  placeholder="Any context about the response, feedback, timing, or recruiter notes…"
                  rows={2}
                  className="w-full text-xs px-3 py-2 rounded-lg border border-border bg-background resize-none focus:outline-none focus:ring-1 focus:ring-primary placeholder:text-muted-foreground/60"
                />
              </div>
            )}

            {/* Error */}
            {error && (
              <p className="text-xs text-rose-600 flex items-center gap-1.5">
                <AlertTriangle className="h-3 w-3" />
                {error}
              </p>
            )}

            {/* Save */}
            <div className="flex items-center gap-2">
              <Button
                onClick={handleSave}
                disabled={!selected || loading}
                size="sm"
                className="hw-btn-primary gap-1.5 text-xs"
              >
                {loading ? (
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <CheckCircle2 className="h-3.5 w-3.5" />
                )}
                {loading ? "Saving…" : hasOutcome ? "Update outcome" : "Log outcome"}
              </Button>
              <button
                onClick={() => setExpanded(false)}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                Cancel
              </button>
            </div>

            {/* Learning note */}
            <p className="text-[10px] text-muted-foreground border-t border-border pt-3">
              Outcome data is never shared. It feeds only your personal intelligence engine.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
