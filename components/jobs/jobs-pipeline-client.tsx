"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Briefcase, Plus, ArrowRight, Target, Sparkles, Clock,
  CheckSquare, Send, Filter, ChevronDown, AlertTriangle,
  TrendingUp, Flame, Archive, RefreshCw,
} from "lucide-react"
import { deriveDisplayStage, DISPLAY_STAGE_LABEL, DISPLAY_STAGE_COLOR, STAGE_TO_VIEW, type ViewTab } from "@/lib/jobs/display-stage"
import { evaluateStaleness } from "@/lib/jobs/staleness"
import { derivePriority, PRIORITY_LABEL, PRIORITY_COLOR, PRIORITY_DOT, PRIORITY_SORT_WEIGHT } from "@/lib/jobs/priority"
import { JobInputForm } from "@/app/(dashboard)/jobs/JobInputForm"
import { cn } from "@/lib/utils"

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PipelineJob {
  id: string
  role_title: string | null
  company_name: string | null
  status: string | null
  generation_status: string | null
  generated_resume: string | null
  generated_cover_letter: string | null
  quality_passed: boolean | null
  applied_at: string | null
  evidence_map: Record<string, unknown> | null
  score: number | null
  updated_at: string | null
  created_at: string
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function timeAgo(dateStr: string | null | undefined) {
  if (!dateStr) return "—"
  const diff = Date.now() - new Date(dateStr).getTime()
  const days = Math.floor(diff / 86400000)
  if (days === 0) return "Today"
  if (days === 1) return "Yesterday"
  if (days < 7) return `${days}d ago`
  if (days < 30) return `${Math.floor(days / 7)}w ago`
  return `${Math.floor(days / 30)}mo ago`
}

type SortKey = "newest" | "closest_ready" | "highest_fit" | "needs_action_first" | "recently_updated" | "company_az" | "stale_first"

const SORT_LABELS: Record<SortKey, string> = {
  newest:            "Newest",
  closest_ready:     "Closest to Ready",
  highest_fit:       "Highest Fit",
  needs_action_first: "Needs Action First",
  recently_updated:  "Recently Updated",
  company_az:        "Company A–Z",
  stale_first:       "Stale First",
}

type FilterChip = "all" | "needs_evidence" | "needs_materials" | "needs_review" | "ready_to_apply" | "follow_up_due" | "high_fit" | "recently_added" | "stale" | "archived"

const FILTER_LABELS: Record<FilterChip, string> = {
  all:             "All",
  needs_evidence:  "Needs Evidence",
  needs_materials: "Needs Materials",
  needs_review:    "Needs Review",
  ready_to_apply:  "Ready to Apply",
  follow_up_due:   "Follow Up Due",
  high_fit:        "High Fit",
  recently_added:  "Recently Added",
  stale:           "Stale",
  archived:        "Archived",
}

const VIEW_TABS: { key: ViewTab; label: string }[] = [
  { key: "active",       label: "Active" },
  { key: "needs_action", label: "Needs Action" },
  { key: "ready",        label: "Ready" },
  { key: "applied",      label: "Applied" },
  { key: "closed",       label: "Closed" },
  { key: "archived",     label: "Archived" },
  { key: "all",          label: "All" },
]

// ─── Enriched job ─────────────────────────────────────────────────────────────

function enrichJob(job: PipelineJob) {
  const staleness = evaluateStaleness(job)
  const displayStage = deriveDisplayStage(job, staleness.isStale)
  const view = STAGE_TO_VIEW[displayStage]
  const priority = derivePriority(job, staleness.level === "archive_candidate")
  return { ...job, staleness, displayStage, view, priority }
}

type EnrichedJob = ReturnType<typeof enrichJob>

// ─── Next action per display stage ───────────────────────────────────────────

function nextActionFor(job: EnrichedJob): { label: string; href: string } | null {
  switch (job.displayStage) {
    case "inbox":
    case "analyzed":
      return { label: "View job", href: `/jobs/${job.id}` }
    case "needs_evidence":
      return { label: "Match evidence", href: `/jobs/${job.id}/evidence-match` }
    case "ready_to_generate":
      return { label: "Generate package", href: `/jobs/${job.id}` }
    case "package_drafted":
    case "needs_review":
      return { label: "Review package", href: `/jobs/${job.id}/red-team` }
    case "ready_to_apply":
      return { label: "Apply now", href: `/jobs/${job.id}` }
    case "applied":
    case "follow_up_due":
      return { label: "View application", href: `/jobs/${job.id}` }
    case "stale":
      return { label: "Continue", href: `/jobs/${job.id}` }
    default:
      return { label: "View", href: `/jobs/${job.id}` }
  }
}

// ─── Job Card ─────────────────────────────────────────────────────────────────

function JobCard({ job }: { job: EnrichedJob }) {
  const action = nextActionFor(job)
  const stageLabel = DISPLAY_STAGE_LABEL[job.displayStage]
  const stageColor = DISPLAY_STAGE_COLOR[job.displayStage]
  const priorityColor = PRIORITY_COLOR[job.priority]
  const priorityDot = PRIORITY_DOT[job.priority]
  const referenceDate = job.updated_at || job.created_at

  // Blockers
  const blockers: string[] = []
  if (job.displayStage === "needs_evidence") blockers.push("Evidence mapping incomplete")
  if (job.displayStage === "needs_review") blockers.push("Quality review pending")
  if (job.displayStage === "package_drafted" && !job.generated_resume) blockers.push("Resume not generated")
  if (job.displayStage === "package_drafted" && !job.generated_cover_letter) blockers.push("Cover letter not generated")
  if (job.staleness.label) blockers.push(job.staleness.label)

  return (
    <div className="hw-card group">
      <div className="px-5 py-4">
        {/* Top row */}
        <div className="flex items-start gap-3.5">
          {/* Company icon */}
          <div className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center shrink-0 mt-0.5">
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </div>

          {/* Main info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-foreground truncate leading-tight">
                  {job.role_title ?? "Untitled role"}
                </p>
                <p className="text-xs text-muted-foreground truncate mt-0.5">
                  {job.company_name ?? "—"}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {/* Priority dot */}
                <span className={cn("w-2 h-2 rounded-full shrink-0", priorityDot)} title={PRIORITY_LABEL[job.priority]} />
                {/* Fit score */}
                {job.score !== null ? (
                  <span className={cn("text-[11px] font-bold tabular-nums px-1.5 py-0.5 rounded", priorityColor)}>
                    {job.score}%
                  </span>
                ) : (
                  <span className="text-[11px] text-muted-foreground/50">—</span>
                )}
              </div>
            </div>

            {/* Stage badge + time */}
            <div className="flex items-center gap-2 mt-2">
              <Badge variant="outline" className={cn("text-[10px] font-medium px-1.5 py-0", stageColor)}>
                {stageLabel}
              </Badge>
              <span className="text-[10px] text-muted-foreground">{timeAgo(referenceDate)}</span>
            </div>
          </div>
        </div>

        {/* Blockers */}
        {blockers.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {blockers.map(b => (
              <span key={b} className="inline-flex items-center gap-1 text-[10px] text-amber-700 bg-amber-50 border border-amber-200 rounded px-1.5 py-0.5">
                <AlertTriangle className="h-2.5 w-2.5" />{b}
              </span>
            ))}
          </div>
        )}

        {/* Actions row */}
        <div className="mt-3 flex items-center gap-2">
          {action && (
            <Link href={action.href}>
              <Button size="sm" variant="default" className="hw-btn-primary h-7 text-xs px-3">
                {action.label}
              </Button>
            </Link>
          )}
          <Link href={`/coach?job=${job.id}`}>
            <Button size="sm" variant="outline" className="h-7 text-xs px-2.5 gap-1">
              <Sparkles className="h-3 w-3" /> Coach
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}

// ─── Intelligence Panel ────────────────────────────────────────────────────────

function IntelligencePanel({ jobs }: { jobs: EnrichedJob[] }) {
  const active = jobs.filter(j => ["active", "needs_action"].includes(j.view)).length
  const ready = jobs.filter(j => j.view === "ready").length
  const needsAction = jobs.filter(j => j.view === "needs_action").length
  const stale = jobs.filter(j => j.staleness.isStale).length
  const applied = jobs.filter(j => j.view === "applied").length

  // Recommended next action: highest priority job that needs action
  const nextJob = jobs
    .filter(j => j.view === "needs_action" || j.view === "active")
    .sort((a, b) => PRIORITY_SORT_WEIGHT[a.priority] - PRIORITY_SORT_WEIGHT[b.priority])[0]

  // Today's queue: up to 3 recommended actions
  const todayQueue: { label: string; reason: string; href: string }[] = []
  if (ready > 0) {
    const readyJob = jobs.find(j => j.view === "ready")
    if (readyJob) todayQueue.push({ label: `${readyJob.role_title ?? "Job"} at ${readyJob.company_name ?? "—"}`, reason: "Ready to apply", href: `/jobs/${readyJob.id}` })
  }
  if (needsAction > 0 && todayQueue.length < 3) {
    const actionJob = jobs.find(j => j.view === "needs_action" && !todayQueue.find(t => t.href.includes(j.id)))
    if (actionJob) {
      const action = nextActionFor(actionJob)
      if (action) todayQueue.push({ label: `${actionJob.role_title ?? "Job"} at ${actionJob.company_name ?? "—"}`, reason: action.label, href: action.href })
    }
  }
  if (stale > 0 && todayQueue.length < 3) {
    const staleJob = jobs.find(j => j.staleness.isStale && !todayQueue.find(t => t.href.includes(j.id)))
    if (staleJob) todayQueue.push({ label: `${staleJob.role_title ?? "Job"} at ${staleJob.company_name ?? "—"}`, reason: staleJob.staleness.label ?? "Stale", href: `/jobs/${staleJob.id}` })
  }

  return (
    <div className="hw-workspace-rail">
      {/* Pipeline stats */}
      <h2 className="hw-section-label mb-3">Pipeline Intelligence</h2>
      <div className="hw-panel p-4 space-y-3">
        {jobs.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-2">
            Pipeline intelligence improves as jobs move through the workflow.
          </p>
        ) : (
          <>
            {[
              { label: "Active",       count: active,      color: "text-foreground" },
              { label: "Ready",        count: ready,       color: "text-emerald-600" },
              { label: "Needs action", count: needsAction, color: "text-amber-600" },
              { label: "Stale",        count: stale,       color: "text-orange-500" },
              { label: "Applied",      count: applied,     color: "text-blue-600" },
            ].map(row => (
              <div key={row.label} className="flex items-center gap-2.5">
                <span className="text-xs text-muted-foreground w-24 shrink-0">{row.label}</span>
                <div className="flex-1 quality-bar">
                  <div
                    className="quality-bar-fill"
                    style={{ width: jobs.length > 0 ? `${Math.max(4, Math.round((row.count / jobs.length) * 100))}%` : "0%" }}
                  />
                </div>
                <span className={cn("text-xs font-bold tabular-nums w-4 text-right", row.color)}>{row.count}</span>
              </div>
            ))}
          </>
        )}
      </div>

      {/* Recommended next action */}
      {nextJob && (
        <div className="mt-4">
          <h2 className="hw-section-label mb-2">Recommended Action</h2>
          <Link href={nextActionFor(nextJob)?.href ?? `/jobs/${nextJob.id}`}>
            <div className="hw-next-action group">
              <Target className="h-4 w-4 text-primary shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-semibold">{nextJob.role_title ?? "Job"}</p>
                <p className="text-[11px] text-muted-foreground">{nextJob.company_name ?? "—"} &middot; {DISPLAY_STAGE_LABEL[nextJob.displayStage]}</p>
                <span className="text-xs font-medium text-primary mt-1.5 inline-flex items-center gap-1 group-hover:gap-1.5 transition-all">
                  {nextActionFor(nextJob)?.label} <ArrowRight className="h-3 w-3" />
                </span>
              </div>
            </div>
          </Link>
        </div>
      )}

      {/* Today's Queue */}
      {todayQueue.length > 0 && (
        <div className="mt-4">
          <h2 className="hw-section-label mb-2">Today&apos;s Queue</h2>
          <div className="space-y-2">
            {todayQueue.map((item, i) => (
              <Link key={item.href} href={item.href}>
                <div className="hw-card px-3.5 py-3 flex items-start gap-2.5 group">
                  <span className="text-[10px] font-bold text-muted-foreground w-4 shrink-0 mt-0.5">{i + 1}</span>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold truncate">{item.label}</p>
                    <p className="text-[11px] text-muted-foreground">{item.reason}</p>
                  </div>
                  <ArrowRight className="h-3 w-3 text-muted-foreground/40 group-hover:text-primary mt-0.5 transition-colors" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Quick links */}
      <div className="mt-4 space-y-2">
        <h2 className="hw-section-label mb-2">Quick Links</h2>
        {[
          { href: "/ready-queue", icon: CheckSquare, label: "Ready Queue", desc: `${ready} ready to send` },
          { href: "/applications",  icon: Send,        label: "Applications", desc: `${applied} submitted` },
          { href: "/coach",         icon: Sparkles,    label: "Career Coach", desc: "Get advice" },
        ].map(item => (
          <Link key={item.href} href={item.href}>
            <div className="hw-card px-3.5 py-3 flex items-center gap-3 group">
              <item.icon className="h-4 w-4 text-primary shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold">{item.label}</p>
                <p className="text-[11px] text-muted-foreground">{item.desc}</p>
              </div>
              <ArrowRight className="h-3 w-3 text-muted-foreground/40 group-hover:text-primary transition-colors" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}

// ─── Main Client Component ────────────────────────────────────────────────────

export function JobsPipelineClient({ jobs: rawJobs }: { jobs: PipelineJob[] }) {
  const [activeView, setActiveView] = useState<ViewTab>("active")
  const [activeFilter, setActiveFilter] = useState<FilterChip>("all")
  const [sortKey, setSortKey] = useState<SortKey>("needs_action_first")
  const [showSort, setShowSort] = useState(false)
  const [showAddJob, setShowAddJob] = useState(false)

  // Enrich all jobs once
  const jobs = useMemo(() => rawJobs.map(enrichJob), [rawJobs])

  // Count per view for tab badges
  const viewCounts = useMemo(() => {
    const counts: Record<ViewTab, number> = { active: 0, needs_action: 0, ready: 0, applied: 0, closed: 0, archived: 0, all: jobs.length }
    for (const j of jobs) counts[j.view] = (counts[j.view] ?? 0) + 1
    return counts
  }, [jobs])

  // Filter + sort
  const visible = useMemo(() => {
    let list = activeView === "all" ? jobs : jobs.filter(j => j.view === activeView)

    // Filter chip
    if (activeFilter !== "all") {
      list = list.filter(j => {
        switch (activeFilter) {
          case "needs_evidence":  return j.displayStage === "needs_evidence"
          case "needs_materials": return j.displayStage === "ready_to_generate" || j.displayStage === "package_drafted"
          case "needs_review":    return j.displayStage === "needs_review"
          case "ready_to_apply":  return j.displayStage === "ready_to_apply"
          case "follow_up_due":   return j.displayStage === "follow_up_due"
          case "high_fit":        return (j.score ?? 0) >= 75
          case "recently_added":  return Date.now() - new Date(j.created_at).getTime() < 7 * 86400000
          case "stale":           return j.staleness.isStale
          case "archived":        return j.view === "archived"
          default:                return true
        }
      })
    }

    // Sort
    list = [...list].sort((a, b) => {
      switch (sortKey) {
        case "newest":
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        case "recently_updated":
          return new Date(b.updated_at ?? b.created_at).getTime() - new Date(a.updated_at ?? a.created_at).getTime()
        case "highest_fit":
          return (b.score ?? -1) - (a.score ?? -1)
        case "needs_action_first":
          return PRIORITY_SORT_WEIGHT[a.priority] - PRIORITY_SORT_WEIGHT[b.priority]
        case "closest_ready": {
          // Rank by how many stages away from ready_to_apply
          const stageOrder = ["inbox","analyzed","needs_evidence","ready_to_generate","package_drafted","needs_review","ready_to_apply"]
          const ai = stageOrder.indexOf(a.displayStage)
          const bi = stageOrder.indexOf(b.displayStage)
          return bi - ai
        }
        case "company_az":
          return (a.company_name ?? "").localeCompare(b.company_name ?? "")
        case "stale_first":
          return (b.staleness.daysSinceUpdate ?? 0) - (a.staleness.daysSinceUpdate ?? 0)
        default:
          return 0
      }
    })

    return list
  }, [jobs, activeView, activeFilter, sortKey])

  // Stale count for warnings
  const staleCount = jobs.filter(j => j.staleness.isStale).length
  const needsActionCount = viewCounts.needs_action

  return (
    <div className="hw-page">
      {/* Header */}
      <div className="hw-page-header">
        <div>
          <p className="hw-section-label mb-1">Pipeline Hub</p>
          <h1 className="hw-page-title">All Jobs</h1>
          <p className="hw-page-subtitle">
            {jobs.length} opportunit{jobs.length === 1 ? "y" : "ies"} tracked
            {needsActionCount > 0 && <> &middot; <span className="text-amber-600 font-medium">{needsActionCount} need{needsActionCount === 1 ? "s" : ""} action</span></>}
            {staleCount > 0 && <> &middot; <span className="text-orange-500 font-medium">{staleCount} stale</span></>}
          </p>
        </div>
        <Button
          size="sm"
          className="hw-btn-primary gap-1.5"
          onClick={() => setShowAddJob(v => !v)}
        >
          <Plus className="h-3.5 w-3.5" /> Add Job
        </Button>
      </div>

      {/* Add Job form (collapsible) */}
      {showAddJob && (
        <div className="hw-card p-5">
          <h2 className="hw-section-label mb-4">Analyze a Job</h2>
          <JobInputForm />
        </div>
      )}

      {/* Metric strip */}
      <div className="hw-metrics">
        {[
          { label: "Total",        value: jobs.length,           color: "text-foreground" },
          { label: "Active",       value: viewCounts.active,     color: "text-foreground" },
          { label: "Needs Action", value: needsActionCount,      color: needsActionCount > 0 ? "text-amber-600" : "text-foreground" },
          { label: "Ready",        value: viewCounts.ready,      color: "text-emerald-600" },
          { label: "Applied",      value: viewCounts.applied,    color: "text-blue-600" },
          { label: "Stale",        value: staleCount,            color: staleCount > 0 ? "text-orange-500" : "text-muted-foreground" },
        ].map(s => (
          <div key={s.label} className="hw-stat">
            <span className={cn("hw-stat-value", s.color)}>{s.value}</span>
            <span className="hw-stat-label">{s.label}</span>
          </div>
        ))}
      </div>

      {/* Workspace */}
      <div className="hw-workspace">
        {/* Main */}
        <div className="hw-workspace-main space-y-0">

          {/* View tabs */}
          <div className="flex items-end gap-0 border-b border-border">
            {VIEW_TABS.map(tab => (
              <button
                key={tab.key}
                onClick={() => { setActiveView(tab.key); setActiveFilter("all") }}
                className={cn(
                  "relative px-3.5 py-2.5 text-xs font-medium transition-colors border-b-2 -mb-px",
                  activeView === tab.key
                    ? "text-foreground border-primary"
                    : "text-muted-foreground border-transparent hover:text-foreground hover:border-border"
                )}
              >
                {tab.label}
                {viewCounts[tab.key] > 0 && tab.key !== "all" && (
                  <span className={cn(
                    "ml-1.5 text-[10px] font-bold tabular-nums px-1 py-0.5 rounded-full",
                    activeView === tab.key ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                  )}>
                    {viewCounts[tab.key]}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Filter chips + Sort */}
          <div className="flex items-center gap-2 py-3 overflow-x-auto">
            <div className="flex items-center gap-1.5 flex-1 flex-wrap">
              {(["all", "needs_evidence", "needs_materials", "needs_review", "ready_to_apply", "high_fit", "recently_added", "stale"] as FilterChip[]).map(chip => (
                <button
                  key={chip}
                  onClick={() => setActiveFilter(chip)}
                  className={cn(
                    "px-2.5 py-1 rounded-full text-[11px] font-medium whitespace-nowrap transition-all border",
                    activeFilter === chip
                      ? "bg-foreground text-background border-foreground"
                      : "bg-card text-muted-foreground border-border hover:border-foreground/30 hover:text-foreground"
                  )}
                >
                  {FILTER_LABELS[chip]}
                </button>
              ))}
            </div>

            {/* Sort dropdown */}
            <div className="relative shrink-0">
              <button
                onClick={() => setShowSort(v => !v)}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-card border border-border hover:border-foreground/30 text-muted-foreground hover:text-foreground transition-all"
              >
                <Filter className="h-3 w-3" />
                {SORT_LABELS[sortKey]}
                <ChevronDown className="h-3 w-3" />
              </button>
              {showSort && (
                <div className="absolute right-0 top-full mt-1 bg-card border border-border rounded-xl shadow-lg z-20 py-1 min-w-[180px]">
                  {(Object.keys(SORT_LABELS) as SortKey[]).map(key => (
                    <button
                      key={key}
                      onClick={() => { setSortKey(key); setShowSort(false) }}
                      className={cn(
                        "w-full text-left px-3.5 py-2 text-xs hover:bg-muted transition-colors",
                        sortKey === key ? "font-semibold text-primary" : "text-foreground"
                      )}
                    >
                      {SORT_LABELS[key]}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Job list */}
          {visible.length === 0 ? (
            <div className="hw-empty">
              <div className="hw-empty-icon">
                {jobs.length === 0 ? <Briefcase className="h-5 w-5 text-muted-foreground" /> : <Filter className="h-5 w-5 text-muted-foreground" />}
              </div>
              <div>
                <p className="text-sm font-semibold">
                  {jobs.length === 0 ? "No jobs tracked yet" : "No jobs match this view"}
                </p>
                <p className="text-xs text-muted-foreground mt-1 max-w-xs">
                  {jobs.length === 0
                    ? "Click \"Add Job\" to start your pipeline."
                    : "Try a different view tab or filter."}
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              {visible.map(job => <JobCard key={job.id} job={job} />)}
            </div>
          )}
        </div>

        {/* Right rail */}
        <IntelligencePanel jobs={jobs} />
      </div>
    </div>
  )
}
