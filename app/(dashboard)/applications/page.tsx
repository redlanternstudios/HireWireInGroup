import { sanitizeCoachContext, sanitizeRecommendations } from "@/lib/coach/context/sanitize"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import Link from "next/link"

import { Send } from "lucide-react"
import { buildCoachContext } from "@/lib/coach/context/build-context"
import { detectCoachSignals } from "@/lib/coach/signals/engine"
import { generateRecommendations } from "@/lib/coach/recommendations"
import { sortRecommendations } from "@/lib/coach/recommendations/priority"
import { WorkflowCoachPanelClient } from "@/components/coach/WorkflowCoachPanelClient"

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

  // Build CoachContext for applications
  const coachContext = buildCoachContext({
    workflowStage: "applications",
    blockers: [],
    readiness: null,
    evidenceCoverage: null,
    fitScore: null,
    generationHistory: [],
    applicationHistory: jobList.map(j => ({ status: j.status, date: j.created_at })),
    recentOutcomes: [],
    userPreferences: {},
    currentPage: "/applications",
    currentAction: "applications",
  })
  const coachMemory = { priorRecommendations: [], acceptedRecommendations: [], ignoredRecommendations: [], generationOutcomes: [], applicationOutcomes: [], recurringWeakAreas: [] }
  const coachSignals = detectCoachSignals(coachContext, coachMemory)
  let coachRecommendations = generateRecommendations(coachContext, coachSignals)
  coachRecommendations = coachRecommendations.filter((rec, idx, arr) => arr.findIndex(r => r.message === rec.message) === idx)
  coachRecommendations = sortRecommendations(coachRecommendations)
  const coachInsights: string[] = []
  const coachMomentum = undefined
  const showCoach = (coachRecommendations.length > 0 || coachInsights.length > 0)

  return (
    <div className="space-y-8">
      {/* Embedded Coach Panel */}
      {showCoach && (
        <div className="mb-4">
          <WorkflowCoachPanelClient
            recommendations={sanitizeRecommendations(coachRecommendations)}
            blockers={[]}
            insights={Array.isArray(coachInsights) ? coachInsights.map(String) : []}
            momentum={coachMomentum ? String(coachMomentum) : undefined}
          />
        </div>
      )}
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
        (() => {
          const { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription, EmptyContent } = require("@/components/ui/empty")
          const { Button } = require("@/components/ui/button")
          const { getClientMessage } = require("@/lib/comms/client-messages")
          const Link = require("next/link")
          const { Send } = require("lucide-react")
          const msg = getClientMessage('applications.empty')
          return (
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <Send className="h-10 w-10 text-muted-foreground/40" />
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
