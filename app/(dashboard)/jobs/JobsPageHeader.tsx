// JobsPageHeader.tsx
import React from "react"

export function JobsPageHeader() {
  return (
    <div className="flex items-center justify-between mb-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">All Jobs</h1>
        <p className="text-muted-foreground mt-1 max-w-2xl">
          Track every opportunity from first scan to final application. Use this page to analyze job links, score your fit, generate materials, review quality, and move strong roles into your ready to apply queue.
        </p>
      </div>
      <div className="flex gap-2">
        <button className="rounded-lg bg-primary text-white px-4 py-2 font-medium hover:bg-primary/90 transition-colors">Add Job</button>
        <button className="rounded-lg border border-border px-4 py-2 font-medium text-foreground hover:bg-muted transition-colors">Paste Description</button>
        <a href="/ready-queue" className="rounded-lg border border-border px-4 py-2 font-medium text-foreground hover:bg-muted transition-colors">View Ready Queue</a>
      </div>
    </div>
  )
}
