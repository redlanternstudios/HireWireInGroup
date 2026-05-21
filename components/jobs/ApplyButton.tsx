"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { applyToJob } from "@/lib/actions/apply"
import { Send, Loader2 } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface ApplyButtonProps {
  jobId: string
  disabled?: boolean
}

export function ApplyButton({ jobId, disabled = false }: ApplyButtonProps) {
  const router = useRouter()
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [confirmOpen, setConfirmOpen] = useState(false)

  async function handleApply() {
    setPending(true)
    setError(null)
    try {
      const result = await applyToJob(jobId)
      if (result.success) {
        router.push("/applications")
      } else {
        const msg = typeof result.error === "object"
          ? ((result.error as { message?: string })?.message ?? "Could not submit application.")
          : (result.error ?? "Could not submit application.")
        setError(msg)
        setPending(false)
      }
    } catch {
      setError("Something went wrong. Please try again.")
      setPending(false)
    }
  }

  return (
    <div className="space-y-1.5">
      <Button
        onClick={() => setConfirmOpen(true)}
        disabled={disabled || pending}
        className="w-full hw-btn-primary gap-2"
        size="sm"
      >
        {pending ? (
          <>
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            Submitting…
          </>
        ) : (
          <>
            <Send className="h-3.5 w-3.5" />
            Mark as Applied
          </>
        )}
      </Button>
      {error && (
        <p className="text-[11px] text-destructive text-center">{error}</p>
      )}
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
              className="hw-btn-primary gap-2"
              disabled={pending}
              onClick={() => {
                setConfirmOpen(false)
                void handleApply()
              }}
            >
              <Send className="h-3.5 w-3.5" />
              Confirm Applied
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
