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
  outcome: OutcomeState;
  blockedReasons: string[];
  checklist: ReadinessChecklistState;
  nextAction: ReadinessNextAction | null;
};

export type ReadinessJob = {
  id?: string | null;
  status?: string | null;
  applied_at?: string | null;
  generated_resume?: string | null;
  generated_cover_letter?: string | null;
  evidence_map?: unknown;
  quality_passed?: boolean | null;
  score?: number | null;
  score_gaps?: string[] | null;
  gap_clarifications?: unknown;
  gaps_addressed?: string[] | null;
};

import { getCoachStepState, isEvidenceMapMetadataKey } from "@/lib/coach-step";
import {
  isVoiceIntegrityPassed,
  getVoiceBlockedReason,
} from "./voice-readiness";


import type {
  CanonicalJobEvidenceMap,
  EvidenceIntelligencePacket,
  RequirementEvidenceMatch,
} from "@/lib/evidence/types";

function packetsForResume(packets: EvidenceIntelligencePacket[]): EvidenceIntelligencePacket[] {
  return packets.filter(packet =>
    packet.matchStrength !== "weak" &&
    packet.matchedEvidenceIds.length > 0 &&
    (packet.allowedUsage === "resume_allowed" || packet.allowedUsage === "resume_allowed_with_reframe")
  );
}

function hasRequiredEvidenceCoverage(job: ReadinessJob): boolean {
  const evidenceMap = job.evidence_map as CanonicalJobEvidenceMap | null;
  if (!evidenceMap || !Array.isArray(evidenceMap.requirement_matches)) return false;
  const usablePacketRequirementIds = new Set(
    packetsForResume(Array.isArray(evidenceMap.capability_packets) ? evidenceMap.capability_packets : [])
      .map(packet => String(packet.packet_id).replace(/^pkt_/, ""))
  );
  const requiredMatches = evidenceMap.requirement_matches.filter(
    (m: RequirementEvidenceMatch) => m.priority === "required"
  );
  if (requiredMatches.length === 0) {
    return evidenceMap.requirement_matches.some(
      (m: RequirementEvidenceMatch) =>
        (m.status === "met" || m.status === "partial") &&
        m.matched_evidence_ids.length > 0 &&
        usablePacketRequirementIds.has(m.requirement_id)
    );
  }
  return requiredMatches.every(
    (m: RequirementEvidenceMatch) =>
      (m.status === "met" || m.status === "partial") &&
      m.matched_evidence_ids.length > 0 &&
      usablePacketRequirementIds.has(m.requirement_id)
  );
}

function getEvidenceBlockedReasons(job: ReadinessJob): string[] {
  const evidenceMap = job.evidence_map as CanonicalJobEvidenceMap | null;
  if (!evidenceMap || !Array.isArray(evidenceMap.requirement_matches)) {
    return ["Evidence has not been mapped to this job yet"];
  }
  return evidenceMap.requirement_matches
    .filter(
      (m: RequirementEvidenceMatch) =>
        m.priority === "required" &&
        ((m.status === "gap" || m.status === "unknown") ||
          !packetsForResume(Array.isArray(evidenceMap.capability_packets) ? evidenceMap.capability_packets : [])
            .some(packet => String(packet.packet_id).replace(/^pkt_/, "") === m.requirement_id))
    )
    .map((m: RequirementEvidenceMatch) =>
      (m.status === "gap" || m.status === "unknown")
        ? `Missing evidence for ${m.requirement_text}`
        : `Missing usable evidence packet for ${m.requirement_text}`
    );
}

function requirementAnchorId(requirementId: string): string {
  const safeId = requirementId
    .trim()
    .replace(/[^a-zA-Z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return `req-${safeId || "unknown"}`;
}

function getFirstUnresolvedRequirementId(job: ReadinessJob): string | null {
  const evidenceMap = job.evidence_map as CanonicalJobEvidenceMap | null;
  if (!evidenceMap || !Array.isArray(evidenceMap.requirement_matches)) return null;

  const matches = evidenceMap.requirement_matches;

  const pick = (priority: "required" | "preferred") =>
    matches.find(
      (match) =>
        match.priority === priority &&
        (match.status === "gap" ||
          match.status === "unknown" ||
          match.status === "partial") &&
        typeof match.requirement_id === "string" &&
        match.requirement_id.trim().length > 0,
    );

  const required = pick("required");
  if (required?.requirement_id) return required.requirement_id;

  const preferred = pick("preferred");
  if (preferred?.requirement_id) return preferred.requirement_id;

  const any = matches.find(
    (match) =>
      (match.status === "gap" ||
        match.status === "unknown" ||
        match.status === "partial") &&
      typeof match.requirement_id === "string" &&
      match.requirement_id.trim().length > 0,
  );

  return any?.requirement_id ?? null;
}

function evidenceFixHref(job: ReadinessJob): string {
  if (!job.id) return "/evidence";

  const requirementId = getFirstUnresolvedRequirementId(job);
  if (!requirementId) return `/jobs/${job.id}/evidence-match`;

  const anchor = requirementAnchorId(requirementId);
  return `/jobs/${job.id}/evidence-match?resolve=${encodeURIComponent(requirementId)}#${anchor}`;
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
  const nextAction = getNextAction(job, checklist, stage, outcome);

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
  if (!checklist.resume || !checklist.coverLetter) return "materials_missing";
  if (!checklist.coach) return "coach_blocked";
  if (!checklist.evidence) return "evidence_blocked";
  return "quality_review";
}

function getNextAction(
  job: ReadinessJob,
  checklist: ReadinessChecklistState,
  stage: ReadinessStage,
  outcome: OutcomeState,
): ReadinessNextAction | null {
  if (outcome !== "active") return null;

  const jobHref = job.id ? `/jobs/${job.id}` : "/jobs";
  if (!checklist.evidence) {
    return {
      label: "Fix evidence",
      href: evidenceFixHref(job),
      description: "Add or map proof points before this job can move forward.",
    };
  }

  if (!checklist.coach) {
    return {
      label: "Start coach",
      href: job.id ? `/jobs/${job.id}/evidence-match` : "/coach",
      description: "Answer or skip the coach prompts before generating materials.",
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
      href: "/ready-to-apply",
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
