"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { MessageSquareText, Sparkles } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { CoachChat } from "@/components/coach-chat"

type GapCoachDrawerProps = {
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
  autoOpen?: boolean
}

function cleanGap(gap: string) {
  return gap.replace(/^Gap:\s*/i, "").trim()
}

export function GapCoachDrawer({
  jobId,
  jobTitle,
  company,
  score,
  status,
  gaps,
  requirement,
  autoOpen = false,
}: GapCoachDrawerProps) {
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
      "Start with one simple question. If I give useful detail, help me save it as evidence after I confirm it.",
    ].join(" ")
  }, [activeGap, company, jobTitle, requirement?.current_proof])

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
    <Sheet open={open} onOpenChange={setOpen}>
      {requirement ? (
        <SheetTrigger asChild>
          <Button size="sm" className="hw-btn-primary gap-1.5 text-xs shrink-0">
            <MessageSquareText className="h-3.5 w-3.5" />
            Open coach
          </Button>
        </SheetTrigger>
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
            <SheetTrigger asChild>
              <Button size="sm" className="hw-btn-primary gap-1.5 text-xs shrink-0">
                <MessageSquareText className="h-3.5 w-3.5" />
                Open coach
              </Button>
            </SheetTrigger>
          </div>
        </div>
      )}

      <SheetContent side="right" className="w-full gap-0 p-0 sm:max-w-xl">
        <SheetHeader className="border-b border-border px-5 py-4 pr-10">
          <SheetTitle className="text-base">Find an example</SheetTitle>
          <SheetDescription>
            Answer one question at a time. Only confirmed details get saved.
          </SheetDescription>
        </SheetHeader>
        <div className="min-h-0 flex-1">
          <div className="border-b border-border bg-muted/30 px-5 py-4">
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
          <CoachChat
            compact
            className="h-full"
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
      </SheetContent>
    </Sheet>
  )
}
