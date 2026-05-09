import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Send } from "lucide-react"

export const dynamic = "force-dynamic"

const STATUS_COLORS: Record<string, string> = {
  applied: "bg-purple-100 text-purple-800",
  interviewing: "bg-blue-100 text-blue-800",
  offered: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-800",
}

const STATUS_LABELS: Record<string, string> = {
  applied: "Applied",
  interviewing: "Interviewing",
  offered: "Offered",
  rejected: "Rejected",
}

export default async function ApplicationsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: jobs } = await supabase
    .from("jobs")
    .select("id, role_title, company_name, status, created_at")
    .eq("user_id", user.id)
    .in("status", ["applied", "interviewing", "offered", "rejected"])
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(50)

  const jobList = jobs ?? []

  const counts = {
    applied: jobList.filter(j => j.status === "applied").length,
    interviewing: jobList.filter(j => j.status === "interviewing").length,
    offered: jobList.filter(j => j.status === "offered").length,
    rejected: jobList.filter(j => j.status === "rejected").length,
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Applications</h1>
        <p className="text-muted-foreground mt-1">
          Track every application you&apos;ve submitted.
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {(["applied", "interviewing", "offered", "rejected"] as const).map((status) => (
          <div key={status} className="rounded-xl border border-border bg-card p-5">
            <p className="text-sm text-muted-foreground capitalize">{STATUS_LABELS[status]}</p>
            <p className="text-3xl font-semibold mt-1">{counts[status]}</p>
          </div>
        ))}
      </div>

      {jobList.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-12 flex flex-col items-center justify-center text-center gap-4">
          <Send className="h-10 w-10 text-muted-foreground/40" />
          <div>
            <p className="font-medium">No applications yet</p>
            <p className="text-sm text-muted-foreground mt-1">
              Mark a job as &quot;Applied&quot; from its detail page to track it here.
            </p>
          </div>
          <Link
            href="/ready-queue"
            className="inline-flex items-center rounded-lg bg-[#7B1212] px-4 py-2 text-sm font-medium text-white hover:bg-[#6a0f0f] transition-colors"
          >
            View ready queue
          </Link>
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card divide-y divide-border">
          {jobList.map((job) => (
            <Link
              key={job.id}
              href={`/jobs/${job.id}`}
              className="flex items-center justify-between px-6 py-4 gap-4 hover:bg-muted/50 transition-colors"
            >
              <div className="min-w-0 flex-1">
                <p className="font-medium text-sm truncate">{job.role_title ?? "Untitled role"}</p>
                <p className="text-sm text-muted-foreground truncate">{job.company_name ?? "—"}</p>
              </div>
              <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium shrink-0 ${STATUS_COLORS[job.status] ?? "bg-gray-100 text-gray-700"}`}>
                {STATUS_LABELS[job.status] ?? job.status}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
