"use server"

import { createClient } from "@/lib/supabase/server"
import { getReadyJobIds } from "@/lib/readiness"
import { evaluateReadiness } from "@/lib/readiness/evaluator"
import { CoachChat } from "@/components/coach-chat"
import {
  Briefcase,
  CheckCircle2,
  FileText,
  BookOpen,
  ArrowRight,
  Plus,
  Zap,
  Activity,
  Star,
  ChevronRight,
} from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"

type RecentEvent = {
  id: number
  event_type: string
  job_id: string | null
  payload?: Record<string, unknown>
  metadata?: Record<string, unknown>
  created_at: string
}

const EVENT_LABEL: Record<string, string> = {
  application_submitted:  "Application submitted",
  documents_generated:    "Documents generated",
  quality_passed:         "Quality check passed",
  quality_failed:         "Quality check failed",
  evidence_added:         "Evidence added",
  evidence_updated:       "Evidence updated",
  evidence_deleted:       "Evidence removed",
  resume_uploaded:        "Resume uploaded",
  job_analyzed:           "Job analyzed",
  readiness_changed:      "Readiness updated",
  package_reviewed:       "Package accepted",
  package_invalidated:    "Package flagged for review",
  export_generated:       "Document exported",
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1)  return "just now"
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24)  return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

export const metadata = {
  title: "Coach | HireWire",
  description: "Strategic guidance grounded in your pipeline and Career Context.",
}

async function getCoachContext() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    const cutoff = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString()

    const [jobsResult, evidenceResult, readyResult, eventsResult] = await Promise.all([
      supabase
        .from("jobs")
        .select("id, role_title, company_name, status, applied_at, generated_resume, generated_cover_letter, evidence_map, quality_passed, generation_status")
        .eq("user_id", user.id)
        .is("deleted_at", null),
      supabase
        .from("evidence_library")
        .select("id, is_user_approved")
        .eq("user_id", user.id),
      getReadyJobIds(user.id),
      supabase
        .from("audit_events")
        .select("id, event_type, job_id, metadata, created_at")
        .eq("user_id", user.id)
        .gte("created_at", cutoff)
        .order("created_at", { ascending: false })
        .limit(8),
    ])

    const jobs = jobsResult.data ?? []
    const evidence = evidenceResult.data ?? []
    const readyIds = readyResult.ready ?? []
    const recentEvents: RecentEvent[] = (eventsResult.data ?? []).map(event => ({
      id: event.id,
      event_type: event.event_type,
      job_id: event.job_id,
      payload: event.metadata ?? {},
      metadata: event.metadata ?? {},
      created_at: event.created_at,
    }))
    const evaluatedJobs = jobs.map(job => ({ job, readiness: evaluateReadiness(job) }))

    const activeJobs = jobs.length
    const appliedJobs = evaluatedJobs.filter(({ readiness }) => readiness.outcome === "applied").length
    const withMaterials = evaluatedJobs.filter(({ readiness }) => readiness.checklist.resume || readiness.checklist.coverLetter).length
    const evidenceCount = evidence.length
    const approvedEvidence = evidence.filter(e => e.is_user_approved).length

    // Find the highest-readiness non-applied job for the "best opportunity" card
    const topJob = jobs
      .filter(j => j.status !== "applied")
      .find(j => j.quality_passed) ?? jobs.find(j => j.status !== "applied") ?? null

    const urgentReady = recentEvents.find(
      e => e.event_type === "readiness_changed" && e.payload?.can_apply === true
    ) ?? null

    return {
      activeJobs,
      appliedJobs,
      readyCount: readyIds.length,
      withMaterials,
      evidenceCount,
      approvedEvidence,
      recentEvents,
      urgentReady,
      topJob,
      hasNoEvidence: evidenceCount === 0,
      hasNoPipeline: activeJobs === 0,
    }
  } catch {
    return null
  }
}

// ── Sub-components ────────────────────────────────────────────────────────────

function RailLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground mb-2.5">
      {children}
    </p>
  )
}

function StatRow({
  label,
  value,
  href,
  accent = false,
}: {
  label: string
  value: string | number
  href?: string
  accent?: boolean
}) {
  const content = (
    <div className={cn(
      "flex items-center justify-between py-2 px-2.5 rounded-lg transition-colors",
      href && "hover:bg-black/4 cursor-pointer group",
    )}>
      <span className="text-xs text-muted-foreground">{label}</span>
      <div className="flex items-center gap-1">
        <span className={cn(
          "text-xs font-semibold tabular-nums",
          accent ? "text-primary" : "text-foreground"
        )}>
          {value}
        </span>
        {href && <ChevronRight className="h-2.5 w-2.5 text-muted-foreground/0 group-hover:text-muted-foreground/50 transition-colors" />}
      </div>
    </div>
  )
  return href ? <Link href={href}>{content}</Link> : content
}

function ActionItem({
  label,
  description,
  href,
  icon: Icon,
  highlight = false,
}: {
  label: string
  description?: string
  href: string
  icon: React.ElementType
  highlight?: boolean
}) {
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all group",
        highlight
          ? "bg-primary/8 border border-primary/15 hover:bg-primary/12"
          : "hover:bg-black/4 border border-transparent"
      )}
    >
      <div className={cn(
        "h-7 w-7 rounded-lg flex items-center justify-center shrink-0",
        highlight ? "bg-primary/15" : "bg-foreground/6"
      )}>
        <Icon className={cn("h-3.5 w-3.5", highlight ? "text-primary" : "text-foreground/60")} />
      </div>
      <div className="flex-1 min-w-0">
        <span className={cn("text-xs font-medium block", highlight ? "text-primary" : "text-foreground")}>
          {label}
        </span>
        {description && (
          <span className="text-[10px] text-muted-foreground">{description}</span>
        )}
      </div>
      <ArrowRight className="h-3 w-3 text-muted-foreground/30 group-hover:text-muted-foreground/60 transition-colors shrink-0" />
    </Link>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function CoachPage() {
  const ctx = await getCoachContext()

  const evidenceStatus =
    !ctx || ctx.evidenceCount === 0
      ? "Not started"
      : ctx.approvedEvidence < 3
      ? "Building"
      : ctx.approvedEvidence >= 6
      ? "Strong"
      : "In progress"

  const evidenceStrong = evidenceStatus === "Strong"
  const evidenceLow = ctx?.evidenceCount === 0 || (ctx?.approvedEvidence ?? 0) < 2

  // Derive which quick actions are most relevant right now
  const priorityActions = (() => {
    if (!ctx) return []
    const actions = []
    if (ctx.hasNoPipeline) {
      actions.push({ label: "Add your first job", description: "Start your pipeline", href: "/jobs", icon: Plus, highlight: true })
    }
    if (ctx.hasNoEvidence) {
      actions.push({ label: "Build Career Context", description: "Add achievements & proof", href: "/evidence", icon: BookOpen, highlight: !ctx.hasNoPipeline })
    }
    if (ctx.readyCount > 0) {
      actions.push({ label: `${ctx.readyCount} ready to apply`, description: "Jobs cleared all checks", href: "/ready-to-apply", icon: CheckCircle2, highlight: true })
    }
    if (ctx.withMaterials > 0 && !ctx.hasNoPipeline) {
      actions.push({ label: "Review your materials", description: "Resume & cover letter", href: "/documents", icon: FileText, highlight: false })
    }
    if (ctx.activeJobs > 0) {
      actions.push({ label: "View pipeline", description: `${ctx.activeJobs} active job${ctx.activeJobs !== 1 ? "s" : ""}`, href: "/jobs", icon: Briefcase, highlight: false })
    }
    // Always offer pipeline entry
    if (!ctx.hasNoPipeline) {
      actions.push({ label: "Add another job", description: "Analyze a new opportunity", href: "/jobs", icon: Plus, highlight: false })
    }
    return actions.slice(0, 4)
  })()

  return (
    <div className="flex flex-col h-[calc(100vh-2.5rem)]">

      {/* ── Page Header ── */}
      <div className="shrink-0 px-6 pt-5 pb-4 border-b border-border/70">
        <div className="flex items-start justify-between gap-4">
          <div>
            {/* Editorial label */}
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-primary mb-1">
              AI Coach
            </p>
            <h1 className="text-lg font-bold tracking-tight text-foreground leading-none">
              Career Coach
            </h1>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed max-w-sm">
              Strategic guidance grounded in your pipeline, Career Context, and application materials.
            </p>
          </div>

          {/* Grounded indicator */}
          <div className={cn(
            "shrink-0 flex items-center gap-2 px-3 py-2 rounded-xl border",
            evidenceLow
              ? "bg-amber-50 border-amber-200/60"
              : "bg-primary/6 border-primary/15"
          )}>
            <div className={cn(
              "h-1.5 w-1.5 rounded-full",
              evidenceLow ? "bg-amber-400" : "bg-primary animate-pulse"
            )} />
            <span className={cn(
              "text-[10px] font-semibold",
              evidenceLow ? "text-amber-700" : "text-primary"
            )}>
              {evidenceLow ? "Low evidence — add Career Context" : "Grounded in verified evidence"}
            </span>
          </div>
        </div>
      </div>

      {/* ── Two-column layout ── */}
      <div className="flex-1 flex overflow-hidden">

        {/* Main chat panel */}
        <div className="flex-1 flex flex-col min-w-0 border-r border-border/70">
          <CoachChat className="h-full" />
        </div>

        {/* ── Right context rail ── */}
        <aside className="hidden lg:flex flex-col w-72 xl:w-80 shrink-0 overflow-y-auto">

          {/* Dark intelligence surface — pipeline at a glance */}
          <div
            className="shrink-0 p-4 border-b border-white/6"
            style={{ backgroundColor: "#111110" }}
          >
            <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-white/40 mb-3">
              Pipeline at a glance
            </p>
            <div className="space-y-0.5">
              <div className="flex items-center justify-between py-1.5">
                <span className="text-xs text-white/50">Active jobs</span>
                <span className="text-xs font-semibold text-white tabular-nums">{ctx?.activeJobs ?? "—"}</span>
              </div>
              <div className="flex items-center justify-between py-1.5">
                <span className="text-xs text-white/50">Ready to apply</span>
                <span className={cn(
                  "text-xs font-semibold tabular-nums",
                  (ctx?.readyCount ?? 0) > 0 ? "text-[#22c55e]" : "text-white/40"
                )}>
                  {ctx?.readyCount ?? "—"}
                </span>
              </div>
              <div className="flex items-center justify-between py-1.5">
                <span className="text-xs text-white/50">With materials</span>
                <span className="text-xs font-semibold text-white tabular-nums">{ctx?.withMaterials ?? "—"}</span>
              </div>
              <div className="flex items-center justify-between py-1.5">
                <span className="text-xs text-white/50">Applied</span>
                <span className="text-xs font-semibold text-white tabular-nums">{ctx?.appliedJobs ?? "—"}</span>
              </div>
              <div className="flex items-center justify-between py-1.5 border-t border-white/8 mt-1 pt-2">
                <span className="text-xs text-white/50">Career Context</span>
                <span className={cn(
                  "text-xs font-semibold",
                  evidenceStrong ? "text-[#22c55e]" : evidenceLow ? "text-amber-400" : "text-white"
                )}>
                  {evidenceStatus}
                </span>
              </div>
              <div className="flex items-center justify-between py-1.5">
                <span className="text-xs text-white/50">Evidence items</span>
                <span className="text-xs font-semibold text-white tabular-nums">
                  {ctx ? `${ctx.approvedEvidence} / ${ctx.evidenceCount}` : "—"}
                </span>
              </div>
            </div>

            {/* Urgent ready job */}
            {ctx?.urgentReady && (
              <Link href={ctx.urgentReady.job_id ? `/jobs/${ctx.urgentReady.job_id}` : "/ready-to-apply"}>
                <div className="mt-3 rounded-xl bg-primary/20 border border-primary/30 px-3 py-2.5 flex items-center gap-2.5 hover:bg-primary/25 transition-colors">
                  <Star className="h-3 w-3 text-primary shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-semibold text-primary">Job ready to apply</p>
                    <p className="text-[10px] text-white/40 mt-0.5">Cleared all readiness checks</p>
                  </div>
                  <ArrowRight className="h-3 w-3 text-primary/60 shrink-0" />
                </div>
              </Link>
            )}

            {/* No pipeline nudge */}
            {ctx?.hasNoPipeline && (
              <Link href="/jobs">
                <div className="mt-3 rounded-xl bg-white/5 border border-white/10 px-3 py-2.5 hover:bg-white/8 transition-colors">
                  <p className="text-[11px] font-medium text-white/60">No pipeline yet</p>
                  <p className="text-[10px] text-white/30 mt-0.5">Add a job to unlock pipeline guidance →</p>
                </div>
              </Link>
            )}
          </div>

          {/* Next Best Actions — pipeline-adaptive */}
          {priorityActions.length > 0 && (
            <div className="p-4 border-b border-border/70">
              <RailLabel>Next best actions</RailLabel>
              <div className="space-y-1">
                {priorityActions.map((action) => (
                  <ActionItem key={action.href + action.label} {...action} />
                ))}
              </div>
            </div>
          )}

          {/* Recent Activity */}
          {ctx?.recentEvents && ctx.recentEvents.length > 0 && (
            <div className="p-4 border-b border-border/70">
              <div className="flex items-center gap-1.5 mb-2.5">
                <Activity className="h-2.5 w-2.5 text-muted-foreground" />
                <RailLabel>Recent activity</RailLabel>
              </div>
              <div className="space-y-2">
                {ctx.recentEvents.slice(0, 5).map(event => (
                  <div key={event.id} className="flex items-start justify-between gap-2">
                    {event.job_id ? (
                      <Link
                        href={`/jobs/${event.job_id}`}
                        className="text-xs text-foreground hover:text-primary transition-colors leading-snug flex-1 min-w-0 truncate"
                      >
                        {EVENT_LABEL[event.event_type] ?? event.event_type}
                      </Link>
                    ) : (
                      <span className="text-xs text-foreground leading-snug flex-1 min-w-0 truncate">
                        {EVENT_LABEL[event.event_type] ?? event.event_type}
                      </span>
                    )}
                    <span className="text-[10px] text-muted-foreground shrink-0 tabular-nums">
                      {timeAgo(event.created_at)}
                    </span>
                  </div>
                ))}
              </div>
              <Link href="/logs" className="mt-3 block text-[10px] text-primary hover:underline font-medium">
                View full activity log →
              </Link>
            </div>
          )}

          {/* Grounding note */}
          <div className="p-4 mt-auto">
            <div className="rounded-xl bg-foreground/4 border border-border px-3 py-3">
              <div className="flex items-start gap-2">
                <Zap className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" />
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Coach responses are grounded in your verified evidence. Claims not backed by your Career Context will be flagged.
                </p>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}
