"use client"

import { useMemo, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { ArrowRight, CheckCircle2, FileText, Loader2, RefreshCw, Send, Sparkles } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { completeStep } from "@/lib/actions/complete-step"
import { getNextStep } from "@/lib/workflow/get-next-step"
import type { GuidedFlowJob } from "@/lib/workflow/step-types"

type NextStepModalProps = {
  job: GuidedFlowJob | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

function StepIcon({ type }: { type: ReturnType<typeof getNextStep>["type"] }) {
  const className = "h-5 w-5 text-primary"
  if (type === "generate" || type === "review") return <FileText className={className} />
  if (type === "apply") return <Send className={className} />
  if (type === "refresh_analysis" || type === "analyzing") return <RefreshCw className={className} />
  if (type === "done") return <CheckCircle2 className={className} />
  return <Sparkles className={className} />
}

export function NextStepModal({ job, open, onOpenChange }: NextStepModalProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [busyLabel, setBusyLabel] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const step = useMemo(() => (job ? getNextStep(job) : null), [job])

  if (!job || !step) return null
  const currentJob = job
  const currentStep = step

  const isBusy = isPending || busyLabel !== null

  async function refreshAnalysis() {
    setError(null)
    setBusyLabel("Refreshing analysis...")
    try {
      const response = await fetch("/api/re-analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ job_id: currentJob.id }),
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok || !data.success) {
        setError(data.error ?? "Could not refresh this job.")
        return
      }
      router.refresh()
      onOpenChange(false)
    } catch {
      setError("Network error. Please try again.")
    } finally {
      setBusyLabel(null)
    }
  }

  async function generateDocuments() {
    setError(null)
    setBusyLabel("Generating documents...")
    try {
      const response = await fetch("/api/generate-documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ job_id: currentJob.id }),
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok || !data.success) {
        setError(data.user_message ?? data.reason ?? data.error ?? "Generation failed.")
        return
      }
      router.push(`/jobs/${currentJob.id}/documents`)
      router.refresh()
    } catch {
      setError("Network error. Please try again.")
    } finally {
      setBusyLabel(null)
    }
  }

  function runComplete(payload: Parameters<typeof completeStep>[1]) {
    setError(null)
    startTransition(async () => {
      const result = await completeStep(currentJob.id, payload)
      if (!result.success) {
        setError(result.reasons?.[0] ?? result.error ?? "Could not complete this step.")
        return
      }
      router.refresh()
      onOpenChange(false)
    })
  }

  function primaryAction() {
    if (currentStep.type === "refresh_analysis") return void refreshAnalysis()
    if (currentStep.type === "analyzing") return router.refresh()
    if (currentStep.type === "add_example") return router.push(currentStep.href ?? `/jobs/${currentJob.id}/evidence-match`)
    if (currentStep.type === "generate") return void generateDocuments()
    if (currentStep.type === "review") return router.push(currentStep.href ?? `/jobs/${currentJob.id}/documents`)
    if (currentStep.type === "apply") return runComplete({ step: "apply", method: "manual" })
    if (currentStep.type === "done") return router.push(currentStep.href ?? `/jobs/${currentJob.id}`)
  }

  function secondaryAction() {
    if (currentStep.type === "review") return runComplete({ step: "review" })
    if (currentStep.href) return router.push(currentStep.href)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <StepIcon type={currentStep.type} />
          </div>
          <DialogTitle>{currentStep.title}</DialogTitle>
          <DialogDescription>{currentStep.description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2">
          <div className="rounded-lg border border-border bg-muted/25 p-3">
            <p className="text-xs font-semibold text-foreground">
              {currentJob.role_title ?? "Untitled role"}
              {currentJob.company_name ? ` at ${currentJob.company_name}` : ""}
            </p>
            {currentStep.requirement ? (
              <div className="mt-3 space-y-2">
                <p className="text-[11px] font-semibold uppercase text-muted-foreground">This job asks for</p>
                <p className="text-sm text-foreground">{currentStep.requirement.requirement_text}</p>
                <p className="text-xs text-muted-foreground">
                  {currentStep.requirement.prompt ?? "Share one real example. A project, responsibility, tool, result, or adjacent experience all count."}
                </p>
              </div>
            ) : (
              <p className="mt-1 text-xs text-muted-foreground">
                {currentStep.readiness.blockedReasons[0] ?? "HireWire will keep the next step focused."}
              </p>
            )}
          </div>
          {error && (
            <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
              {error}
            </p>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          {currentStep.secondaryLabel && (
            <Button type="button" variant="outline" disabled={isBusy} onClick={secondaryAction}>
              {currentStep.secondaryLabel}
            </Button>
          )}
          <Button type="button" className="hw-btn-primary gap-1.5" disabled={isBusy} onClick={primaryAction}>
            {busyLabel ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                {busyLabel}
              </>
            ) : (
              <>
                {currentStep.primaryLabel}
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
