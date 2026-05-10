// JobIntelligencePanel.tsx
import React from "react"

export function JobIntelligencePanel({ jobs }: { jobs: any[] }) {
  // Compute stats
  const fitScores = jobs.map(j => j.score).filter(Boolean)
  const avgFit = fitScores.length ? Math.round(fitScores.reduce((a, b) => a + b, 0) / fitScores.length) : "—"
  const readyCount = jobs.filter(j => j.status === "ready").length
  const atsReady = jobs.filter(j => j.ats_readiness === "strong").length
  const profileStrength = jobs.length ? Math.round((readyCount / jobs.length) * 100) : "—"
  const topGaps = (() => {
    const gapCounts: Record<string, number> = {}
    jobs.forEach(j => {
      if (Array.isArray(j.score_gaps)) j.score_gaps.forEach((g: string) => { gapCounts[g] = (gapCounts[g] || 0) + 1 })
    })
    return Object.entries(gapCounts).sort((a, b) => b[1] - a[1]).slice(0, 2).map(([g]) => g).join(", ") || "—"
  })()
  return (
    <aside className="hidden xl:block xl:col-span-3 2xl:col-span-2 bg-card rounded-2xl border border-border p-6 shadow-sm h-fit sticky top-24">
      <h2 className="text-lg font-semibold mb-2">Career Intelligence</h2>
      <ul className="space-y-2 text-sm">
        <li><span className="font-medium">Avg Fit Score:</span> <span className="text-primary">{avgFit}</span></li>
        <li><span className="font-medium">ATS Readiness:</span> <span className="text-primary">{atsReady}</span></li>
        <li><span className="font-medium">Profile Strength:</span> <span className="text-primary">{profileStrength}%</span></li>
        <li><span className="font-medium">Top Gaps:</span> <span className="text-primary">{topGaps}</span></li>
        <li><span className="font-medium">Ready to Apply:</span> <span className="text-primary">{readyCount}</span></li>
      </ul>
      <div className="mt-4 text-xs text-muted-foreground">
        This panel surfaces actionable insights, readiness, and next steps as you move jobs through the pipeline.
      </div>
    </aside>
  )
}
