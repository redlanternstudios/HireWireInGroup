"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { applyToJob } from "@/lib/actions/apply"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"

export function MarkAsAppliedButton({
  jobId,
  disabled,
  variant = "primary",
  label = "Mark as Applied",
}: {
  jobId: string
  disabled?: boolean
  variant?: "primary" | "ghost"
  label?: string
}) {
  const [isPending, startTransition] = useTransition()
  const [blockedReasons, setBlockedReasons] = useState<string[]>([])
  const [overrideReason, setOverrideReason] = useState("")
  const [acknowledged, setAcknowledged] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const router = useRouter()

  async function performApply() {
    startTransition(async () => {
      const result = await applyToJob(jobId)
      if (result.error === "APPLICATION_BLOCKED") {
        setBlockedReasons(result.reasons ?? [])
        setIsDialogOpen(true)
        return
      }
      if (result.success) {
        router.push("/applications")
      } else {
        router.refresh()
      }
    })
  }

  async function handleOverride() {
    const reason = overrideReason.trim()
    if (!reason) return

    startTransition(async () => {
      const result = await applyToJob(jobId, true, reason)
      if (result.success) {
        setIsDialogOpen(false)
        router.push("/applications")
      }
    })
  }

  return (
    <>
      <Button
        className={variant === "ghost" ? "text-xs text-muted-foreground hover:text-foreground h-auto p-0 font-normal underline-offset-2 hover:underline" : "hw-btn-primary"}
        variant={variant === "ghost" ? "ghost" : undefined}
        disabled={isPending || disabled}
        onClick={() => setConfirmOpen(true)}
        type="button"
      >
        {isPending ? "Marking..." : label}
      </Button>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mark this job as applied?</DialogTitle>
            <DialogDescription>
              HireWire will create an application record, move this job into Applications, and start outcome tracking.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setConfirmOpen(false)}>
              Cancel
            </Button>
            <Button
              type="button"
              className="hw-btn-primary"
              disabled={isPending}
              onClick={() => {
                setConfirmOpen(false)
                void performApply()
              }}
            >
              Confirm Applied
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Application blocked</DialogTitle>
            <DialogDescription>
              HireWire found readiness issues. You can fix them or log an explicit override.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="rounded-lg border border-rose-200 bg-rose-50 p-3">
              <p className="text-xs font-semibold text-rose-700">Blocked because</p>
              <ul className="mt-2 space-y-1 text-sm text-rose-700">
                {blockedReasons.map(reason => (
                  <li key={reason}>{reason}</li>
                ))}
              </ul>
            </div>

            <Textarea
              value={overrideReason}
              onChange={event => setOverrideReason(event.target.value)}
              placeholder="Reason for override..."
              maxLength={280}
              required
            />

            <label className="flex items-start gap-2 text-sm">
              <Checkbox
                checked={acknowledged}
                onCheckedChange={checked => setAcknowledged(checked === true)}
              />
              <span>I understand this application is not ready and want to log an override.</span>
            </label>
            <p className="text-xs text-muted-foreground">
              Overriding readiness will submit this application without all checks passing. This action is logged.
            </p>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button type="button" disabled={!acknowledged || overrideReason.trim().length === 0 || isPending} onClick={handleOverride}>
              Override and Apply
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
