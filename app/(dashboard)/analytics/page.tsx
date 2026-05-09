import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { BarChart3, Lock } from "lucide-react"
import Link from "next/link"

export const dynamic = "force-dynamic"

export default async function AnalyticsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: userData } = await supabase
    .from("users")
    .select("plan_type")
    .eq("id", user.id)
    .single()

  const isPro = userData?.plan_type === "pro"

  const { data: jobs } = await supabase
    .from("jobs")
    .select("status, created_at, overall_score")
    .eq("user_id", user.id)
    .is("deleted_at", null)
    .order("created_at", { ascending: false })

  const jobList = jobs ?? []
  const total = jobList.length
  const applied = jobList.filter(j => ["applied","interviewing","offered","rejected"].includes(j.status)).length
  const generated = jobList.filter(j => j.status !== "draft" && j.status !== "analyzing" && j.status !== "queued").length
  const avgScore = jobList.filter(j => j.overall_score).length
    ? Math.round(jobList.filter(j => j.overall_score).reduce((a, j) => a + (j.overall_score ?? 0), 0) / jobList.filter(j => j.overall_score).length)
    : null

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Analytics</h1>
        <p className="text-muted-foreground mt-1">
          Your job search performance at a glance.
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="rounded-xl border border-border bg-card p-5">
          <p className="text-sm text-muted-foreground">Jobs tracked</p>
          <p className="text-3xl font-semibold mt-1">{total}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-5">
          <p className="text-sm text-muted-foreground">Documents generated</p>
          <p className="text-3xl font-semibold mt-1">{generated}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-5">
          <p className="text-sm text-muted-foreground">Applications sent</p>
          <p className="text-3xl font-semibold mt-1">{applied}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-5">
          <p className="text-sm text-muted-foreground">Avg. fit score</p>
          <p className="text-3xl font-semibold mt-1">{avgScore !== null ? `${avgScore}%` : "—"}</p>
        </div>
      </div>

      {!isPro && (
        <div className="rounded-xl border border-border bg-card p-10 flex flex-col items-center justify-center text-center gap-4">
          <div className="rounded-full border border-border p-4">
            <Lock className="h-6 w-6 text-muted-foreground" />
          </div>
          <div>
            <p className="font-medium">Detailed analytics is a Pro feature</p>
            <p className="text-sm text-muted-foreground mt-1">
              Upgrade to see application funnel breakdown, score trends, and keyword coverage over time.
            </p>
          </div>
          <Link
            href="/billing"
            className="inline-flex items-center rounded-lg bg-[#7B1212] px-4 py-2 text-sm font-medium text-white hover:bg-[#6a0f0f] transition-colors"
          >
            Upgrade to Pro
          </Link>
        </div>
      )}

      {isPro && (
        <div className="rounded-xl border border-border bg-card p-10 flex flex-col items-center justify-center text-center gap-3">
          <BarChart3 className="h-10 w-10 text-muted-foreground/40" />
          <p className="font-medium">Detailed charts coming soon</p>
          <p className="text-sm text-muted-foreground">Full analytics dashboard is in development.</p>
        </div>
      )}
    </div>
  )
}
