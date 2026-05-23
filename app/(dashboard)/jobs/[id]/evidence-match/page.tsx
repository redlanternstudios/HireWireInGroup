import { createClient } from "@/lib/supabase/server"
import { redirect, notFound } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ArrowRight, ShieldCheck, AlertCircle, Lightbulb, Target } from "lucide-react"
import { RequirementCoachModal } from "@/components/coach/RequirementCoachModal"
import { GuidedRequirementCoachFlow } from "@/components/coach/GuidedRequirementCoachFlow"
import { RebuildEvidenceMapButton } from "@/components/jobs/RebuildEvidenceMapButton"
import { getCoachStepState } from "@/lib/coach-step"
import { evaluateReadiness } from "@/lib/readiness/evaluator"
import { cn } from "@/lib/utils"
import type { CanonicalJobEvidenceMap, RequirementEvidenceMatch } from "@/lib/evidence/types"

export const dynamic = "force-dynamic"

function asCanonicalEvidenceMap(value: unknown): CanonicalJobEvidenceMap | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null
  const map = value as CanonicalJobEvidenceMap
  return Array.isArray(map.requirement_matches) ? map : null
}

function uiStatus(match: RequirementEvidenceMatch) {
  if (match.status === "met") return { label: "Covered", className: "bg-emerald-50 text-emerald-700 border-emerald-200" }
  if (match.status === "partial" && match.confidence === "high") return { label: "Probably covered", className: "bg-sky-50 text-sky-700 border-sky-200" }
  if (match.status === "partial") return { label: "Needs a clearer example", className: "bg-amber-50 text-amber-700 border-amber-200" }
  if (match.priority === "keyword") return { label: "Optional", className: "bg-slate-50 text-slate-600 border-slate-200" }
  return { label: "Needs an example", className: "bg-rose-50 text-rose-700 border-rose-200" }
}

function requirementAnchorId(requirementId: string) {
  const safeId = requirementId
    .trim()
    .replace(/[^a-zA-Z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "")

  return `req-${safeId || "unknown"}`
}

type RequirementType =
  | "years_experience"
  | "credential"
  | "tool"
  | "domain"
  | "outcome"
  | "responsibility"
  | "skill"
  | "other"

function inferRequirementType(text: string): RequirementType {
  const value = text.toLowerCase()
  if (/(\d+\+?\s*years?|years?\s+of\s+experience|experience\s+in)/.test(value)) return "years_experience"
  if (/(bachelor|master|mba|phd|degree|certified|certification|license|pmp|cka)/.test(value)) return "credential"
  if (/(salesforce|sap|jira|figma|supabase|openai|api|tableau|excel|python|sql)/.test(value)) return "tool"
  if (/(healthcare|finance|enterprise\s+saas|construction|education|government|retail)/.test(value)) return "domain"
  if (/(increase|improve|reduce|delivered|impact|outcome|kpi|adoption|revenue|efficiency)/.test(value)) return "outcome"
  if (/(own|lead|manage|partner|coordinate|launch|roadmap|stakeholder|cross-functional)/.test(value)) return "responsibility"
  if (/(analytical|problem solving|communication|strategy|leadership|skill|ability)/.test(value)) return "skill"
  return "other"
}

export default async function EvidenceMatchPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ resolve?: string | string[]; req?: string | string[] }>
}) {
  const { id } = await params
  const resolvedSearchParams = await searchParams
  const resolveParam = resolvedSearchParams?.resolve
  const reqParam = resolvedSearchParams?.req
  const requestedReqParam = Array.isArray(reqParam)
    ? (reqParam[0] ?? null)
    : (reqParam ?? null)
  const legacyResolveParam = Array.isArray(resolveParam)
    ? (resolveParam[0] ?? null)
    : (resolveParam ?? null)
  if (!requestedReqParam && legacyResolveParam) {
    redirect(
      `/jobs/${id}/evidence-match?req=${encodeURIComponent(legacyResolveParam)}#${requirementAnchorId(legacyResolveParam)}`,
    )
  }
  const requestedRequirementId = requestedReqParam ?? legacyResolveParam
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: job, error } = await supabase
    .from("jobs")
    .select("id, role_title, company_name, status, score, score_gaps, evidence_map, gap_clarifications, gaps_addressed, generated_resume, generated_cover_letter, quality_passed, applied_at")
    .eq("id", id)
    .eq("user_id", user.id)
    .is("deleted_at", null)
    .single()

  if (error || !job) notFound()

  const [{ data: evidenceItems }, { data: analysis }] = await Promise.all([
    supabase
      .from("evidence_library")
      .select("id, source_title, source_type, confidence_level, outcomes")
      .eq("user_id", user.id)
      .eq("is_active", true)
      .order("created_at", { ascending: false }),
    supabase
      .from("job_analyses")
      .select("matched_skills, known_gaps, qualifications_required, responsibilities")
      .eq("job_id", id)
      .eq("user_id", user.id)
      .maybeSingle(),
  ])

  const requirements: string[] = [
    ...(Array.isArray(analysis?.qualifications_required) ? analysis.qualifications_required : []),
    ...(Array.isArray(analysis?.responsibilities) ? analysis.responsibilities : []),
  ].filter(Boolean)

  const evidenceMap = asCanonicalEvidenceMap(job.evidence_map)
  const requirementMatches = evidenceMap?.requirement_matches ?? []
  const mapBuildError =
    job.evidence_map && typeof job.evidence_map === "object" && !Array.isArray(job.evidence_map)
      ? (job.evidence_map as Record<string, unknown>).map_build_error
      : null
  const mapBuildErrorText =
    mapBuildError && typeof mapBuildError === "object" && !Array.isArray(mapBuildError)
      ? String((mapBuildError as Record<string, unknown>).message ?? "Evidence mapping failed")
      : null
  const matchedSkills: string[] = Array.isArray(analysis?.matched_skills) ? analysis.matched_skills : []
  const gaps: string[] = Array.isArray(analysis?.known_gaps) ? analysis.known_gaps : []
  const evidenceCount = evidenceItems?.length ?? 0
  const coachStep = getCoachStepState({ ...job, score_gaps: job.score_gaps ?? gaps })
  const readiness = evaluateReadiness(job)
  const requiredTotal = evidenceMap?.coverage_summary.required_total ?? requirements.length
  const requiredCovered = (evidenceMap?.coverage_summary.required_met ?? 0) + (evidenceMap?.coverage_summary.required_partial ?? 0)
  const proofGaps = requirementMatches.filter(match => match.status === "gap" || match.status === "unknown")
  const requiredGaps = requirementMatches.filter(
    (match) =>
      match.priority === "required" &&
      (match.status === "gap" || match.status === "unknown" || match.status === "partial"),
  )

  return (
    <div className="hw-page">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2">
        <Link
          href={`/jobs/${id}`}
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
          {job.role_title ?? "Job"} at {job.company_name ?? "—"}
        </Link>
      </div>

      {/* Header */}
      <div className="hw-card px-6 py-5">
        <p className="hw-section-label mb-1">Step 2 of 5</p>
        <h1 className="hw-page-title">Match Builder</h1>
        <p className="hw-page-subtitle">
          We found what this job is asking for. Add or clarify examples from your real experience, then HireWire can write stronger materials without guessing.
        </p>
      </div>

      {/* Status strip */}
      <div className="hw-metrics">
        <div className="hw-stat">
          <span className="hw-stat-value text-primary">{requiredTotal}</span>
          <span className="hw-stat-label">Things This Job Wants</span>
        </div>
        <div className="hw-stat">
          <span className="hw-stat-value text-emerald-600">{requiredCovered}</span>
          <span className="hw-stat-label">Already Covered</span>
        </div>
        <div className="hw-stat">
          <span className="hw-stat-value text-amber-600">{proofGaps.length || gaps.length}</span>
          <span className="hw-stat-label">Need Your Help</span>
        </div>
        <div className="hw-stat">
          <span className="hw-stat-value">{evidenceCount}</span>
          <span className="hw-stat-label">Proof Points</span>
        </div>
      </div>

      {/* Main content */}
      <div className="hw-workspace">
        <div className="hw-workspace-main space-y-4">

          {mapBuildErrorText && (
            <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-red-800">Evidence mapping needs retry</p>
                  <p className="mt-1 text-xs text-red-700">
                    {mapBuildErrorText}
                  </p>
                </div>
                <RebuildEvidenceMapButton jobId={id} />
              </div>
            </div>
          )}

          {requirementMatches.length > 0 && (
            <div className="space-y-4">
              <GuidedRequirementCoachFlow
                jobId={id}
                jobTitle={job.role_title ?? "this role"}
                company={job.company_name ?? "this company"}
                score={job.score}
                status={job.status}
                requirementMatches={requirementMatches}
                requestedRequirementId={requestedRequirementId}
                evidenceItems={(evidenceItems ?? []).map((item) => ({
                  id: item.id,
                  source_title: item.source_title,
                  source_type: item.source_type,
                }))}
                generationBlocked={!readiness.canGenerate}
              />

              {requiredGaps.length === 0 && (
                <div className="hw-card border-l-4 border-l-emerald-500 px-5 py-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <p className="hw-section-label mb-1">All required gaps addressed</p>
                      <p className="text-sm text-muted-foreground">
                        {readiness.canGenerate
                          ? "HireWire has enough evidence to write strong, tailored materials."
                          : "Some readiness checks are still pending — return to the job to review."}
                      </p>
                    </div>
                    <div className="shrink-0">
                      {readiness.canGenerate ? (
                        <Link href={`/jobs/${id}/documents`}>
                          <Button size="sm" className="hw-btn-primary gap-1.5">
                            Generate materials <ArrowRight className="h-3.5 w-3.5" />
                          </Button>
                        </Link>
                      ) : (
                        <Link href={`/jobs/${id}`}>
                          <Button size="sm" variant="outline" className="gap-1.5">
                            Return to job <ArrowRight className="h-3.5 w-3.5" />
                          </Button>
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              )}

              <details className="hw-card px-5 py-4" open={!!requestedRequirementId}>
                <summary className="cursor-pointer text-sm font-semibold text-foreground">
                  View all requirements ({requirementMatches.length})
                </summary>
                <p className="mt-1 text-xs text-muted-foreground">
                  Use this expanded list for full context. Guided Coach Flow above handles one gap at a time.
                </p>

                <div className="mt-3 space-y-3">
                  {requirementMatches.map((match) => {
                    const status = uiStatus(match)
                    const requirementType = inferRequirementType(match.requirement_text)
                    return (
                      <div
                        id={requirementAnchorId(match.requirement_id)}
                        key={match.requirement_id}
                        className={cn(
                          "hw-requirement-card rounded-md border bg-background px-5 py-4",
                          requestedRequirementId === match.requirement_id
                            ? "border-primary bg-primary/5"
                            : "border-border",
                        )}
                      >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <Target className="h-4 w-4 text-primary" />
                          <span className="hw-section-label">
                            {match.priority === "required" ? "Important" : match.priority === "preferred" ? "Nice to have" : "Keyword"}
                          </span>
                          <span className="rounded border border-primary/20 bg-primary/5 px-2 py-0.5 text-[10px] font-semibold uppercase text-primary">
                            {requirementType.replace(/_/g, " ")}
                          </span>
                          <span className={`rounded border px-2 py-0.5 text-[11px] font-semibold ${status.className}`}>
                            {status.label}
                          </span>
                        </div>
                        <h2 className="mt-2 text-sm font-semibold text-foreground">{match.requirement_text}</h2>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {match.employer_intent ?? match.normalized_requirement}
                        </p>
                      </div>
                        {(match.status === "gap" || match.status === "unknown" || match.status === "partial") && (
                          <RequirementCoachModal
                            jobId={id}
                            jobTitle={job.role_title ?? "this role"}
                            company={job.company_name ?? "this company"}
                            score={job.score}
                            status={job.status}
                            gaps={[match.requirement_text]}
                            autoOpen={
                              !!requestedRequirementId &&
                              requestedRequirementId === match.requirement_id
                            }
                            requirement={{
                              requirement_id: match.requirement_id,
                              requirement_text: match.requirement_text,
                              requirement_type: requirementType,
                              priority: match.priority,
                              status: match.status,
                              current_proof: match.matched_evidence_titles,
                              proof_needed: match.proof_needed,
                              coach_question: match.evidence_questions?.[0],
                            }}
                            evidenceItems={(evidenceItems ?? []).map((item) => ({
                              id: item.id,
                              source_title: item.source_title,
                              source_type: item.source_type,
                            }))}
                            showGenerationUnlock={!readiness.canGenerate}
                          />
                        )}
                    </div>
                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      <div className="hw-panel p-3">
                        <p className="text-[11px] font-semibold uppercase text-muted-foreground">Examples we found</p>
                        <p className="mt-1 text-xs text-foreground">
                          {match.matched_evidence_titles.length > 0 ? match.matched_evidence_titles.join(", ") : "Nothing strong enough yet."}
                        </p>
                      </div>
                      <div className="hw-panel p-3">
                        <p className="text-[11px] font-semibold uppercase text-muted-foreground">What to add</p>
                        <p className="mt-1 text-xs text-foreground">
                          {(match.proof_needed ?? [])[0] ?? "Share a real project, responsibility, or result that shows this."}
                        </p>
                      </div>
                    </div>
                      </div>
                    )
                  })}
                </div>
              </details>
            </div>
          )}

          {requirementMatches.length === 0 && gaps.length > 0 && (
            <div className="hw-card px-5 py-4">
              <h2 className="hw-section-label mb-3">Coachable Gaps</h2>
              <p className="text-xs text-muted-foreground mb-3">
                These requirements have no strong evidence match yet. Answer the coach prompt with direct or adjacent experience, then HireWire can use that context safely.
              </p>
              <ul className="space-y-2">
                {gaps.map((gap, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-sm">
                    <AlertCircle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                    <span className="text-foreground">{gap.replace(/^Gap:\s*/i, "")}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-4 pt-3 border-t border-border">
                <RequirementCoachModal
                  jobId={id}
                  jobTitle={job.role_title ?? "this role"}
                  company={job.company_name ?? "this company"}
                  score={job.score}
                  status={job.status}
                  gaps={coachStep.remainingGaps.length > 0 ? coachStep.remainingGaps : gaps}
                />
              </div>
            </div>
          )}

          {/* No analysis yet */}
          {requirementMatches.length === 0 && requirements.length === 0 && matchedSkills.length === 0 && (
            <div className="hw-empty">
              <div className="hw-empty-icon">
                <AlertCircle className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm font-semibold">Analysis required first</p>
                <p className="text-xs text-muted-foreground mt-1 max-w-xs">
                  Run job analysis before matching evidence. Return to the job detail page and trigger analysis.
                </p>
              </div>
              <Link href={`/jobs/${id}`}>
                <Button size="sm" className="hw-btn-primary gap-1.5">
                  Go back and analyze <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </Link>
            </div>
          )}
        </div>

        {/* Right rail */}
        <div className="hw-workspace-rail">
          <h2 className="hw-section-label mb-3">Your Proof Points</h2>
          <div className="hw-panel p-4 space-y-2">
            {evidenceCount === 0 ? (
              <div className="text-center py-4">
                <p className="text-xs text-muted-foreground">No evidence yet.</p>
                <Link href="/evidence" className="text-xs text-primary hover:underline mt-1 block">
                  Add career context
                </Link>
              </div>
            ) : (
              (evidenceItems ?? []).slice(0, 8).map((item) => (
                <div key={item.id} className="flex items-start gap-2 py-1.5 border-b border-border/50 last:border-0">
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-500 shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-foreground truncate">{item.source_title}</p>
                    <p className="text-[10px] text-muted-foreground capitalize">{item.source_type?.replace(/_/g, " ")}</p>
                  </div>
                </div>
              ))
            )}
            {evidenceCount > 8 && (
              <p className="text-[10px] text-muted-foreground text-center pt-1">
                +{evidenceCount - 8} more in your library
              </p>
            )}
          </div>

          <div className="mt-4">
            <h2 className="hw-section-label mb-2">Why This Helps</h2>
            <div className="hw-panel p-4">
              <div className="flex items-start gap-2">
                <Lightbulb className="h-3.5 w-3.5 text-amber-500 shrink-0 mt-0.5" />
                <p className="text-xs text-muted-foreground leading-relaxed">
                  HireWire only uses examples you have confirmed. More clear examples means less guessing and better tailored documents.
                </p>
              </div>
            </div>
          </div>

          {/* Continue CTA */}
          <div className="mt-4">
            <Link href={`/jobs/${id}`}>
              <Button className="w-full hw-btn-primary gap-1.5 text-sm">
                Continue to job <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
