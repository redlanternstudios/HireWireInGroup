import { createClient } from "@/lib/supabase/server"
import { redirect, notFound } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { GenerateButton } from "./GenerateButton"
import { ChevronLeft, ExternalLink, RefreshCw, CheckCircle2, AlertTriangle, FileText, Lock } from "lucide-react"

export const dynamic = "force-dynamic"

const STATUS_CLASS: Record<string, string> = {
  draft: "status-draft", analyzing: "status-analyzing", analyzed: "status-analyzing",
  generating: "status-analyzing", ready: "status-ready", applied: "status-applied",
  interviewing: "status-applied", offered: "status-offered", rejected: "status-rejected",
}
const STATUS_LABEL: Record<string, string> = {
  draft: "Draft", analyzing: "Analyzing", analyzed: "Analyzed", generating: "Generating",
  ready: "Ready", applied: "Applied", interviewing: "Interviewing", offered: "Offered", rejected: "Rejected",
}

function ScoreBar({ label, value }: { label: string; value: number }) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">{label}</span>
        <span className="text-xs font-semibold tabular-nums">{Math.round(value)}</span>
      </div>
      <div className="quality-bar">
        <div className="quality-bar-fill" style={{ width: `${Math.min(100, Math.round(value))}%` }} />
      </div>
    </div>
  )
}

export default async function JobDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: job, error: jobError } = await supabase
    .from("jobs")
    .select("id, role_title, company_name, job_url, status, fit, score, generated_resume, generated_cover_letter, created_at, generation_timestamp")
    .eq("id", id)
    .eq("user_id", user.id)
    .is("deleted_at", null)
    .single()

  if (jobError || !job) notFound()

  const [{ data: analysis }, { data: scores }, { data: userData }] = await Promise.all([
    supabase.from("job_analyses").select("matched_skills, known_gaps, summary").eq("job_id", id).eq("user_id", user.id).maybeSingle(),
    supabase.from("job_scores").select("overall_score, skills_match, experience_relevance, seniority_alignment").eq("job_id", id).maybeSingle(),
    supabase.from("users").select("plan_type").eq("id", user.id).maybeSingle(),
  ])

  const matchedSkills: string[] = Array.isArray(analysis?.matched_skills) ? analysis.matched_skills : []
  const knownGaps: string[] = Array.isArray(analysis?.known_gaps) ? analysis.known_gaps : []
  const hasDocs = !!(job.generated_resume || job.generated_cover_letter)
  const isAnalyzed = !!(analysis || scores)
  const overallScore = scores?.overall_score ?? job.score ?? null
  const isFreePlan = !userData?.plan_type || userData.plan_type === "free"
  const stillProcessing = ["analyzing", "queued", "generating"].includes(job.status)

  return (
    <div className="hw-page max-w-3xl">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2">
        <Link href="/jobs" className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
          <ChevronLeft className="h-3.5 w-3.5" /> All Jobs
        </Link>
      </div>

      {/* Job header */}
      <div className="hw-card px-6 py-5">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-xl font-semibold tracking-tight text-foreground">
              {job.role_title ?? "Untitled role"}
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">{job.company_name ?? "—"}</p>
            {job.job_url && (
              <a
                href={job.job_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-primary hover:underline mt-2"
              >
                View posting <ExternalLink className="h-3 w-3" />
              </a>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Badge variant="outline" className={`text-[10px] font-medium ${STATUS_CLASS[job.status] ?? "status-draft"}`}>
              {STATUS_LABEL[job.status] ?? job.status}
            </Badge>
            {job.fit && (
              <Badge variant="outline" className={`text-[10px] font-medium ${
                job.fit === "HIGH" ? "status-ready" : job.fit === "MEDIUM" ? "status-analyzing" : "status-rejected"
              }`}>
                {job.fit} fit
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Processing state */}
      {stillProcessing && (
        <div className="hw-card px-6 py-8 flex flex-col items-center text-center gap-3">
          <RefreshCw className="h-5 w-5 text-amber-600 animate-spin" />
          <div>
            <p className="text-sm font-semibold">Analysis in progress</p>
            <p className="text-xs text-muted-foreground mt-1">This usually takes 15–30 seconds.</p>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="inline-flex items-center gap-1.5 text-xs hw-card px-3 py-1.5 hover:border-primary/30 transition-colors"
          >
            <RefreshCw className="h-3.5 w-3.5" /> Refresh
          </button>
        </div>
      )}

      {/* Analysis results */}
      {!stillProcessing && isAnalyzed && (
        <>
          {/* Fit scores */}
          {(overallScore !== null || scores?.skills_match || scores?.experience_relevance) && (
            <div className="hw-card px-6 py-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Fit Analysis</h2>
                {overallScore !== null && (
                  <span className="text-2xl font-bold tabular-nums text-foreground">
                    {Math.round(Number(overallScore))}
                    <span className="text-sm font-normal text-muted-foreground">/100</span>
                  </span>
                )}
              </div>
              <div className="space-y-3">
                {scores?.skills_match != null && (
                  <ScoreBar label="Skills match" value={Number(scores.skills_match)} />
                )}
                {scores?.experience_relevance != null && (
                  <ScoreBar label="Experience relevance" value={Number(scores.experience_relevance)} />
                )}
                {scores?.seniority_alignment != null && (
                  <ScoreBar label="Seniority alignment" value={Number(scores.seniority_alignment)} />
                )}
              </div>
            </div>
          )}

          {/* Summary */}
          {analysis?.summary && (
            <div className="hw-card px-6 py-5">
              <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3">Summary</h2>
              <p className="text-sm text-foreground leading-relaxed">{analysis.summary}</p>
            </div>
          )}

          {/* Two-col: strengths + gaps */}
          {(matchedSkills.length > 0 || knownGaps.length > 0) && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {matchedSkills.length > 0 && (
                <div className="hw-card px-5 py-4">
                  <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3">What you bring</h2>
                  <ul className="space-y-2">
                    {matchedSkills.map((skill, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0 mt-0.5" />
                        <span>{skill}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {knownGaps.length > 0 && (
                <div className="hw-card px-5 py-4">
                  <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3">Gaps to address</h2>
                  <ul className="space-y-2">
                    {knownGaps.map((gap, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <AlertTriangle className="h-3.5 w-3.5 text-amber-500 shrink-0 mt-0.5" />
                        <span>{gap.replace(/^Gap:\s*/i, "")}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Documents */}
          <div className="hw-card px-6 py-5">
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Documents</h2>
              {hasDocs && job.generation_timestamp && (
                <span className="text-[10px] text-muted-foreground">
                  Generated {new Date(job.generation_timestamp).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground mb-4">
              {hasDocs
                ? "Your tailored resume and cover letter are ready."
                : "Generate a resume and cover letter tailored to this role."}
            </p>
            {hasDocs ? (
              <div className="flex items-center gap-3">
                <Link href={`/jobs/${job.id}/documents`}>
                  <Button size="sm" className="hw-btn-primary gap-1.5">
                    <FileText className="h-3.5 w-3.5" /> View documents
                  </Button>
                </Link>
                {job.generated_cover_letter && (
                  <span className="text-xs text-muted-foreground border border-border rounded px-2 py-1">
                    + Cover letter
                  </span>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                <GenerateButton jobId={job.id} />
                {isFreePlan && (
                  <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Lock className="h-3 w-3" />
                    Free plan: up to 5 generations/month.{" "}
                    <a href="/billing" className="text-primary hover:underline">Upgrade to Pro</a> for unlimited.
                  </p>
                )}
              </div>
            )}
          </div>
        </>
      )}

      {/* No analysis yet */}
      {!stillProcessing && !isAnalyzed && (
        <div className="hw-card px-6 py-8 flex flex-col items-center text-center gap-3">
          <AlertTriangle className="h-5 w-5 text-muted-foreground" />
          <div>
            <p className="text-sm font-semibold">Analysis not available</p>
            <p className="text-xs text-muted-foreground mt-1">
              No results for this job. Try re-submitting from the{" "}
              <Link href="/jobs" className="text-primary hover:underline">jobs page</Link>.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
