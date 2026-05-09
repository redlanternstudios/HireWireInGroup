import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { BarChart3, Lock, TrendingUp } from "lucide-react"

export const dynamic = "force-dynamic"

export default async function AnalyticsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const [{ data: userData }, { data: jobs }] = await Promise.all([
    supabase.from("users").select("plan_type").eq("id", user.id).single(),
    supabase.from("jobs").select("id, status, created_at, job_scores(overall_score)").eq("user_id", user.id).is("deleted_at", null).order("created_at", { ascending: false }),
  ])

  const isPro = userData?.plan_type === "pro"
  const jobList = jobs ?? []
  const total = jobList.length
  const applied = jobList.filter(j => ["applied", "interviewing", "offered", "rejected"].includes(j.status)).length
  const generated = jobList.filter(j => !["draft", "analyzing", "queued"].includes(j.status)).length

  const scoredJobs = jobList.filter(j => {
    const scores = j.job_scores
    const score = Array.isArray(scores) ? scores[0]?.overall_score : (scores as { overall_score?: number } | null)?.overall_score
    return typeof score === "number"
  })
  const avgScore = scoredJobs.length
    ? Math.round(scoredJobs.reduce((a, j) => {
        const scores = j.job_scores
        const score = Array.isArray(scores) ? scores[0]?.overall_score : (scores as { overall_score?: number } | null)?.overall_score
        return a + (score ?? 0)
      }, 0) / scoredJobs.length)
    : null

  const conversionRate = applied > 0 && total > 0 ? Math.round((applied / total) * 100) : null

  return (
    <div className="hw-page">
      <div className="hw-page-header">
        <div>
          <h1 className="hw-page-title">Analytics</h1>
          <p className="hw-page-subtitle">Your job search performance at a glance.</p>
        </div>
        {!isPro && (
          <Link href="/billing">
            <Button size="sm" className="hw-btn-primary gap-1.5">
              <TrendingUp className="h-3.5 w-3.5" /> Upgrade to Pro
            </Button>
          </Link>
        )}
      </div>

      {/* Stats */}
      <div className="flex gap-3 flex-wrap">
        <div className="hw-stat"><span className="hw-stat-value">{total}</span><span className="hw-stat-label">Jobs tracked</span></div>
        <div className="hw-stat"><span className="hw-stat-value">{generated}</span><span className="hw-stat-label">Docs generated</span></div>
        <div className="hw-stat"><span className="hw-stat-value text-blue-600">{applied}</span><span className="hw-stat-label">Applications</span></div>
        <div className="hw-stat">
          <span className="hw-stat-value">{avgScore !== null ? `${avgScore}%` : "—"}</span>
          <span className="hw-stat-label">Avg fit score</span>
        </div>
        {conversionRate !== null && (
          <div className="hw-stat">
            <span className="hw-stat-value">{conversionRate}%</span>
            <span className="hw-stat-label">Apply rate</span>
          </div>
        )}
      </div>

      {/* Status breakdown */}
      {total > 0 && (
        <div className="hw-card p-5">
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-4">Pipeline Breakdown</h2>
          <div className="space-y-3">
            {[
              { label: "Draft / In progress", count: jobList.filter(j => ["draft", "analyzing", "generating", "analyzed"].includes(j.status)).length, color: "bg-muted-foreground/40" },
              { label: "Ready to apply", count: jobList.filter(j => j.status === "ready").length, color: "bg-emerald-500" },
              { label: "Applied", count: jobList.filter(j => j.status === "applied").length, color: "bg-blue-500" },
              { label: "Interviewing", count: jobList.filter(j => j.status === "interviewing").length, color: "bg-blue-400" },
              { label: "Offered", count: jobList.filter(j => j.status === "offered").length, color: "bg-violet-500" },
              { label: "Rejected", count: jobList.filter(j => j.status === "rejected").length, color: "bg-rose-400" },
            ].filter(row => row.count > 0).map(row => (
              <div key={row.label} className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground w-36 shrink-0">{row.label}</span>
                <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                  <div
                    className={`h-full rounded-full ${row.color} transition-all`}
                    style={{ width: `${Math.max(4, Math.round((row.count / total) * 100))}%` }}
                  />
                </div>
                <span className="text-xs font-medium text-foreground tabular-nums w-4 text-right">{row.count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pro gate */}
      {!isPro && (
        <div className="hw-card p-10 flex flex-col items-center justify-center text-center gap-4">
          <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
            <Lock className="h-5 w-5 text-muted-foreground" />
          </div>
          <div>
            <p className="text-sm font-semibold">Detailed analytics is a Pro feature</p>
            <p className="text-xs text-muted-foreground mt-1 max-w-sm">
              Upgrade to see application funnel breakdown, score trends, and keyword coverage over time.
            </p>
          </div>
          <Link href="/billing">
            <Button size="sm" className="hw-btn-primary">Upgrade to Pro</Button>
          </Link>
        </div>
      )}

      {isPro && (
        <div className="hw-card p-10 flex flex-col items-center justify-center text-center gap-3">
          <BarChart3 className="h-10 w-10 text-muted-foreground/40" />
          <p className="text-sm font-semibold">Detailed charts coming soon</p>
          <p className="text-xs text-muted-foreground">Full analytics dashboard is in development.</p>
        </div>
      )}
    </div>
  )
}
