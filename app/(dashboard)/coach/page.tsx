import { createClient } from "@/lib/supabase/server"
import { getReadyJobIds } from "@/lib/readiness"
import { CoachChat } from "@/components/coach-chat"
import {
  Briefcase,
  CheckCircle2,
  FileText,
  BookOpen,
  ArrowRight,
  Plus,
  Zap,
} from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"

export const metadata = {
  title: "Coach | HireWire",
  description: "Strategic guidance grounded in your pipeline and Career Context.",
}

async function getCoachContext() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    const [jobsResult, evidenceResult, readyResult] = await Promise.all([
      supabase
        .from("jobs")
        .select("id, status, generation_status, quality_passed")
        .eq("user_id", user.id)
        .is("deleted_at", null),
      supabase
        .from("evidence_library")
        .select("id, is_user_approved")
        .eq("user_id", user.id),
      getReadyJobIds(user.id),
    ])

    const jobs = jobsResult.data ?? []
    const evidence = evidenceResult.data ?? []
    const readyIds = readyResult.readyJobIds ?? []

    const activeJobs = jobs.length
    const appliedJobs = jobs.filter(j => j.status === "applied").length
    const withMaterials = jobs.filter(j => j.generation_status === "complete").length
    const evidenceCount = evidence.length
    const approvedEvidence = evidence.filter(e => e.is_user_approved).length

    return {
      activeJobs,
      appliedJobs,
      readyCount: readyIds.length,
      withMaterials,
      evidenceCount,
      approvedEvidence,
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
      href && "hover:bg-black/[0.03] cursor-pointer",
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
      className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg hover:bg-black/[0.04] transition-colors group"
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
                href="/ready-queue"
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

          {/* Next Best Actions */}
          <div className="p-4 border-b border-border">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-3">
              Next Best Actions
            </p>
            <div className="space-y-0.5">
              <ActionItem label="Add a job" href="/jobs" icon={Plus} />
              <ActionItem label="Build Career Context" href="/evidence" icon={BookOpen} />
              <ActionItem label="Review pipeline" href="/jobs" icon={Briefcase} />
              <ActionItem label="Ready to Apply queue" href="/ready-queue" icon={CheckCircle2} />
              <ActionItem label="View materials" href="/documents" icon={FileText} />
            </div>
          </div>

          {/* Quick context note */}
          <div className="p-4 mt-auto">
            <div className="rounded-lg bg-foreground/[0.04] border border-border px-3 py-3">
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
