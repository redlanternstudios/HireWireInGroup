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
  Send,
  Star,
} from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"

type RecentEvent = {
  id: number
  event_type: string
  job_id: string | null
  payload: Record<string, unknown>
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
        .select("id, status, applied_at, generated_resume, generated_cover_letter, evidence_map, quality_passed")
        .eq("user_id", user.id)
        .is("deleted_at", null),
      supabase
        .from("evidence_library")
        .select("id, is_user_approved")
        .eq("user_id", user.id),
      getReadyJobIds(user.id),
      supabase
        .from("domain_events")
        .select("id, event_type, job_id, payload, created_at")
        .eq("user_id", user.id)
        .gte("created_at", cutoff)
        .order("created_at", { ascending: false })
        .limit(8),
    ])

    const jobs = jobsResult.data ?? []
    const evidence = evidenceResult.data ?? []
    const readyIds = readyResult.ready ?? []
    const recentEvents = (eventsResult.data ?? []) as RecentEvent[]
    const evaluatedJobs = jobs.map(job => ({ job, readiness: evaluateReadiness(job) }))

    const activeJobs = jobs.length
    const appliedJobs = evaluatedJobs.filter(({ readiness }) => readiness.outcome === "applied").length
    const withMaterials = evaluatedJobs.filter(({ readiness }) => readiness.checklist.resume || readiness.checklist.coverLetter).length
    const evidenceCount = evidence.length
    const approvedEvidence = evidence.filter(e => e.is_user_approved).length

    // Surface the most recent readiness_changed event where a job became apply-ready
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
    }
  } catch {
    return null
  }
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
      "flex items-center justify-between py-2.5 px-3 rounded-lg transition-colors",
      href && "hover:bg-black/3 cursor-pointer",
    )}>
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className={cn(
        "text-sm font-semibold tabular-nums",
        accent ? "text-primary" : "text-foreground"
      )}>
        {value}
      </span>
    </div>
  )
  return href ? <Link href={href}>{content}</Link> : content
}

function ActionItem({
  label,
  href,
  icon: Icon,
}: {
  label: string
  href: string
  icon: React.ElementType
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg hover:bg-black/4 transition-colors group"
    >
      <div className="h-6 w-6 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
        <Icon className="h-3.5 w-3.5 text-primary" />
      </div>
      <span className="text-sm text-foreground flex-1">{label}</span>
      <ArrowRight className="h-3.5 w-3.5 text-muted-foreground/40 group-hover:text-muted-foreground transition-colors" />
    </Link>
  )
}

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

  const evidenceAccent = evidenceStatus === "Strong"

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      {/* Page header */}
      <div className="shrink-0 px-6 pt-6 pb-4 border-b border-border">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-foreground">Career Coach</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Strategic guidance grounded in your pipeline, Career Context, and application materials.
            </p>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/8 border border-primary/15">
            <div className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
            <span className="text-xs font-medium text-primary">Grounded in your verified evidence</span>
          </div>
        </div>
      </div>

      {/* Two-column layout */}
      <div className="flex-1 flex overflow-hidden">

        {/* Main chat panel */}
        <div className="flex-1 flex flex-col min-w-0 border-r border-border">
          <CoachChat className="h-full" />
        </div>

        {/* Right context rail — hidden on mobile */}
        <aside className="hidden lg:flex flex-col w-72 xl:w-80 shrink-0 overflow-y-auto bg-[hsl(40,8%,89%)]">

          {/* Coach Context */}
          <div className="p-4 border-b border-border">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-3">
              Coach Context
            </p>
            <div className="space-y-0.5">
              <StatRow
                label="Active jobs"
                value={ctx?.activeJobs ?? "—"}
                href="/jobs"
              />
              <StatRow
                label="Ready to apply"
                value={ctx?.readyCount ?? "—"}
                href="/ready-to-apply"
                accent={(ctx?.readyCount ?? 0) > 0}
              />
              <StatRow
                label="With materials"
                value={ctx?.withMaterials ?? "—"}
                href="/documents"
              />
              <StatRow
                label="Applied"
                value={ctx?.appliedJobs ?? "—"}
                href="/applications"
              />
              <StatRow
                label="Career Context"
                value={evidenceStatus}
                href="/evidence"
                accent={evidenceAccent}
              />
              <StatRow
                label="Evidence items"
                value={
                  ctx
                    ? `${ctx.approvedEvidence} / ${ctx.evidenceCount}`
                    : "—"
                }
                href="/evidence"
              />
            </div>

            {/* Fallback if no data */}
            {ctx?.activeJobs === 0 && (
              <div className="mt-3 px-3 py-2.5 rounded-lg bg-primary/6 border border-primary/12">
                <p className="text-xs text-primary font-medium">No pipeline data yet</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Add a job to unlock pipeline guidance.
                </p>
              </div>
            )}
          </div>

          {/* Urgent CTA — job just became ready */}
          {ctx?.urgentReady && (
            <div className="p-4 border-b border-border">
              <Link href={ctx.urgentReady.job_id ? `/jobs/${ctx.urgentReady.job_id}` : "/ready-to-apply"}>
                <div className="rounded-lg bg-primary/8 border border-primary/20 px-3 py-3 flex items-start gap-2.5 hover:bg-primary/12 transition-colors">
                  <Star className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-semibold text-primary">Job ready to apply</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      A job just cleared all readiness checks. Review and submit.
                    </p>
                  </div>
                  <ArrowRight className="h-3 w-3 text-primary/60 shrink-0 mt-1 ml-auto" />
                </div>
              </Link>
            </div>
          )}

          {/* Next Best Actions */}
          <div className="p-4 border-b border-border">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-3">
              Next Best Actions
            </p>
            <div className="space-y-0.5">
              <ActionItem label="Add a job" href="/jobs" icon={Plus} />
              <ActionItem label="Build Career Context" href="/evidence" icon={BookOpen} />
              <ActionItem label="Review pipeline" href="/jobs" icon={Briefcase} />
              <ActionItem label="Ready to Apply queue" href="/ready-to-apply" icon={CheckCircle2} />
              <ActionItem label="View materials" href="/documents" icon={FileText} />
            </div>
          </div>

          {/* Recent Activity */}
          {ctx?.recentEvents && ctx.recentEvents.length > 0 && (
            <div className="p-4 border-b border-border">
              <div className="flex items-center gap-1.5 mb-3">
                <Activity className="h-3 w-3 text-muted-foreground" />
                <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                  Recent Activity
                </p>
              </div>
              <div className="space-y-2.5">
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
              <Link href="/logs" className="mt-3 block text-[11px] text-primary hover:underline">
                View full activity log →
              </Link>
            </div>
          )}

          {/* Quick context note */}
          <div className="p-4 mt-auto">
            <div className="rounded-lg bg-foreground/4 border border-border px-3 py-3">
              <div className="flex items-start gap-2">
                <Zap className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" />
                <p className="text-xs text-muted-foreground leading-relaxed">
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
