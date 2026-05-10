// JobIntakeCard.tsx
import React from "react"
import { JobIntakeForm } from "./JobIntakeForm"

export function JobIntakeCard({ onSubmit }: { onSubmit: (url: string) => void }) {
  return (
    <div className="rounded-2xl bg-card p-8 shadow-sm mb-6">
      <h2 className="text-lg font-semibold mb-2">Analyze a new opportunity</h2>
      <JobIntakeForm onSubmit={onSubmit} />
      <div className="text-xs text-muted-foreground mb-1">
        Supported: Lever, Greenhouse, Workday, company career pages, and other public job links.
      </div>
      <div className="text-xs text-warning-foreground">
        Some job boards block automated reading. If analysis fails, paste the job description manually.
      </div>
    </div>
  )
}
