import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import Link from "next/link"


import { JobsPageHeader } from "./JobsPageHeader"
import { JobIntakeCard } from "./JobIntakeCard"
import { PipelineSummaryTiles } from "./PipelineSummaryTiles"
import { PipelineFilters } from "./PipelineFilters"
import { JobPipelineBoard } from "./JobPipelineBoard"
import { JobIntelligencePanel } from "./JobIntelligencePanel"
import { JobsPipelineClient } from "./JobsPipelineClient"

export const dynamic = "force-dynamic"

const STATUS_LABELS: Record<string, string> = {
  draft: "Draft",
  queued: "Queued",
  analyzing: "Analyzing…",
  analyzed: "Analyzed",
  generating: "Generating…",
  ready: "Ready",
  needs_review: "Needs review",
  applied: "Applied",
  interviewing: "Interviewing",
  offered: "Offered",
  rejected: "Rejected",
  archived: "Archived",
  error: "Error",
}

const STATUS_COLORS: Record<string, string> = {
  ready: "bg-green-100 text-green-800",
  needs_review: "bg-yellow-100 text-yellow-800",
  generating: "bg-blue-100 text-blue-800",
  analyzing: "bg-blue-100 text-blue-800",
  applied: "bg-purple-100 text-purple-800",
  interviewing: "bg-purple-100 text-purple-800",
  offered: "bg-green-100 text-green-800",
  error: "bg-red-100 text-red-800",
}

export default async function JobsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/login")


  const { data: jobs } = await supabase
    .from("jobs")
    .select("id, role_title, company_name, status, generated_resume, created_at")
    .eq("user_id", user.id)
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(100)

  const jobList = Array.isArray(jobs) ? jobs : []

  // Move filter state to client component

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Jobs</h1>
        <p className="text-muted-foreground mt-1">
          Paste a job URL to analyze fit and generate tailored documents.
        </p>
      </div>

      <div className="rounded-xl border border-border bg-card p-6">
        <h2 className="text-base font-medium mb-4">Analyze a job</h2>
        <JobInputForm />
      </div>

      {jobList.length > 0 && (
        <div className="rounded-xl border border-border bg-card">
          <div className="px-6 py-4 border-b border-border">
            <h2 className="text-base font-medium">Your jobs</h2>
          </div>
          <ul className="divide-y divide-border">
            return (
              <JobsPipelineClient jobs={jobList} />
            )
                      {statusLabel}
