"use client"

import { useState } from "react"
import { ArrowRight } from "lucide-react"

import { Button } from "@/components/ui/button"
import { NextStepModal } from "@/components/workflow/NextStepModal"
import type { GuidedFlowJob } from "@/lib/workflow/step-types"

export function NextStepButton({
  job,
  label,
}: {
  job: GuidedFlowJob
  label: string
}) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button size="sm" className="hw-btn-primary gap-1.5 px-5 h-9" onClick={() => setOpen(true)}>
        {label} <ArrowRight className="h-3.5 w-3.5" />
      </Button>
      <NextStepModal job={job} open={open} onOpenChange={setOpen} />
    </>
  )
}
