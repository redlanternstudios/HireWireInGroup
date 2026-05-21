import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import DocumentsEditor from "./DocumentsEditor";
import ApplicationPackagePreview from "@/components/documents/ApplicationPackagePreview";
import VoiceIntegritySection from "@/components/documents/VoiceIntegritySection";
import ResumeVersionHistory from "@/components/documents/ResumeVersionHistory";
import { ApplyButton } from "@/components/jobs/ApplyButton";
import type { VoiceProfile, VoiceDriftResult } from "@/lib/voice/voice-types";
import { getResumeVersions } from "@/lib/actions/resume-versions";
import {
  normalizeResumeFont,
  normalizeResumeFormat,
  recommendResumeFormat,
} from "@/lib/resume-formats";
import { evaluateReadiness } from "@/lib/readiness/evaluator";
import { getCoachStepState } from "@/lib/coach-step";
import { GenerateButton } from "../GenerateButton";
import { ChevronLeft } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function DocumentsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: job, error } = await supabase
    .from("jobs")
    .select(
      `
      id, role_title, company_name, job_url,
      generated_resume, generated_cover_letter,
      edited_resume, edited_cover_letter,
      resume_format, resume_font, format_recommendation_reason,
      generation_timestamp, last_edited_at,
      quality_passed, evidence_map, status, applied_at, score, score_gaps,
      gap_clarifications, gaps_addressed,
      generation_status, generation_error, voice_drift_result, voice_mode, voice_profile_snapshot
    `,
    )
    .eq("id", id)
    .eq("user_id", user.id)
    .is("deleted_at", null)
    .single();

  if (error || !job) notFound();

  const { data: userProfile } = await supabase
    .from("user_profile")
    .select("full_name")
    .eq("user_id", user.id)
    .maybeSingle();
  const candidateName = userProfile?.full_name ?? "";

  const hasDocs = !!(job.generated_resume || job.generated_cover_letter);
  const versions = hasDocs ? await getResumeVersions(id) : [];
  const coachStep = getCoachStepState(job);
  const readiness = evaluateReadiness(job);

  if (!hasDocs) {
    const wasBlocked = job.generation_status === "failed" && !!job.generation_error;
    return (
      <div className="hw-page">
        <div className="flex items-center gap-2 mb-2">
          <Link
            href={`/jobs/${id}`}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
            {job.role_title ?? "Job"} at {job.company_name ?? "—"}
          </Link>
        </div>
        <div className="hw-card px-6 py-10 flex flex-col items-center text-center gap-4 max-w-lg mx-auto">
          <p className="text-sm font-semibold">
            {wasBlocked ? "Generation needs evidence review" : "No documents generated yet"}
          </p>
          <p className="text-xs text-muted-foreground max-w-xs leading-relaxed">
            {!readiness.canGenerate
              ? "Answer the coach prompts first, or explicitly skip them, before generating application materials."
              : wasBlocked
              ? "HireWire blocked the draft before saving because it drifted from your verified evidence. Add or confirm evidence for this role, then generate again."
              : "Return to the job detail page and run document generation to create your tailored resume and cover letter."}
          </p>
          {coachStep.warning && (
            <p className="max-w-md rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
              {coachStep.warning}
            </p>
          )}
          {wasBlocked && (
            <p className="max-w-md rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
              {job.generation_error}
            </p>
          )}
          <div className="w-full max-w-sm">
            <GenerateButton
              jobId={id}
              disabled={!readiness.canGenerate}
              disabledReason={readiness.nextAction?.description}
            />
          </div>
        </div>
      </div>
    );
  }

  const recommendation = recommendResumeFormat({
    roleTitle: job.role_title,
    applicationChannel: job.job_url,
    resumeText: job.edited_resume ?? job.generated_resume,
  });
  const resumeFormat = normalizeResumeFormat(
    job.resume_format ?? recommendation.format,
  );
  const resumeFont = normalizeResumeFont(
    job.resume_font ?? recommendation.font,
    resumeFormat,
  );
  const jobWithFormat = {
    ...job,
    package_review_status:
      job.quality_passed === true && job.generation_status === "ready"
        ? "accepted"
        : "needs_review",
    resume_format: resumeFormat,
    resume_font: resumeFont,
    format_recommendation_reason:
      job.format_recommendation_reason ?? recommendation.reason,
    recommended_resume_format: recommendation.format,
    recommended_resume_font: recommendation.font,
    recommended_resume_reason: recommendation.reason,
  };
  const packageReadiness = evaluateReadiness(jobWithFormat);

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

      {/* Page header */}
      <div className="hw-page-header">
        <div>
          <p className="hw-section-label mb-1">Application Materials</p>
          <h1 className="hw-page-title">{job.role_title}</h1>
          <p className="hw-page-subtitle">
            {job.company_name ?? "—"}
            {job.generation_timestamp && (
              <span className="ml-2 text-muted-foreground/60">
                · Generated {new Date(job.generation_timestamp).toLocaleDateString()}
              </span>
            )}
            {job.last_edited_at && (
              <span className="ml-1 text-muted-foreground/60">
                · Edited {new Date(job.last_edited_at).toLocaleDateString()}
              </span>
            )}
          </p>
        </div>
        <ApplyButton jobId={id} disabled={!packageReadiness.canApply} />
      </div>

      {/* Two-column workspace */}
      <div className="hw-workspace">
        <div className="hw-workspace-main">
          <DocumentsEditor job={jobWithFormat} candidateName={candidateName} />
        </div>
        <aside className="hw-workspace-rail">
          <ApplicationPackagePreview
            job={jobWithFormat}
            readiness={packageReadiness}
            userId={user.id}
          />
          {coachStep.warning && (
            <div className="hw-card rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
              {coachStep.warning}
            </div>
          )}
          <VoiceIntegritySection
            mode={job.voice_mode ?? null}
            profile={
              typeof job.voice_profile_snapshot === "object" &&
              job.voice_profile_snapshot !== null
                ? (job.voice_profile_snapshot as VoiceProfile)
                : null
            }
            drift={
              typeof job.voice_drift_result === "object" &&
              job.voice_drift_result !== null
                ? (job.voice_drift_result as VoiceDriftResult)
                : null
            }
          />
          <ResumeVersionHistory jobId={id} versions={versions} />
        </aside>
      </div>
    </div>
  );
}
