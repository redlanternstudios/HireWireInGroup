
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
<<<<<<< HEAD
import { History } from "lucide-react"
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription, EmptyContent } from "@/components/ui/empty"
import { Button } from "@/components/ui/button"
import { getClientMessage } from "@/lib/comms/client-messages"
import Link from "next/link"
=======
import Link from "next/link"
import { Button } from "@/components/ui/button"
import {
  History, CheckCircle, XCircle, AlertTriangle, Info, Clock,
  Plus, Briefcase, ArrowRight, FileText, Zap,
} from "lucide-react"
>>>>>>> 7e1a8af916b56410048e0bfccadd90f00d881991

export const dynamic = "force-dynamic"

function formatDate(dateStr: string) {
  const d = new Date(dateStr)
  return d.toLocaleString("en-US", {
    month: "short", day: "numeric",
    hour: "numeric", minute: "2-digit",
    hour12: true,
  })
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return "Just now"
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
}

const STATUS_CONFIG: Record<string, { icon: React.ElementType; bg: string; text: string; dot: string }> = {
  success: { icon: CheckCircle, bg: "bg-emerald-50",  text: "text-emerald-700", dot: "bg-emerald-500" },
  error:   { icon: XCircle,     bg: "bg-rose-50",     text: "text-rose-700",    dot: "bg-rose-500" },
  warning: { icon: AlertTriangle, bg: "bg-amber-50",  text: "text-amber-700",   dot: "bg-amber-500" },
  info:    { icon: Info,         bg: "bg-blue-50",    text: "text-blue-700",    dot: "bg-blue-500" },
  pending: { icon: Clock,        bg: "bg-stone-100",  text: "text-stone-600",   dot: "bg-stone-400" },
}

const EVENT_CATEGORIES = [
  { key: "job_analysis",    label: "Job Analysis",    desc: "AI parsing and fit scoring" },
  { key: "document_gen",    label: "Doc Generation",  desc: "Resume and cover letter creation" },
  { key: "quality_review",  label: "Quality Review",  desc: "Evidence and claim verification" },
  { key: "profile_update",  label: "Profile Update",  desc: "Career context changes" },
]

export default async function LogsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  // Unified activity log: career_activity_log (fallback: processing_events if empty)
  let { data: events } = await supabase
    .from("career_activity_log")
    .select("id, object_type, object_id, summary, metadata, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(100)

  let eventList = events ?? []

  // Fallback to processing_events if career_activity_log is empty (for legacy)
  if (eventList.length === 0) {
    const { data: legacyEvents } = await supabase
      .from("processing_events")
      .select("id, event_type, status, message, metadata, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(100)
    eventList = legacyEvents ?? []
  }

<<<<<<< HEAD
  const STATUS_COLORS: Record<string, string> = {
    success: "bg-green-100 text-green-800",
    error: "bg-red-100 text-red-800",
    warning: "bg-yellow-100 text-yellow-800",
    info: "bg-blue-100 text-blue-800",
    pending: "bg-gray-100 text-gray-700",
    default: "bg-gray-100 text-gray-700",
  }
=======
  const successCount = eventList.filter(e => e.status === "success").length
  const errorCount = eventList.filter(e => e.status === "error").length
  const pendingCount = eventList.filter(e => e.status === "pending").length
>>>>>>> 7e1a8af916b56410048e0bfccadd90f00d881991

  return (
    <div className="hw-page">
      {/* ─── Header ─── */}
      <div className="hw-page-header">
        <div>
          <p className="hw-section-label mb-1">Audit Trail</p>
          <h1 className="hw-page-title">Activity Log</h1>
          <p className="hw-page-subtitle">Every processing event across your jobs, documents, and pipeline.</p>
        </div>
      </div>

<<<<<<< HEAD
      {eventList.length === 0 ? (
        (() => {
          const msg = getClientMessage('logs.empty')
          return (
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <History className="h-10 w-10 text-muted-foreground/40" />
                </EmptyMedia>
                <EmptyTitle>{msg?.subject}</EmptyTitle>
                <EmptyDescription>{msg?.body}</EmptyDescription>
              </EmptyHeader>
              {msg?.actionLabel && msg?.nextAction && (
                <EmptyContent>
                  <Button asChild variant="default">
                    <Link href={msg.nextAction}>{msg.actionLabel}</Link>
                  </Button>
                </EmptyContent>
              )}
            </Empty>
          )
        })()
      ) : (
        <div className="rounded-xl border border-border bg-card divide-y divide-border">
          {eventList.map((event) => {
            // career_activity_log: summary, object_type, object_id, metadata
            // processing_events: event_type, status, message, metadata
            const isLegacy = !!event.event_type
            const status = isLegacy ? event.status : (event.metadata?.status || "default")
            const title = isLegacy ? event.event_type : event.object_type
            const message = isLegacy ? event.message : event.summary
            return (
              <div key={event.id} className="flex items-start gap-4 px-6 py-4">
                <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium shrink-0 mt-0.5 ${STATUS_COLORS[status] ?? STATUS_COLORS.default}`}>
                  {status}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">{title}</p>
                  {message && (
                    <p className="text-sm text-muted-foreground mt-0.5 truncate">{message}</p>
                  )}
                </div>
                <p className="text-xs text-muted-foreground shrink-0 mt-0.5">
                  {new Date(event.created_at).toLocaleString()}
                </p>
              </div>
            )
          })}
        </div>
      )}
=======
      {/* ─── Metric Strip ─── */}
      <div className="hw-metrics">
        <div className="hw-stat">
          <span className="hw-stat-value">{eventList.length}</span>
          <span className="hw-stat-label">Total events</span>
        </div>
        <div className="hw-stat">
          <span className="hw-stat-value text-emerald-600">{successCount}</span>
          <span className="hw-stat-label">Success</span>
        </div>
        <div className="hw-stat">
          <span className="hw-stat-value text-rose-500">{errorCount}</span>
          <span className="hw-stat-label">Errors</span>
        </div>
        <div className="hw-stat">
          <span className="hw-stat-value text-amber-600">{pendingCount}</span>
          <span className="hw-stat-label">Pending</span>
        </div>
      </div>

      {/* ─── Workspace ─── */}
      <div className="hw-workspace">
        {/* Main — Timeline */}
        <div className="hw-workspace-main">
          {eventList.length === 0 ? (
            <div className="hw-empty">
              <div className="hw-empty-icon">
                <History className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm font-semibold">No activity yet</p>
                <p className="text-xs text-muted-foreground mt-1 max-w-sm">
                  Events appear here as you add jobs, run analysis, and generate documents. Your complete processing history will live here.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Link href="/jobs/new">
                  <Button size="sm" className="hw-btn-primary gap-1.5">
                    <Plus className="h-3.5 w-3.5" /> Add a job
                  </Button>
                </Link>
                <Link href="/jobs">
                  <Button size="sm" variant="outline" className="gap-1.5">
                    <Briefcase className="h-3.5 w-3.5" /> View pipeline
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
            <div className="hw-card overflow-hidden">
              <div className="divide-y divide-border/60">
                {eventList.map((event) => {
                  const cfg = STATUS_CONFIG[event.status] ?? STATUS_CONFIG.pending
                  const Icon = cfg.icon
                  return (
                    <div key={event.id} className="flex items-start gap-4 px-5 py-4 group hover:bg-accent/30 transition-colors">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${cfg.bg}`}>
                        <Icon className={`h-3.5 w-3.5 ${cfg.text}`} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-semibold text-foreground">{event.event_type}</p>
                          <span className={`inline-flex items-center gap-1 text-[10px] font-medium ${cfg.text}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                            {event.status}
                          </span>
                        </div>
                        {event.message && (
                          <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{event.message}</p>
                        )}
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="text-[11px] text-muted-foreground">{timeAgo(event.created_at)}</p>
                        <p className="text-[10px] text-muted-foreground/60 mt-0.5 hidden sm:block">{formatDate(event.created_at)}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        {/* Right Rail */}
        <div className="hw-workspace-rail">
          {/* What gets logged */}
          <div>
            <h2 className="hw-section-label mb-3">What Gets Logged</h2>
            <div className="hw-panel p-4 space-y-3">
              {EVENT_CATEGORIES.map(cat => (
                <div key={cat.key} className="flex items-start gap-2.5">
                  <Zap className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-semibold text-foreground">{cat.label}</p>
                    <p className="text-[11px] text-muted-foreground">{cat.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Status legend */}
          <div className="mt-4">
            <h2 className="hw-section-label mb-2">Status Key</h2>
            <div className="hw-panel p-4 space-y-2">
              {Object.entries(STATUS_CONFIG).map(([key, cfg]) => {
                const Icon = cfg.icon
                return (
                  <div key={key} className="flex items-center gap-2">
                    <Icon className={`h-3.5 w-3.5 ${cfg.text} shrink-0`} />
                    <p className="text-xs font-medium text-foreground capitalize">{key}</p>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Navigation */}
          <div className="mt-4">
            <h2 className="hw-section-label mb-2">Quick Links</h2>
            <div className="space-y-2">
              {[
                { href: "/jobs/new", icon: Plus, label: "Add Job", desc: "Start new analysis" },
                { href: "/jobs", icon: Briefcase, label: "Pipeline", desc: "View all jobs" },
                { href: "/documents", icon: FileText, label: "Materials", desc: "Your documents" },
              ].map(item => (
                <Link key={item.href} href={item.href}>
                  <div className="hw-card px-3.5 py-3 flex items-center gap-3 group">
                    <item.icon className="h-3.5 w-3.5 text-primary shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-foreground">{item.label}</p>
                      <p className="text-[11px] text-muted-foreground">{item.desc}</p>
                    </div>
                    <ArrowRight className="h-3 w-3 text-muted-foreground/40 group-hover:text-primary transition-colors" />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
>>>>>>> 7e1a8af916b56410048e0bfccadd90f00d881991
    </div>
  )
}
