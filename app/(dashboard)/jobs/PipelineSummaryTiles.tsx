// PipelineSummaryTiles.tsx
import React from "react"

export function PipelineSummaryTiles({ jobs }: { jobs: any[] }) {
  // Compute counts
  const total = jobs.length
  const highFit = jobs.filter(j => j.score >= 80).length // assuming score field
  const needsEvidence = jobs.filter(j => j.status === "queued" || j.status === "draft").length
  const ready = jobs.filter(j => j.status === "ready").length
  const applied = jobs.filter(j => j.status === "applied").length
  const tiles = [
    { label: "Total Jobs", count: total, helper: "All tracked" },
    { label: "High Fit", count: highFit, helper: "Strong matches" },
    { label: "Needs Evidence", count: needsEvidence, helper: "Missing context" },
    { label: "Ready to Apply", count: ready, helper: "Fully ready" },
    { label: "Applied", count: applied, helper: "Submitted" },
  ]
  return (
    <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 mb-6">
      {tiles.map((tile) => (
        <button
          key={tile.label}
          className="rounded-2xl bg-muted p-5 shadow-sm flex flex-col items-center hover:bg-primary/5 transition-colors group"
        >
          <div className="text-2xl font-bold text-foreground mb-1 group-hover:text-primary">{tile.count}</div>
          <div className="font-medium text-sm mb-0.5">{tile.label}</div>
          <div className="text-xs text-muted-foreground">{tile.helper}</div>
        </button>
      ))}
    </div>
  )
}
