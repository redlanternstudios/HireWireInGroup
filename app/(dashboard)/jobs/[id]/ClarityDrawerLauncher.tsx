"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ClarityDrawer } from "@/components/clarity/ClarityDrawer"
import type { ClarityRequirement } from "@/lib/clarity/getUnresolvedRequirements"

/**
 * Client launcher for the Clarity drawer, mounted on the server-rendered
 * /jobs/[id] page. Holds the open state and refreshes the page on close so the
 * readiness checklist + score reflect any confirm/skip decisions made inside.
 */
export function ClarityDrawerLauncher({
  jobId,
  jobTitle,
  company,
  requirements,
}: {
  jobId: string
  jobTitle: string
  company: string
  requirements: ClarityRequirement[]
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const count = requirements.length

  const handleOpenChange = (next: boolean) => {
    setOpen(next)
    // On close, pull fresh server state so readiness reflects new decisions.
    if (!next) router.refresh()
  }

  return (
    <div className="hw-card border-l-4 border-l-primary px-5 py-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="hw-section-label mb-1">Prove your fit</p>
          <p className="text-sm text-muted-foreground">
            {count} {count === 1 ? "claim" : "claims"} HireWire can&apos;t verify yet. Work through
            them with your coach, one at a time.
          </p>
        </div>
        <Button onClick={() => setOpen(true)} size="sm" className="hw-btn-primary shrink-0 gap-1.5">
          <Sparkles className="h-3.5 w-3.5" /> Prove fit
        </Button>
      </div>

      <ClarityDrawer
        open={open}
        onOpenChange={handleOpenChange}
        jobId={jobId}
        jobTitle={jobTitle}
        company={company}
        requirements={requirements}
      />
    </div>
  )
}
