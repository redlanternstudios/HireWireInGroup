// NOTE: Coach Governance: Analyze missing state bug
// If you see 'Analysis not available' after Analyze, it means either:
// - job.analysis_status is not 'analyzed' or equivalent
// - job_analyses row is missing
// - requirement graph is missing
// - evidence match is below threshold
// - generation is being attempted before analysis is valid
// Generation must be blocked in these cases. See COACH_CONSTITUTION.md.
import { createClient } from "@/lib/supabase/server"
import { redirect, notFound } from "next/navigation"
import Link from "next/link"
import { GenerateButton } from "./GenerateButton"
import { getWorkflowState } from "@/lib/job-workflow"

export const dynamic = "force-dynamic"

const FIT_COLORS: Record<string, string> = {
  HIGH: "bg-green-100 text-green-800",
  MEDIUM: "bg-yellow-100 text-yellow-800",
  LOW: "bg-red-100 text-red-800",
}

export default async function JobDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/login")


  // Fetch evidence_map and other workflow fields for workflow state
  const { data: job, error: jobError } = await supabase
    .from("jobs")
    .select(
      "id, role_title, company_name, job_url, status, fit, score, generated_resume, generated_cover_letter, created_at, evidence_map, quality_passed, generation_quality_issues, score_gaps"
    )
    .eq("id", id)
    .eq("user_id", user.id)
    .is("deleted_at", null)
    .single()
  // Derive workflow state for this job
  const workflowState = getWorkflowState(job, job.id)
  // Next step CTA logic
  const nextAction = workflowState.nextAction
  const blockers = workflowState.blockers

  if (jobError || !job) notFound()

  const [{ data: analysis }, { data: scores }, { data: userData }] = await Promise.all([
    supabase
      .from("job_analyses")
      .select("matched_skills, known_gaps")
      .eq("job_id", id)
      .eq("user_id", user.id)
      .maybeSingle(),
    supabase
      .from("job_scores")
      .select("overall_score, skills_match, experience_relevance, seniority_alignment")
      .eq("job_id", id)
      .maybeSingle(),
    supabase
      .from("users")
      .select("plan_type")
      .eq("id", user.id)
      .maybeSingle(),
  ])

  const matchedSkills: string[] = Array.isArray(analysis?.matched_skills)
    ? analysis.matched_skills
    : []
  const knownGaps: string[] = Array.isArray(analysis?.known_gaps)
    ? analysis.known_gaps
    : []

  const hasDocs = !!(job.generated_resume || job.generated_cover_letter)
  const isAnalyzed = !!(analysis || scores)
  const fitLabel = job.fit as string | null
  const fitColor = fitLabel ? (FIT_COLORS[fitLabel] ?? "bg-gray-100 text-gray-700") : null
  const overallScore = scores?.overall_score ?? job.score ?? null
  const isFreePlan = !userData?.plan_type || userData.plan_type === "free"

  const stillProcessing =
    job.status === "analyzing" || job.status === "queued" || job.status === "generating"

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Next step CTA card */}
      {nextAction && (
        <div className="rounded-xl border border-primary bg-card p-6 flex flex-col items-center text-center mb-2">
          <p className="text-base font-semibold mb-2">Next step</p>
          <a
            href={nextAction.href}
            className={`inline-flex items-center rounded-md px-4 py-2.5 text-sm font-medium transition-colors ${blockers.length > 0 ? 'bg-muted text-muted-foreground cursor-not-allowed' : 'bg-primary text-white hover:bg-primary/90'}`}
            aria-disabled={blockers.length > 0}
            tabIndex={blockers.length > 0 ? -1 : 0}
            {...(blockers.length > 0 ? { onClick: (e) => e.preventDefault() } : {})}
          >
            {nextAction.label}
          </a>
          <p className="text-xs text-muted-foreground mt-2">{nextAction.description}</p>
          {blockers.length > 0 && (
            <ul className="mt-2 text-xs text-red-600 list-disc list-inside">
              {blockers.map((b, i) => (
                <li key={i}>{b}</li>
              ))}
            </ul>
          )}
        </div>
      )}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/jobs" className="hover:text-foreground transition-colors">
          Jobs
        </Link>
        <span>/</span>
        <span className="text-foreground truncate">
          {job.role_title ?? "Untitled role"}
        </span>
      </div>

      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          {job.role_title ?? "Untitled role"}
        </h1>
        <p className="text-muted-foreground mt-0.5">{job.company_name ?? "—"}</p>
        {job.job_url && (
          <a
            href={job.job_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-primary hover:underline mt-1 inline-block"
          >
            View original posting ↗
          </a>
        )}
      </div>

      {stillProcessing && (
        <div className="rounded-xl border border-border bg-card p-6 text-center space-y-2">
          <p className="font-medium">Analysis in progress…</p>
          <p className="text-sm text-muted-foreground">
            This usually takes 15–30 seconds. Refresh the page to see results.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="mt-2 rounded-md border border-border px-3 py-1.5 text-sm hover:bg-muted/50 transition-colors"
          >
            Refresh
          </button>
        </div>
      )}

      {!stillProcessing && isAnalyzed && (
        <>
          {/* Fit score */}
          <div className="rounded-xl border border-border bg-card p-6">
            <h2 className="text-base font-medium mb-4">Fit summary</h2>
            <div className="flex items-center gap-4 flex-wrap">
              {fitLabel && fitColor && (
                <div className="flex flex-col items-center gap-1">
                  <span
                    className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-semibold ${fitColor}`}
                  >
                    {fitLabel} fit
                  </span>
                  <span className="text-xs text-muted-foreground">Overall fit</span>
                </div>
              )}
              {overallScore !== null && (
                <div className="flex flex-col items-center gap-1">
                  <span className="text-2xl font-semibold">
                    {Math.round(Number(overallScore))}
                    <span className="text-sm font-normal text-muted-foreground">/100</span>
                  </span>
                  <span className="text-xs text-muted-foreground">Score</span>
                </div>
              )}
              {scores?.skills_match !== null && scores?.skills_match !== undefined && (
                <div className="flex flex-col items-center gap-1">
                  <span className="text-lg font-semibold">
                    {Math.round(Number(scores.skills_match))}
                    <span className="text-xs font-normal text-muted-foreground">/100</span>
                  </span>
                  <span className="text-xs text-muted-foreground">Skills match</span>
                </div>
              )}
              {scores?.experience_relevance !== null &&
                scores?.experience_relevance !== undefined && (
                  <div className="flex flex-col items-center gap-1">
                    <span className="text-lg font-semibold">
                      {Math.round(Number(scores.experience_relevance))}
                      <span className="text-xs font-normal text-muted-foreground">/100</span>
                    </span>
                    <span className="text-xs text-muted-foreground">Experience</span>
                  </div>
                )}
            </div>
          </div>

          {/* Matched skills */}
          {matchedSkills.length > 0 && (
            <div className="rounded-xl border border-border bg-card p-6">
              <h2 className="text-base font-medium mb-3">What you bring</h2>
              <ul className="space-y-1.5">
                {matchedSkills.map((skill, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <span className="mt-0.5 text-green-600 shrink-0">✓</span>
                    <span>{skill}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Known gaps */}
          {knownGaps.length > 0 && (
            <div className="rounded-xl border border-border bg-card p-6">
              <h2 className="text-base font-medium mb-3">Gaps to address</h2>
              <ul className="space-y-1.5">
                {knownGaps.map((gap, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <span className="mt-0.5 text-yellow-600 shrink-0">△</span>
                    <span>{gap.replace(/^Gap:\s*/i, "")}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Generate / view documents */}
          <div className="rounded-xl border border-border bg-card p-6">
            <h2 className="text-base font-medium mb-1">Documents</h2>
            <p className="text-sm text-muted-foreground mb-4">
              {hasDocs
                ? "Your tailored resume and cover letter are ready."
                : "Generate a resume and cover letter tailored to this role."}
            </p>
            {hasDocs ? (
              <Link
                href={`/jobs/${job.id}/documents`}
                className="inline-flex items-center rounded-md bg-black text-white px-4 py-2.5 text-sm font-medium hover:bg-gray-800 transition-colors"
              >
                View documents →
              </Link>
            ) : (
              <>
                <GenerateButton jobId={job.id} />
                {isFreePlan && (
                  <p className="mt-2 text-xs text-muted-foreground">
                    Free plan: up to 5 generations/month.{" "}
                    <a href="/billing" className="text-primary hover:underline">
                      Upgrade to Pro
                    </a>{" "}
                    for unlimited.
                  </p>
                )}
              </>
            )}
          </div>
        </>
      )}

      {!stillProcessing && !isAnalyzed && (
        <div className="rounded-xl border border-border bg-card p-6">
          <p className="text-sm text-muted-foreground">
            Analysis results are not available yet for this job. If this is unexpected,
            try re-submitting the job URL from the{" "}
            <Link href="/jobs" className="text-primary hover:underline">
              jobs page
            </Link>
            .
          </p>
        </div>
      )}
    </div>
  )
}
