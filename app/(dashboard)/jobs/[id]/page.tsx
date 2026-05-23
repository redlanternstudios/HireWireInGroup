import { createClient } from "@/lib/supabase/server"
import { redirect, notFound } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { GenerateButton } from "./GenerateButton"
import { AnalyzeJobButton } from "./AnalyzeJobButton"
import ReadinessChecklist from "@/components/ReadinessChecklist"
import { ReadinessContextBanner } from "@/components/workflow/ReadinessContextBanner"
import {
  ChevronLeft,
  ExternalLink,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Lock,
  ArrowRight,
  Zap,
} from "lucide-react"
import {
  getWorkflowState,
  STAGE_LABELS,
  WORKFLOW_STAGES,
  type WorkflowStage,
} from "@/lib/job-workflow"
import { evaluateReadiness } from "@/lib/readiness/evaluator"
import { getCoachStepState } from "@/lib/coach-step"
import type { Job } from "@/lib/types"
import { OutcomeTracker } from "@/components/jobs/OutcomeTracker"
import { RequirementCoachModal } from "@/components/coach/RequirementCoachModal"

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

function ScoreBar({ label, value, note }: { label: string; value: number; note?: string }) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">{label}</span>
        <span className="text-xs font-semibold tabular-nums">{Math.round(value)}</span>
      </div>
      <div className="quality-bar">
        <div className="quality-bar-fill" style={{ width: `${Math.min(100, Math.round(value))}%` }} />
      </div>
      {note && <p className="text-[11px] text-muted-foreground">{note}</p>}
    </div>
  )
}

/** Horizontal stage progress strip */
function WorkflowProgress({ stage }: { stage: WorkflowStage }) {
  const currentIndex = WORKFLOW_STAGES.indexOf(stage)
  const visibleStages: WorkflowStage[] = [
    "job_ingested", "job_parsed", "evidence_mapped", "fit_scored", "materials_generated", "ready",
  ]
  return (
    <div className="flex items-center gap-0">
      {visibleStages.map((s, i) => {
        const idx = WORKFLOW_STAGES.indexOf(s)
        const done = idx < currentIndex
        const active = s === stage
        return (
          <div key={s} className="flex items-center flex-1 min-w-0">
            <div className="flex flex-col items-center gap-1 flex-1">
              <div
                className={[
                  "h-1.5 w-full rounded-full transition-all",
                  done ? "bg-emerald-500" : active ? "bg-primary" : "bg-border",
                ].join(" ")}
              />
              <span className={[
                "text-[9px] font-medium uppercase tracking-wide text-center leading-tight hidden sm:block",
                done ? "text-emerald-600" : active ? "text-primary" : "text-muted-foreground/50",
              ].join(" ")}>
                {STAGE_LABELS[s]}
              </span>
            </div>
            {i < visibleStages.length - 1 && (
              <div className="w-2 h-1.5 shrink-0" />
            )}
          </div>
        )
      })}
    </div>
  )
}

/** The always-visible next step CTA banner — never returns null */
function NextStepBanner({ workflow, jobId, hasDocs, hasUrl }: {
  workflow: ReturnType<typeof getWorkflowState>
  jobId: string
  hasDocs: boolean
  hasUrl: boolean
}) {
  const { stage, nextAction, blockers } = workflow

  if (stage === "applied") {
    return (
      <div className="hw-card px-5 py-4 flex items-center gap-3 border-l-4 border-l-emerald-500">
        <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
        <div>
          <p className="text-sm font-semibold text-foreground">Application submitted</p>
          <p className="text-xs text-muted-foreground">Track your progress in the Applications tab.</p>
        </div>
        <Link href="/applications" className="ml-auto shrink-0">
          <Button size="sm" variant="outline" className="gap-1.5 text-xs">
            Track <ArrowRight className="h-3 w-3" />
          </Button>
        </Link>
      </div>
    )
  }

  if (hasDocs) {
    return (
      <div className="hw-card px-5 py-4 flex items-center gap-3 border-l-4 border-l-primary">
        <Zap className="h-5 w-5 text-primary shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground">Materials ready</p>
          <p className="text-xs text-muted-foreground">Your tailored resume and cover letter are generated.</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Link href={`/jobs/${jobId}/resume`}>
            <Button size="sm" variant="outline" className="gap-1.5 text-xs">
              <Zap className="h-3.5 w-3.5" /> Intelligence
            </Button>
          </Link>
          <Link href={`/jobs/${jobId}/documents`}>
            <Button size="sm" className="hw-btn-primary gap-1.5 text-xs">
              <FileText className="h-3.5 w-3.5" /> Documents
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  if (!nextAction) return null

  if (stage === "job_ingested") {
    return (
      <div className="hw-card px-5 py-4 flex items-center gap-3 border-l-4 border-l-primary">
        <ArrowRight className="h-5 w-5 text-primary shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground">Next: Analyze Job</p>
          <p className="text-xs text-muted-foreground">Extract requirements, score your fit, and unlock coaching.</p>
        </div>
        <div className="shrink-0">
          <AnalyzeJobButton jobId={jobId} hasUrl={hasUrl} label="Analyze Job" size="sm" />
        </div>
      </div>
    )
  }

  return (
    <div className="hw-card px-5 py-4 flex items-center gap-3 border-l-4 border-l-primary">
      <ArrowRight className="h-5 w-5 text-primary shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-foreground">Next: {nextAction.label}</p>
        <p className="text-xs text-muted-foreground">{nextAction.description}</p>
        {blockers.length > 0 && (
          <ul className="mt-1 space-y-0.5">
            {blockers.map((b) => (
              <li key={b} className="flex items-center gap-1 text-[11px] text-amber-600">
                <AlertTriangle className="h-3 w-3 shrink-0" /> {b}
              </li>
            ))}
          </ul>
        )}
      </div>
      <Link href={nextAction.href} className="shrink-0">
        <Button size="sm" className="hw-btn-primary gap-1.5 text-xs">
          {nextAction.label} <ArrowRight className="h-3 w-3" />
        </Button>
      </Link>
    </div>
  )
}

function ReadinessNextStepCard({
  readiness,
  jobId,
}: {
  readiness: ReturnType<typeof evaluateReadiness>
  jobId: string
}) {
  if (readiness.outcome !== "active") {
    return (
      <div className="hw-card border-l-4 border-l-emerald-500 px-5 py-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="hw-section-label mb-1">Next step</p>
            <p className="text-sm font-semibold text-foreground">
              {readiness.outcome.replace(/_/g, " ")} — tracking outcomes
            </p>
            <p className="text-xs text-muted-foreground">
              This job has moved into outcome tracking.
            </p>
          </div>
          <Link href="/applications" className="shrink-0">
            <Button size="sm" variant="outline" className="gap-1.5">
              View applications <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  const action = readiness.isReady && readiness.canApply
    ? {
        label: "Apply now",
        href: `/ready-to-apply?jobId=${encodeURIComponent(jobId)}`,
        description: "Submit through the readiness gate.",
      }
    : readiness.nextAction

  if (!action) return null

  return (
    <div className="hw-card border-l-4 border-l-primary px-5 py-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="hw-section-label mb-1">Next step</p>
          <p className="text-sm text-muted-foreground">{action.description}</p>
        </div>
        <Link href={action.href} className="shrink-0">
          <Button size="sm" className="hw-btn-primary gap-1.5">
            {action.label} <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </Link>
      </div>
    </div>
  )
}

export default async function JobDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  // Fetch full job row so job-workflow.ts has all required fields
  const { data: job, error: jobError } = await supabase
    .from("jobs")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .is("deleted_at", null)
    .single()

  if (jobError || !job) notFound()

  const [{ data: analysis }, { data: scores }, { data: userData }] = await Promise.all([
    supabase
      .from("job_analyses")
      .select("matched_skills, known_gaps, qualifications_required, responsibilities, title, company, location")
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

  // Merge analysis fields into job so workflow functions can read them.
  const jobWithAnalysis: Job = {
    ...job,
    title: job.role_title ?? job.title ?? analysis?.title ?? "Untitled role",
    company: job.company_name ?? job.company ?? analysis?.company ?? "",
    qualifications_required:
      (job.qualifications_required?.length ?? 0) > 0
        ? job.qualifications_required
        : (analysis?.qualifications_required?.length ?? 0) > 0
          ? analysis!.qualifications_required
          : undefined,
    responsibilities:
      (job.responsibilities?.length ?? 0) > 0
        ? job.responsibilities
        : (analysis?.responsibilities?.length ?? 0) > 0
          ? analysis!.responsibilities
          : undefined,
    score: scores?.overall_score ?? job.score ?? null,
  }

  const workflow = getWorkflowState(jobWithAnalysis, id)
  const readiness = evaluateReadiness(job)
  const coachStep = getCoachStepState(job)

  const matchedSkills: string[] = Array.isArray(analysis?.matched_skills) ? analysis.matched_skills : []
  const knownGaps: string[] = Array.isArray(analysis?.known_gaps) ? analysis.known_gaps : []
  const hasDocs = !!(job.generated_resume || job.generated_cover_letter)
  const hasUrl = !!(job.job_url && !job.job_url.startsWith("manual://"))
  const isAnalyzed = !!(
    analysis ||
    scores ||
    (jobWithAnalysis.qualifications_required?.length ?? 0) > 0 ||
    (jobWithAnalysis.responsibilities?.length ?? 0) > 0
  )
  const overallScore = scores?.overall_score ?? job.score ?? null
  const scoreGaps: string[] = Array.isArray(job.score_gaps)
    ? job.score_gaps.map((gap: string) => gap.replace(/^Gap:\s*/i, "").trim()).filter(Boolean)
    : []
  const coachProgressTotal = coachStep.gaps.length || (coachStep.required ? 1 : 0)
  const coachProgressCurrent = coachProgressTotal > 0
    ? Math.min(coachProgressTotal, coachStep.addressedGaps.length + 1)
    : 0
  const isFreePlan = !userData?.plan_type || userData.plan_type === "free"
  const stillProcessing = ["analyzing", "queued", "generating"].includes(job.status)

  return (
    <div className="hw-page">
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
            {hasUrl && (
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
          <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
            <Badge
              variant="outline"
              className={`text-[10px] font-medium ${STATUS_CLASS[job.status] ?? "status-draft"}`}
            >
              {STATUS_LABEL[job.status] ?? job.status}
            </Badge>
            {job.fit && (
              <Badge
                variant="outline"
                className={`text-[10px] font-medium ${
                  job.fit === "HIGH" ? "status-ready"
                  : job.fit === "MEDIUM" ? "status-analyzing"
                  : "status-rejected"
                }`}
              >
                {job.fit} fit
              </Badge>
            )}
            {isAnalyzed && hasUrl && (
              <AnalyzeJobButton jobId={id} hasUrl={hasUrl} label="Re-analyze" size="sm" />
            )}
          </div>
        </div>

        {/* Workflow progress strip */}
        <div className="mt-4 pt-4 border-t border-border">
          <WorkflowProgress stage={workflow.stage} />
        </div>
      </div>

      <ReadinessContextBanner
        stage={readiness.stage}
        blockedReasons={readiness.blockedReasons}
        nextAction={readiness.nextAction}
      />

      <div className="hw-workspace">
        <div className="hw-workspace-main space-y-4">

      {/* NEXT STEP — single command surface */}
      {!stillProcessing && (
        <>
          <ReadinessChecklist checklist={readiness.checklist} jobId={id} />
          <NextStepBanner workflow={workflow} jobId={id} hasDocs={hasDocs} hasUrl={hasUrl} />
          <ReadinessNextStepCard readiness={readiness} jobId={id} />
          <div className="space-y-2">
            <ReadinessChecklist checklist={readiness.checklist} jobId={id} />
            {!readiness.isReady && (
              <div className="text-sm text-rose-600">
                {readiness.blockedReasons.join(", ")}
              </div>
            )}
          </div>
          <NextStepBanner workflow={workflow} jobId={id} hasDocs={hasDocs} hasUrl={hasUrl} />
          {hasDocs && readiness.outcome === "active" && (
            <div className="mt-4 flex justify-end">
              <Link href={`/ready-to-apply?jobId=${encodeURIComponent(id)}`}>
                <Button className="hw-btn-primary">Ready to Apply</Button>
              </Link>
            </div>
          )}
          {/* Outcome Tracker — visible once applied or in active pipeline */}
          {["applied", "interviewing", "offered", "rejected"].includes(job.status) && (
            <OutcomeTracker
              jobId={id}
              currentOutcome={(job as Record<string, unknown>).outcome as string | null}
              currentStatus={job.status}
            />
          )}
        </>
      )}

      {/* Processing state */}
      {stillProcessing && (
        <div className="hw-card px-6 py-8 flex flex-col items-center text-center gap-3">
          <RefreshCw className="h-5 w-5 text-amber-600 animate-spin" />
          <div>
            <p className="text-sm font-semibold">Analysis in progress</p>
            <p className="text-xs text-muted-foreground mt-1">This usually takes 15–30 seconds.</p>
          </div>
          <Link
            href={`/jobs/${id}`}
            className="inline-flex items-center gap-1.5 text-xs hw-card px-3 py-1.5 hover:border-primary/30 transition-colors"
          >
            <RefreshCw className="h-3.5 w-3.5" /> Refresh
          </Link>
        </div>
      )}

      {/* Analysis results */}
      {!stillProcessing && isAnalyzed && (
        <>
          {(overallScore !== null || scores?.skills_match || scores?.experience_relevance) && (
            <div className="hw-card px-6 py-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="hw-section-label">Fit Analysis</h2>
                {overallScore !== null && (
                  <div className="text-right">
                    <span className="text-2xl font-bold tabular-nums text-foreground">
                      {Math.round(Number(overallScore))}
                      <span className="text-sm font-normal text-muted-foreground">/100</span>
                    </span>
                  </div>
                )}
              </div>
              {overallScore !== null && (
                <div className="mb-4 rounded-md border border-border bg-muted/30 px-3 py-2">
                  {scoreGaps.length > 0 ? (
                    <div>
                      <p className="hw-section-label mb-2">Top gaps</p>
                      <div className="flex flex-wrap gap-1.5">
                        {scoreGaps.slice(0, 3).map((gap) => (
                          <span
                            key={gap}
                            className="rounded border border-amber-200 bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-700"
                          >
                            {gap}
                          </span>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      Score reflects how well your evidence covers this role&apos;s requirements.
                    </p>
                  )}
                </div>
              )}
              <div className="space-y-3">
                {coachStep.evidenceCoverage != null && (
                  <ScoreBar
                    label="Evidence coverage"
                    value={coachStep.evidenceCoverage}
                    note="How much of the role is backed by proof in your Career Context."
                  />
                )}
                {coachStep.strategicFit != null && (
                  <ScoreBar
                    label="Strategic fit"
                    value={coachStep.strategicFit}
                    note="How well your current evidence lines up with this job after weighting role signals."
                  />
                )}
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

          {(matchedSkills.length > 0 || knownGaps.length > 0) && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {matchedSkills.length > 0 && (
                <div className="hw-card px-5 py-4">
                  <h2 className="hw-section-label mb-3">What you bring</h2>
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
                  <h2 className="hw-section-label mb-3">Gaps to address</h2>
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

          {coachStep.required && !hasDocs && (
            <>
              <RequirementCoachModal
                jobId={id}
                jobTitle={jobWithAnalysis.title}
                company={jobWithAnalysis.company}
                score={overallScore}
                status={job.status}
                gaps={coachStep.gaps}
                autoOpen={!coachStep.complete}
                progressLabel={
                  coachProgressTotal > 0
                    ? `Gap ${coachProgressCurrent} of ${coachProgressTotal}`
                    : undefined
                }
                showGenerationUnlock={!readiness.canGenerate}
              />
            </>
          )}

          {!hasDocs && (
            <div className="hw-card px-6 py-5">
              <div className="flex items-center justify-between mb-1">
                <h2 className="hw-section-label">Documents</h2>
              </div>
              <p className="text-xs text-muted-foreground mb-4">
                Generate a tailored resume and cover letter for this role.
              </p>
              <div className="space-y-2">
                <GenerateButton jobId={job.id} disabled={!readiness.canGenerate} disabledReason={readiness.nextAction?.description} />
                {isFreePlan && (
                  <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Lock className="h-3 w-3" />
                    Free plan: up to 5 generations/month.{" "}
                    <a href="/billing" className="text-primary hover:underline">Upgrade to Pro</a> for unlimited.
                  </p>
                )}
              </div>
            </div>
          )}
        </>
      )}

      {/* No analysis yet — show AnalyzeJobButton */}
      {!stillProcessing && !isAnalyzed && (
        <div className="hw-card px-6 py-8 flex flex-col items-center text-center gap-4">
          <div className="hw-empty-icon">
            <AlertTriangle className="h-5 w-5 text-muted-foreground" />
          </div>
          <div className="max-w-xs">
            <p className="text-sm font-semibold">Analysis not run yet</p>
            <p className="text-xs text-muted-foreground mt-1">
              Extract requirements, score your fit, and get coaching specific to this role.
            </p>
          </div>
          <div className="w-full max-w-xs">
            <AnalyzeJobButton jobId={id} hasUrl={hasUrl} />
          </div>
        </div>
      )}

        </div>

        <div className="hw-workspace-rail space-y-4">
          <div className="hw-panel p-4">
            <p className="hw-section-label mb-2">Job Snapshot</p>
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between gap-2">
                <span className="text-muted-foreground">Status</span>
                <span className="font-semibold text-foreground">{STATUS_LABEL[job.status] ?? job.status}</span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-muted-foreground">Readiness</span>
                <span className="font-semibold text-foreground">{readiness.stage.replace(/_/g, " ")}</span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-muted-foreground">Fit Score</span>
                <span className="font-semibold text-foreground tabular-nums">
                  {overallScore !== null ? `${Math.round(Number(overallScore))}/100` : "Pending"}
                </span>
              </div>
            </div>
          </div>

          <div className="hw-panel p-4">
            <p className="hw-section-label mb-2">Quick Links</p>
            <div className="space-y-2">
              <Link href={`/jobs/${id}/evidence-match`} className="block text-xs text-primary hover:underline">
                Open Evidence Match
              </Link>
              <Link href={`/jobs/${id}/documents`} className="block text-xs text-primary hover:underline">
                Open Documents
              </Link>
              <Link href="/ready-to-apply" className="block text-xs text-primary hover:underline">
                Ready to Apply Gate
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
