import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { FileText, ArrowRight } from "lucide-react"
import { cn } from "@/lib/utils"

export const dynamic = "force-dynamic"

type DocJob = {
  id: string
  role_title: string | null
  company_name: string | null
  status: string | null
  generated_resume: string | null
  generated_cover_letter: string | null
  generation_timestamp: string | null
  created_at: string
}

function formatDate(dateStr: string | null) {
  if (!dateStr) return null
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

const STATUS_BADGE: Record<string, { label: string; className: string }> = {
  applied: { label: "Applied", className: "status-applied" },
  interviewing: { label: "Interviewing", className: "bg-indigo-50 text-indigo-700 border-indigo-200" },
  offered: { label: "Offered", className: "status-ready" },
  rejected: { label: "Closed", className: "bg-rose-50 text-rose-600 border-rose-200" },
  archived: { label: "Archived", className: "bg-stone-100 text-stone-500 border-stone-200" },
}

const ACTIVE_STATUSES = ["applied", "interviewing", "offered"]

function StatusBadge({ status }: { status: string | null }) {
  const badge = status ? STATUS_BADGE[status] : undefined
  if (!badge) {
    return (
      <span className="rounded-full border border-sky-200 bg-sky-50 px-2 py-0.5 text-[10px] font-semibold text-sky-700">
        Generated
      </span>
    )
  }
  return (
    <span className={cn("rounded-full border px-2 py-0.5 text-[10px] font-semibold", badge.className)}>
      {badge.label}
    </span>
  )
}

function DocRow({ job }: { job: DocJob }) {
  const initial = (job.company_name ?? job.role_title ?? "?").charAt(0).toUpperCase()
  const date = formatDate(job.generation_timestamp ?? job.created_at)
  return (
    <div className="hw-card flex items-center justify-between gap-4 px-5 py-4">
      <Link href={`/jobs/${job.id}`} className="group flex min-w-0 flex-1 items-center gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted text-sm font-bold text-muted-foreground">
          {initial}
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-foreground transition-colors group-hover:text-primary">
            {job.role_title ?? "Untitled role"}
          </p>
          <p className="truncate text-xs text-muted-foreground">
            {job.company_name ?? "—"}
            {date && <span className="hidden sm:inline"> · {date}</span>}
            {job.generated_cover_letter && (
              <span className="hidden sm:inline"> · + cover letter</span>
            )}
          </p>
        </div>
      </Link>
      <div className="flex shrink-0 items-center gap-3">
        <StatusBadge status={job.status} />
        <Link
          href={`/jobs/${job.id}/documents`}
          className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-xs font-medium transition-colors hover:border-primary/30"
        >
          View <ArrowRight className="h-3 w-3" />
        </Link>
      </div>
    </div>
  )
}

function Section({ title, jobs }: { title: string; jobs: DocJob[] }) {
  if (jobs.length === 0) return null
  return (
    <div>
      <div className="mb-2 flex items-center gap-2">
        <h2 className="hw-section-label">{title}</h2>
        <span className="text-[11px] text-muted-foreground tabular-nums">{jobs.length}</span>
      </div>
      <div className="flex flex-col gap-2">
        {jobs.map((job) => (
          <DocRow key={job.id} job={job} />
        ))}
      </div>
    </div>
  )
}

export default async function DocumentsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: jobs } = await supabase
    .from("jobs")
    .select(
      "id, role_title, company_name, status, generated_resume, generated_cover_letter, generation_timestamp, created_at",
    )
    .eq("user_id", user.id)
    .not("generated_resume", "is", null)
    .is("deleted_at", null)
    .order("generation_timestamp", { ascending: false, nullsFirst: false })
    .limit(50)

  const jobList = (jobs ?? []) as DocJob[]

  const activePipeline = jobList.filter((j) => ACTIVE_STATUSES.includes(j.status ?? ""))
  const archived = jobList.filter((j) => (j.status ?? "") === "archived")
  const generatedNotApplied = jobList.filter(
    (j) => !ACTIVE_STATUSES.includes(j.status ?? "") && (j.status ?? "") !== "archived",
  )

  return (
    <div className="hw-page">
      <div className="hw-page-header">
        <div>
          <h1 className="hw-page-title">Documents</h1>
          <p className="hw-page-subtitle">All generated resumes and cover letters.</p>
        </div>
        <div className="hw-stat">
          <span className="hw-stat-value">{jobList.length}</span>
          <span className="hw-stat-label">Packages generated</span>
        </div>
      </div>

      {jobList.length === 0 ? (
        <div className="hw-empty">
          <div className="hw-empty-icon">
            <FileText className="h-5 w-5 text-muted-foreground" />
          </div>
          <div>
            <p className="text-sm font-semibold">No documents generated yet</p>
            <p className="mt-1 max-w-xs text-xs text-muted-foreground">
              Analyze a job and generate your first Application Package to see your
              materials here.
            </p>
          </div>
          <Link href="/jobs">
            <Button size="sm" variant="outline">
              View pipeline
            </Button>
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          <Section title="Active pipeline" jobs={activePipeline} />
          <Section title="Generated" jobs={generatedNotApplied} />
          <Section title="Archived" jobs={archived} />
        </div>
      )}
    </div>
  )
}
