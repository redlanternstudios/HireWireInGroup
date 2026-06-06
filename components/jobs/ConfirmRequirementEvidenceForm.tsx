"use client"

import { useMemo, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"

type EvidenceOption = {
  id: string
  source_title: string | null
  source_type: string | null
}

export function ConfirmRequirementEvidenceForm({
  jobId,
  requirementId,
  evidenceItems,
}: {
  jobId: string
  requirementId: string
  evidenceItems: EvidenceOption[]
}) {
  const router = useRouter()
  const [selectedEvidenceId, setSelectedEvidenceId] = useState(evidenceItems[0]?.id ?? "")
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const selectedAlreadyMapped = useMemo(
    () => evidenceItems.some((item) => item.id === selectedEvidenceId),
    [evidenceItems, selectedEvidenceId]
  )

  async function confirmMapping() {
    if (!selectedEvidenceId || !selectedAlreadyMapped) return
    setError(null)
    startTransition(async () => {
      const response = await fetch(`/api/jobs/${jobId}/evidence-map`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requirementId, evidenceId: selectedEvidenceId }),
      })
      const payload = await response.json().catch(() => null)
      if (!response.ok || !payload?.success) {
        setError(payload?.user_message ?? payload?.error ?? "Could not map evidence.")
        return
      }
      router.refresh()
    })
  }

  if (evidenceItems.length === 0) {
    return null
  }

  return (
    <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
      <select
        value={selectedEvidenceId}
        onChange={(event) => setSelectedEvidenceId(event.target.value)}
        className="h-9 min-w-0 flex-1 rounded-md border border-border bg-background px-2 text-xs text-foreground"
        aria-label="Evidence item"
      >
        {evidenceItems.map((item) => (
          <option key={item.id} value={item.id}>
            {item.source_title ?? "Untitled evidence"}
            {item.source_type ? ` (${item.source_type.replace(/_/g, " ")})` : ""}
          </option>
        ))}
      </select>
      <Button
        type="button"
        size="sm"
        variant="outline"
        onClick={confirmMapping}
        disabled={isPending || !selectedEvidenceId}
      >
        {isPending ? "Saving..." : "Confirm evidence"}
      </Button>
      {error && <p className="text-xs text-red-600 sm:basis-full">{error}</p>}
    </div>
  )
}
