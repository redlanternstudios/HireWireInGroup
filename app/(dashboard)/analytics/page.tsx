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


  // Join job_scores for canonical analytics
  const { data: jobs } = await supabase
    .from("jobs")
    .select(`status, created_at, job_scores (overall_score)`)
    .eq("user_id", user.id)
    .is("deleted_at", null)
    .order("created_at", { ascending: false })

  const jobList = jobs ?? []
  const total = jobList.length
  const applied = jobList.filter(j => ["applied","interviewing","offered","rejected"].includes(j.status)).length
  const generated = jobList.filter(j => j.status !== "draft" && j.status !== "analyzing" && j.status !== "queued").length
  // Use job_scores.overall_score as canonical, fallback to null
  const scores = jobList.map(j => (Array.isArray(j.job_scores) && j.job_scores[0]?.overall_score != null) ? j.job_scores[0].overall_score : null).filter(s => s != null)
  const avgScore = scores.length ? Math.round(scores.reduce((a, s) => a + (s ?? 0), 0) / scores.length) : null

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
        (() => {
          const { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription, EmptyContent } = require("@/components/ui/empty")
          const { Button } = require("@/components/ui/button")
          const { getClientMessage } = require("@/lib/comms/client-messages")
          const Link = require("next/link")
          const { BarChart3 } = require("lucide-react")
          const msg = getClientMessage('analytics.empty')
          return (
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <BarChart3 className="h-10 w-10 text-muted-foreground/40" />
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
      )

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
