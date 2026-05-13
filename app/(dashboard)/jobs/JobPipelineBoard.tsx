// JobPipelineBoard.tsx

"use client"
import React, { useState } from "react"
import Link from "next/link"

const STATUS_COLUMNS = [
  { key: "draft", label: "Draft" },
  { key: "queued", label: "Queued" },
  { key: "ready", label: "Ready" },
  { key: "needs_review", label: "Needs Review" },
  { key: "applied", label: "Applied" },
  { key: "interviewing", label: "Interviewing" },
  { key: "offered", label: "Offered" },
  { key: "rejected", label: "Rejected" },
  { key: "archived", label: "Archived" },
]

export function JobPipelineBoard({ jobs }: { jobs: any[] }) {
  // Group jobs by status
  const jobsByStatus: Record<string, any[]> = {}
  for (const col of STATUS_COLUMNS) jobsByStatus[col.key] = []
  for (const job of jobs) {
    if (jobsByStatus[job.status]) jobsByStatus[job.status].push(job)
    else jobsByStatus["draft"].push(job) // fallback
  }

  // Drag state
  const [draggedJob, setDraggedJob] = useState<any>(null)

  function handleDragStart(job: any) {
    setDraggedJob(job)
  }
  function handleDrop(status: string) {
    if (draggedJob && draggedJob.status !== status) {
      // Optimistically update status (real API call should be made)
      draggedJob.status = status
    }
    setDraggedJob(null)
  }

  return (
    <div className="overflow-x-auto">
      <div className="flex gap-4 min-w-225">
        {STATUS_COLUMNS.map((col) => (
          <div
            key={col.key}
            className="flex-1 min-w-50"
            onDragOver={e => e.preventDefault()}
            onDrop={() => handleDrop(col.key)}
          >
            <div className="font-semibold text-sm mb-2 text-muted-foreground">{col.label}</div>
            <div className="space-y-3 min-h-15">
              {jobsByStatus[col.key].length === 0 ? (
                <div className="rounded-lg bg-muted p-3 text-xs text-muted-foreground text-center">No jobs</div>
              ) : (
                jobsByStatus[col.key].map((job) => (
                  <Link
                    key={job.id}
                    href={`/jobs/${job.id}`}
                    className="block rounded-xl bg-card border border-border p-4 shadow-sm hover:bg-primary/5 transition-colors"
                    draggable
                    onDragStart={() => handleDragStart(job)}
                    onDragEnd={() => setDraggedJob(null)}
                    style={{ opacity: draggedJob?.id === job.id ? 0.5 : 1 }}
                  >
                    <div className="font-medium text-sm truncate">{job.role_title ?? "Untitled role"}</div>
                    <div className="text-xs text-muted-foreground truncate">{job.company_name ?? "—"}</div>
                  </Link>
                ))
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
