// JobIntelligencePanel.tsx
"use client"

import React from "react"
import Link from "next/link"
import { evaluateReadiness } from "@/lib/readiness/evaluator"
import { Brain, ArrowRight, Activity, Target, Eye, TrendingUp } from "lucide-react"

interface IntelligenceSummary {
  dominant_signal?: string
  role_archetype?: string
  archetype_confidence?: number
  narrative_mode?: string
  recruiter_scan?: {
    pass_probability?: number
    overall_sentiment?: string
  }
}

export function JobIntelligencePanel({ jobs }: { jobs: unknown[] }) {
  const jobList = jobs as Array<{
    id: string
    score?: number | null
    fit?: string | null
    ats_readiness?: string
    score_gaps?: string[]
    intelligence?: IntelligenceSummary | null
    status?: string
  }>

  // Compute stats
  const fitScores = jobList.map((j) => j.score).filter(Boolean) as number[]
  const avgFit = fitScores.length
    ? Math.round(fitScores.reduce((a, b) => a + b, 0) / fitScores.length)
    : null

  const readiness = jobList.map((job) => evaluateReadiness(job as Parameters<typeof evaluateReadiness>[0]))
  const readyCount = readiness.filter((r) => r.stage === "ready").length

  const topGaps = (() => {
    const gapCounts: Record<string, number> = {}
    jobList.forEach((j) => {
      if (Array.isArray(j.score_gaps))
        j.score_gaps.forEach((g: string) => {
          gapCounts[g] = (gapCounts[g] || 0) + 1
        })
    })
    return Object.entries(gapCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 2)
      .map(([g]) => g)
  })()

  // Intelligence aggregates
  const archetypes = jobList
    .map((j) => j.intelligence?.role_archetype)
    .filter(Boolean) as string[]
  const topArchetype = archetypes.length
    ? Object.entries(
        archetypes.reduce<Record<string, number>>((acc, a) => {
          acc[a] = (acc[a] || 0) + 1
          return acc
        }, {})
      ).sort((a, b) => b[1] - a[1])[0]?.[0]
    : null

  const dominantSignals = jobList
    .map((j) => j.intelligence?.dominant_signal)
    .filter(Boolean) as string[]
  const topSignal = dominantSignals.length
    ? Object.entries(
        dominantSignals.reduce<Record<string, number>>((acc, s) => {
          acc[s] = (acc[s] || 0) + 1
          return acc
        }, {})
      ).sort((a, b) => b[1] - a[1])[0]?.[0]
    : null

  const passProbabilities = jobList
    .map((j) => j.intelligence?.recruiter_scan?.pass_probability)
    .filter((v): v is number => typeof v === "number")
  const avgPassProb = passProbabilities.length
    ? Math.round(
        passProbabilities.reduce((a, b) => a + b, 0) / passProbabilities.length
      )
    : null

  const hasIntelligence = jobList.some((j) => !!j.intelligence)
  return (
    <aside className="hidden xl:block xl:col-span-3 2xl:col-span-2 sticky top-24">
      <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
        {/* Header */}
        <div className="px-5 pt-5 pb-4 border-b border-border">
          <div className="flex items-center gap-2">
            <Brain className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-bold text-foreground">Career Intelligence</h2>
          </div>
          <p className="text-[10px] text-muted-foreground mt-0.5">
            Live signal from {jobList.length} job{jobList.length !== 1 ? "s" : ""}
          </p>
        </div>

        {/* Core stats */}
        <div className="px-5 py-4 space-y-3">
          <StatRow
            icon={TrendingUp}
            label="Avg Fit Score"
            value={avgFit !== null ? `${avgFit}/100` : "—"}
            highlight={avgFit !== null && avgFit >= 70}
          />
          <StatRow
            icon={Activity}
            label="Ready to Apply"
            value={readyCount > 0 ? `${readyCount} job${readyCount !== 1 ? "s" : ""}` : "—"}
            highlight={readyCount > 0}
          />
          {avgPassProb !== null && (
            <StatRow
              icon={Eye}
              label="Avg Screen Pass"
              value={`${avgPassProb}%`}
              highlight={avgPassProb >= 65}
            />
          )}
        </div>

        {/* Intelligence layer */}
        {hasIntelligence && (
          <div className="px-5 pb-4 space-y-3 border-t border-border pt-4">
            {topArchetype && (
              <div>
                <p className="text-[9px] uppercase tracking-wide text-muted-foreground font-medium mb-1">
                  Top Archetype
                </p>
                <div className="flex items-center gap-1.5">
                  <Target className="h-3 w-3 text-primary shrink-0" />
                  <span className="text-[11px] font-medium text-foreground">
                    {topArchetype}
                  </span>
                </div>
              </div>
            )}
            {topSignal && (
              <div>
                <p className="text-[9px] uppercase tracking-wide text-muted-foreground font-medium mb-1">
                  Dominant Signal
                </p>
                <span className="text-[11px] font-medium text-primary">{topSignal}</span>
              </div>
            )}
            {topGaps.length > 0 && (
              <div>
                <p className="text-[9px] uppercase tracking-wide text-muted-foreground font-medium mb-1">
                  Recurring Gaps
                </p>
                <ul className="space-y-0.5">
                  {topGaps.map((g, i) => (
                    <li key={i} className="text-[11px] text-rose-600 truncate">
                      · {g.replace(/^Gap:\s*/i, "")}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Links to intelligence per job */}
        {hasIntelligence && (
          <div className="px-5 pb-5 border-t border-border pt-3 space-y-1">
            <p className="text-[9px] uppercase tracking-wide text-muted-foreground font-medium mb-2">
              Resume Intelligence
            </p>
            {jobList
              .filter((j) => !!j.intelligence)
              .slice(0, 4)
              .map((j) => (
                <Link
                  key={j.id}
                  href={`/jobs/${j.id}/resume`}
                  className="flex items-center justify-between text-[11px] text-muted-foreground hover:text-foreground transition-colors group py-0.5"
                >
                  <span className="truncate flex-1 mr-2">
                    {j.intelligence?.role_archetype ?? "View intelligence"}
                  </span>
                  <ArrowRight className="h-3 w-3 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                </Link>
              ))}
          </div>
        )}

        {!hasIntelligence && jobList.length > 0 && (
          <div className="px-5 pb-5">
            <p className="text-[10px] text-muted-foreground">
              Generate a resume on any job to activate signal profiling, archetype classification, and recruiter scan.
            </p>
          </div>
        )}
      </div>
    </aside>
  )
}

function StatRow({
  icon: Icon,
  label,
  value,
  highlight,
}: {
  icon: React.ElementType
  label: string
  value: string
  highlight?: boolean
}) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-1.5">
        <Icon className="h-3 w-3 text-muted-foreground shrink-0" />
        <span className="text-[11px] text-muted-foreground">{label}</span>
      </div>
      <span
        className={`text-xs font-semibold tabular-nums ${
          highlight ? "text-primary" : "text-foreground"
        }`}
      >
        {value}
      </span>
    </div>
  )
}
