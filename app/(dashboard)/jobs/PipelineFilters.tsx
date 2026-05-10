// PipelineFilters.tsx
import React from "react"

const statusFilters = [
  { label: "All", value: "all" },
  { label: "Draft", value: "draft" },
  { label: "Queued", value: "queued" },
  { label: "Ready", value: "ready" },
  { label: "Needs Review", value: "needs_review" },
  { label: "Applied", value: "applied" },
  { label: "Interviewing", value: "interviewing" },
  { label: "Offered", value: "offered" },
  { label: "Rejected", value: "rejected" },
  { label: "Archived", value: "archived" },
]

export function PipelineFilters({ selected, onSelect }: { selected: string, onSelect: (v: string) => void }) {
  return (
    <div className="flex flex-wrap gap-2 mb-6">
      {statusFilters.map((filter) => (
        <button
          key={filter.value}
          className={`rounded-full px-4 py-1.5 text-sm font-medium border border-border transition-colors ${selected === filter.value ? "bg-primary text-white" : "bg-background text-foreground hover:bg-muted"}`}
          onClick={() => onSelect(filter.value)}
          type="button"
        >
          {filter.label}
        </button>
      ))}
    </div>
  )
}
