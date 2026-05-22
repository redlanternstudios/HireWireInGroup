"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { MessageSquareText, Sparkles } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { CoachChat } from "@/components/coach-chat"
import { ConfirmRequirementEvidenceForm } from "@/components/jobs/ConfirmRequirementEvidenceForm"

export type RequirementCoachModalProps = {
  jobId: string
  jobTitle: string
  company: string
  score?: number | null
  status?: string
  gaps: string[]
  requirement?: {
    requirement_id: string
    requirement_text: string
    priority?: string
    status?: string
    current_proof?: string[]
    proof_needed?: string[]
    coach_question?: string
  }
  evidenceItems?: {
    id: string
    source_title: string | null
    source_type: string | null
  }[]
  autoOpen?: boolean
}

function cleanGap(gap: string) {
  return gap.replace(/^Gap:\s*/i, "").trim()
}

export function RequirementCoachModal({
  jobId,
  jobTitle,
  company,
  score,
  status,
  gaps,
  requirement,
  evidenceItems = [],
  autoOpen = false,
}: RequirementCoachModalProps) {
  const [open, setOpen] = useState(autoOpen && gaps.length > 0)
  const [answer, setAnswer] = useState("")
  const [saving, setSaving] = useState<"answer" | "skip" | null>(null)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const activeGap = requirement?.requirement_text ?? (gaps[0] ? cleanGap(gaps[0]) : null)

  const initialMessage = useMemo(() => {
    if (!activeGap) return undefined
    return [
      `Help me find a real example for ${jobTitle} at ${company}: "${activeGap}".`,
      requirement?.current_proof?.length ? `Possible examples already found: ${requirement.current_proof.join("; ")}.` : "No strong example has been found yet.",
      evidenceItems.length ? `Evidence options visible in this dialog: ${evidenceItems.map((item) => item.source_title ?? "Untitled evidence").slice(0, 8).join("; ")}.` : "",
      "Start with one simple question. If this is an experience-duration requirement, help me tally roles into composite evidence and save it only after I confirm.",
    ].join(" ")
  }, [activeGap, company, evidenceItems, jobTitle, requirement?.current_proof])

  if (!activeGap) return null

  async function postCoachStep(body: Record<string, unknown>, mode: "answer" | "skip") {
    setSaving(mode)
    setError(null)
    try {
      const response = await fetch(`/api/jobs/${jobId}/coach-step`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      const data = await response.json()
      if (!response.ok || !data.success) {
        setError(data.user_message ?? "Could not save the coach step. Please try again.")
        return
      }
      setAnswer("")
      setOpen(false)
      router.refresh()
    } catch {
      setError("Network error. Please try again.")
    } finally {
      setSaving(null)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {requirement ? (
        <DialogTrigger asChild>
          <Button size="sm" className="hw-btn-primary gap-1.5 text-xs shrink-0">
            <MessageSquareText className="h-3.5 w-3.5" />
            Open coach
          </Button>
        </DialogTrigger>
      ) : (
        <div className="hw-card px-5 py-4 border-l-4 border-l-primary">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary shrink-0" />
                <h2 className="text-sm font-semibold text-foreground">Coach can help find an example</h2>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                {activeGap}
              </p>
            </div>
            <DialogTrigger asChild>
              <Button size="sm" className="hw-btn-primary gap-1.5 text-xs shrink-0">
                <MessageSquareText className="h-3.5 w-3.5" />
                Open coach
              </Button>
            </DialogTrigger>
          </div>
        </div>
      )}

      <DialogContent className="flex max-h-[92vh] w-[min(980px,calc(100vw-2rem))] max-w-none flex-col gap-0 overflow-hidden p-0">
        <DialogHeader className="border-b border-border px-5 py-4 pr-10">
          <DialogTitle className="text-base">Match evidence to this requirement</DialogTitle>
          <DialogDescription>
            Answer one question at a time. Only confirmed details get saved.
          </DialogDescription>
        </DialogHeader>
        <div className="grid min-h-0 flex-1 overflow-hidden lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
          <div className="min-h-0 overflow-y-auto border-b border-border bg-muted/25 px-5 py-4 lg:border-b-0 lg:border-r">
            <div className="rounded-md border border-border bg-background p-4">
              <p className="text-[11px] font-semibold uppercase text-muted-foreground">
                Requirement
              </p>
              <p className="mt-2 text-sm font-semibold text-foreground">{activeGap}</p>
              {requirement?.proof_needed?.length ? (
                <p className="mt-2 text-xs text-muted-foreground">{requirement.proof_needed[0]}</p>
              ) : null}
              {requirement?.current_proof?.length ? (
                <div className="mt-3 rounded-md bg-muted/60 px-3 py-2">
                  <p className="text-[11px] font-semibold uppercase text-muted-foreground">Already found</p>
                  <p className="mt-1 text-xs text-foreground">{requirement.current_proof.join(", ")}</p>
                </div>
              ) : null}
            </div>

            {requirement?.requirement_id && evidenceItems.length > 0 && (
              <div className="mt-4 rounded-md border border-border bg-background p-4">
                <p className="text-[11px] font-semibold uppercase text-muted-foreground">
                  Pick existing evidence
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Choose a proof point directly, or use the coach to combine several roles into one derived example.
                </p>
                <ConfirmRequirementEvidenceForm
                  jobId={jobId}
                  requirementId={requirement.requirement_id}
                  evidenceItems={evidenceItems}
                />
              </div>
            )}

            <div className="mt-4 rounded-md border border-border bg-background p-4">
              <p className="text-xs font-semibold text-foreground">Start here</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Have you done anything related to {activeGap}? A project, responsibility, tool, result, or adjacent experience all count.
              </p>
              <div className="mt-3 space-y-2">
                <Textarea
                  value={answer}
                  onChange={(event) => setAnswer(event.target.value)}
                  placeholder="Example: I have not owned this exact tool, but I led..."
                  className="min-h-24 text-sm"
                />
                {error && <p className="text-xs text-rose-600">{error}</p>}
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Button
                    size="sm"
                    className="hw-btn-primary gap-1.5 text-xs"
                    disabled={saving !== null || answer.trim().length < 8}
                    onClick={() => postCoachStep({ action: "answer", gap: activeGap, requirementId: requirement?.requirement_id, answer }, "answer")}
                  >
                    {saving === "answer" ? "Saving..." : "Save answer"}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-xs"
                    disabled={saving !== null}
                    onClick={() => postCoachStep({ action: "skip" }, "skip")}
                  >
                    {saving === "skip" ? "Skipping..." : "Skip and accept weaker output"}
                  </Button>
                </div>
              </div>
            </div>
          </div>
          <CoachChat
            compact
            className="min-h-[420px] lg:min-h-0"
            jobContext={{
              jobId,
              title: jobTitle,
              company,
              score,
              status,
            }}
            gapContext={{
              jobTitle,
              company,
              gap: {
                requirement_id: requirement?.requirement_id,
                requirement: activeGap,
                category: requirement?.priority ?? "requirement",
                coach_question: requirement?.coach_question ?? `Have you done anything related to ${activeGap}?`,
              },
            }}
            initialMessage={initialMessage}
          />
        </div>
      </DialogContent>
    </Dialog>
  )
}

export const GapCoachDrawer = RequirementCoachModal
