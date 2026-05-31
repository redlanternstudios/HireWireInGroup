export type ReadinessChecklistState = {
  resume: boolean;
  coverLetter: boolean;
  evidence: boolean;
  coach: boolean;
  quality: boolean;
  voiceIntegrity?: boolean;
};

export type ReadinessStage =
  | "outcome"
  | "ready"
  | "quality_review"
  | "coach_blocked"
  | "evidence_blocked"
  | "materials_missing";

export type ReadinessDisplayState =
  | "analyze_needed"
  | "evidence_needed"
  | "coach_needed"
  | "ready_to_generate"
  | "package_review"
  | "ready_to_apply"
  | "applied"
  | "interviewing"
  | "offered"
  | "rejected"
  | "archived";

export type OutcomeState =
  | "active"
  | "applied"
  | "interviewing"
  | "offered"
  | "rejected"
  | "archived";

export type ReadinessNextAction = {
  label: string;
  href: string;
  description: string;
};

export type ReadinessResult = {
  isReady: boolean;
  canApply: boolean;
  canGenerate: boolean;
  stage: ReadinessStage;
  displayState: ReadinessDisplayState;
  displayLabel: string;
  displayClassName: string;
  outcome: OutcomeState;
  blockedReasons: string[];
  checklist: ReadinessChecklistState;
  nextAction: ReadinessNextAction | null;
};

export type ReadinessJob = {
  id?: string | null;
  status?: string | null;
  applied_at?: string | null;
  /**
   * Explicit "a real analysis record exists" signal from callers that have
   * queried job_analyses/job_scores. When set, this is authoritative and
   * overrides the denormalized-score heuristic below. Prevents the journey
   * loop where a stale jobs.score makes readiness say "Prove Fit" while the
   * Prove Fit page finds no analysis and bounces back to "analyze".
   */
  analysis_present?: boolean | null;
  generated_resume?: string | null;
  generated_cover_letter?: string | null;
  evidence_map?: unknown;
  quality_passed?: boolean | null;
  score?: number | null;
  score_gaps?: string[] | null;
  gap_clarifications?: unknown;
  gaps_addressed?: string[] | null;
  prove_fit_decision_requirement_ids?: string[] | null;
  prove_fit_decisions?: Array<{ requirement_id?: unknown; decision?: unknown }> | null;
};

export const READINESS_DISPLAY_LABEL: Record<ReadinessDisplayState, string> = {
  analyze_needed: "Analyze needed",
  evidence_needed: "Evidence needed",
  coach_needed: "Coach needed",
  ready_to_generate: "Ready to generate",
  package_review: "Package review",
  ready_to_apply: "Ready to apply",
  applied: "Applied",
  interviewing: "Interviewing",
  offered: "Offered",
  rejected: "Rejected",
  archived: "Archived",
};

export const READINESS_DISPLAY_CLASS: Record<ReadinessDisplayState, string> = {
  analyze_needed: "bg-stone-100 text-stone-600 border-stone-200",
  evidence_needed: "bg-orange-50 text-orange-700 border-orange-200",
  coach_needed: "bg-amber-50 text-amber-700 border-amber-200",
  ready_to_generate: "bg-sky-50 text-sky-700 border-sky-200",
  package_review: "bg-violet-50 text-violet-700 border-violet-200",
  ready_to_apply: "bg-emerald-50 text-emerald-700 border-emerald-200",
  applied: "bg-blue-50 text-blue-700 border-blue-200",
  interviewing: "bg-indigo-50 text-indigo-700 border-indigo-200",
  offered: "bg-emerald-50 text-emerald-700 border-emerald-200",
  rejected: "bg-rose-50 text-rose-600 border-rose-200",
  archived: "bg-stone-100 text-stone-500 border-stone-200",
};

import { getCoachStepState, isEvidenceMapMetadataKey } from "@/lib/coach-step";
import {
  isVoiceIntegrityPassed,
  getVoiceBlockedReason,
} from "./voice-readiness";
import {
  buildEvidenceFixHref,
  listUnresolvedRequirements,
  type UnresolvedRequirement,
} from "@/lib/evidence/unresolved-requirements";


import type { CanonicalJobEvidenceMap } from "@/lib/evidence/types";

function hasRequiredEvidenceCoverage(job: ReadinessJob): boolean {
  const evidenceMap = job.evidence_map as CanonicalJobEvidenceMap | null;
  if (!evidenceMap || !Array.isArray(evidenceMap.requirement_matches)) return false;
  const requiredMatches = evidenceMap.requirement_matches.filter((match) => match.priority === "required");
  const unresolved = listUnresolvedRequirements(job);

  if (requiredMatches.length === 0) {
    return evidenceMap.requirement_matches.length > 0 && unresolved.length === 0;
  }

  return !unresolved.some((match) => match.priority === "required");
}

function getEvidenceBlockedReasons(job: ReadinessJob): string[] {
  const evidenceMap = job.evidence_map as CanonicalJobEvidenceMap | null;
  if (!evidenceMap || !Array.isArray(evidenceMap.requirement_matches)) {
    return ["Evidence has not been mapped to this job yet"];
  }
  return listUnresolvedRequirements(job)
    .filter((match: UnresolvedRequirement) => match.priority === "required")
    .map((match: UnresolvedRequirement) =>
      (match.status === "gap" || match.status === "unknown")
        ? `Missing evidence for ${match.text}`
        : `Missing usable evidence packet for ${match.text}`
    );
}

function evidenceFixHref(job: ReadinessJob): string {
  return buildEvidenceFixHref(job.id, listUnresolvedRequirements(job)[0]?.id ?? null);
}

export function evaluateReadiness(
  job: ReadinessJob & { voice_drift_result?: any },
): ReadinessResult {
  const voiceIntegrity = isVoiceIntegrityPassed(job.voice_drift_result ?? null);
  const coachStep = getCoachStepState(job);
  const checklist = {
    resume: !!job.generated_resume,
    coverLetter: !!job.generated_cover_letter,
    evidence: hasRequiredEvidenceCoverage(job),
    coach: coachStep.complete,
    quality: job.quality_passed === true,
    voiceIntegrity,
  };

  const outcome = getOutcomeState(job);
  const isOutcome = outcome !== "active";
  const hasMaterials = checklist.resume && checklist.coverLetter;
  const isReady = Object.values(checklist).every(Boolean);
  const canApply = isReady && !isOutcome;
  const canGenerate = checklist.evidence && checklist.coach && !hasMaterials && !isOutcome;
  const stage = getReadinessStage(checklist, outcome);
  const hasAnalysis = hasJobAnalysis(job);
  const displayState = getReadinessDisplayState(job, checklist, outcome, hasAnalysis);
  const nextAction = getNextAction(job, checklist, stage, outcome, hasAnalysis);

  const blockedReasons: string[] = [];
  if (!checklist.resume) blockedReasons.push("Resume not generated");
  if (!checklist.coverLetter) blockedReasons.push("Cover letter not generated");
  if (!checklist.evidence) blockedReasons.push(...getEvidenceBlockedReasons(job));
  if (!checklist.coach) blockedReasons.push("Coach step required before generation");
  if (!checklist.quality) blockedReasons.push("Quality check failed");
  if (!checklist.voiceIntegrity) {
    const reason = getVoiceBlockedReason(job.voice_drift_result ?? null);
    if (reason) blockedReasons.push(reason);
  }

  return {
    isReady,
    canApply,
    canGenerate,
    stage,
    displayState,
    displayLabel: READINESS_DISPLAY_LABEL[displayState],
    displayClassName: READINESS_DISPLAY_CLASS[displayState],
    outcome,
    blockedReasons,
    checklist,
    nextAction,
  };
}

function getOutcomeState(job: ReadinessJob): OutcomeState {
  const status = job.status ?? "active";
  if (job.applied_at || status === "applied") return "applied";
  if (status === "interviewing") return "interviewing";
  if (status === "offered") return "offered";
  if (status === "rejected") return "rejected";
  if (status === "archived") return "archived";
  return "active";
}

function getReadinessStage(
  checklist: ReadinessChecklistState,
  outcome: OutcomeState,
): ReadinessStage {
  if (outcome !== "active") return "outcome";
  if (Object.values(checklist).every(Boolean)) return "ready";
  if (!checklist.evidence) return "evidence_blocked";
  if (!checklist.coach) return "coach_blocked";
  if (!checklist.resume || !checklist.coverLetter) return "materials_missing";
  return "quality_review";
}

function hasJobAnalysis(job: ReadinessJob): boolean {
  // When a caller has confirmed against real analysis artifacts, trust it.
  // A bare jobs.score is NOT proof of analysis — it can persist after a failed
  // extraction, which is what created the Prove Fit -> analyze loop.
  if (job.analysis_present === true) return true;
  if (job.analysis_present === false) return false;

  const status = job.status ?? "";
  return (
    ["analyzed", "generating", "ready", "needs_review"].includes(status) ||
    (job.score !== null && job.score !== undefined) ||
    !!job.evidence_map
  );
}

function getReadinessDisplayState(
  job: ReadinessJob,
  checklist: ReadinessChecklistState,
  outcome: OutcomeState,
  hasAnalysis: boolean,
): ReadinessDisplayState {
  if (outcome === "applied") return "applied";
  if (outcome === "interviewing") return "interviewing";
  if (outcome === "offered") return "offered";
  if (outcome === "rejected") return "rejected";
  if (outcome === "archived") return "archived";
  if (!hasAnalysis) return "analyze_needed";
  if (!checklist.evidence) return "evidence_needed";
  if (!checklist.coach) return "coach_needed";
  if (!checklist.resume || !checklist.coverLetter) return "ready_to_generate";
  if (!checklist.quality || !checklist.voiceIntegrity) return "package_review";
  return "ready_to_apply";
}

function getNextAction(
  job: ReadinessJob,
  checklist: ReadinessChecklistState,
  stage: ReadinessStage,
  outcome: OutcomeState,
  hasAnalysis: boolean,
): ReadinessNextAction | null {
  if (outcome !== "active") return null;

  const jobHref = job.id ? `/jobs/${job.id}` : "/jobs";
  if (!hasAnalysis) {
    return {
      label: "Analyze job",
      href: jobHref,
      description: "Extract requirements, score fit, and build the first evidence map.",
    };
  }

  if (!checklist.evidence) {
    return {
      label: "Prove Fit",
      href: evidenceFixHref(job),
      description: "Confirm or skip the claims HireWire cannot verify yet.",
    };
  }

  if (!checklist.coach) {
    return {
      label: "Start Match Interview",
      href: job.id ? `/jobs/${job.id}/evidence-match` : "/coach",
      description: "Answer or skip the remaining fit questions before generating materials.",
    };
  }

  if (!checklist.resume || !checklist.coverLetter) {
    return {
      label: "Generate materials",
      href: job.id ? `/jobs/${job.id}/documents` : "/jobs",
      description: "Create the evidence-grounded resume and cover letter.",
    };
  }

  if (stage === "quality_review") {
    return {
      label: "Review package",
      href: job.id ? `/jobs/${job.id}/documents` : "/documents",
      description: "Review quality issues before applying.",
    };
  }

  if (stage === "ready") {
    return {
      label: "Apply now",
      href: job.id ? `/ready-to-apply?jobId=${encodeURIComponent(job.id)}` : "/ready-to-apply",
      description: "Submit through the readiness gate.",
    };
  }

  return null;
}

function hasMinimumEvidence(job: ReadinessJob) {
  const evidenceMap = asRecord(job.evidence_map);
  if (!evidenceMap) return false;

  const mappedItems = evidenceMap.mapped_items;
  if (Array.isArray(mappedItems)) {
    return mappedItems.length >= 2;
  }

  const selectedEvidenceIds = evidenceMap.selected_evidence_ids;
  if (Array.isArray(selectedEvidenceIds)) {
    return selectedEvidenceIds.length >= 2;
  }

  const evidenceMatches = evidenceMap.evidence_matches;
  if (Array.isArray(evidenceMatches)) {
    return evidenceMatches.length >= 2;
  }

  const mappedRequirementKeys = Object.keys(evidenceMap).filter(
    (key) =>
      !isEvidenceMapMetadataKey(key),
  );

  return mappedRequirementKeys.length >= 2;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}
