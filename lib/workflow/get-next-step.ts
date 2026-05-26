import { evaluateReadiness } from "@/lib/readiness/evaluator"
import { deriveWorkflowStage } from "@/lib/job-workflow"
import type { CanonicalJobEvidenceMap, RequirementEvidenceMatch } from "@/lib/evidence/types"
import type { GuidedFlowJob, GuidedRequirement, NextStep } from "./step-types"

function asEvidenceMap(value: unknown): CanonicalJobEvidenceMap | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null
  const map = value as CanonicalJobEvidenceMap
  return Array.isArray(map.requirement_matches) ? map : null
}

function needsUserExample(match: RequirementEvidenceMatch) {
  const hasMappedEvidence = match.matched_evidence_ids.length > 0
  if ((match.status === "gap" || match.status === "unknown") && match.priority === "required") return true
  if (match.status === "partial" && !hasMappedEvidence && match.priority === "required") return true
  return false
}

function toGuidedRequirement(match: RequirementEvidenceMatch): GuidedRequirement {
  return {
    requirement_id: match.requirement_id,
    requirement_text: match.requirement_text,
    priority: match.priority,
    status: match.status,
    matched_evidence_ids: match.matched_evidence_ids,
    matched_evidence_titles: match.matched_evidence_titles,
    prompt: match.evidence_questions?.[0] ?? `Have you done anything related to ${match.requirement_text}?`,
  }
}

function hasGeneratedMaterials(job: GuidedFlowJob) {
  return Boolean(job.generated_resume && job.generated_cover_letter)
}

export function getNextStep(job: GuidedFlowJob): NextStep {
  const readiness = evaluateReadiness(job)
  const workflowStage = deriveWorkflowStage(job as never)
  const base = `/jobs/${job.id}`
  const evidenceMap = asEvidenceMap(job.evidence_map)

  if (readiness.outcome !== "active") {
    return {
      type: "done",
      title: "Application tracked",
      description: "This job is no longer waiting on an application step.",
      primaryLabel: "View job",
      href: base,
      readiness,
      workflowStage,
    }
  }

  if (job.status === "analyzing" || workflowStage === "job_ingested") {
    return {
      type: "analyzing",
      title: "Analyzing this job",
      description: "HireWire is reading the job and finding what it asks for.",
      primaryLabel: "Check again",
      readiness,
      workflowStage,
    }
  }

  if (!evidenceMap && (job.score != null || workflowStage === "job_parsed" || workflowStage === "fit_scored")) {
    return {
      type: "refresh_analysis",
      title: "Refresh this job",
      description: "This job was analyzed before Prove Fit existed. Refresh it once so HireWire can show a simple next step.",
      primaryLabel: "Refresh analysis",
      secondaryLabel: "View job",
      href: base,
      readiness,
      workflowStage,
    }
  }

  const requirement = evidenceMap?.requirement_matches.find(needsUserExample)
  if (requirement) {
    return {
      type: "add_example",
      title: "Add one example",
      description: "This job asks for something we do not have a clear example for yet.",
      primaryLabel: "Find an example",
      secondaryLabel: "Skip for now",
      href: `${base}/evidence-match`,
      requirement: toGuidedRequirement(requirement),
      readiness,
      workflowStage,
    }
  }

  if (readiness.canGenerate) {
    return {
      type: "generate",
      title: "Generate your package",
      description: "You have enough confirmed examples to create a tailored resume and cover letter.",
      primaryLabel: "Generate documents",
      readiness,
      workflowStage,
    }
  }

  if (hasGeneratedMaterials(job) && !readiness.checklist.quality) {
    return {
      type: "review",
      title: "Review your documents",
      description: "Open the full document review page, check the package, then accept it when it looks right.",
      primaryLabel: "Open review",
      secondaryLabel: "Accept now",
      href: `${base}/documents`,
      readiness,
      workflowStage,
    }
  }

  if (readiness.canApply) {
    return {
      type: "apply",
      title: "Mark as applied",
      description: "Once you submit this application outside HireWire, mark it here so your pipeline stays accurate.",
      primaryLabel: "Mark applied",
      readiness,
      workflowStage,
    }
  }

  return {
    type: "add_example",
    title: "Keep building the match",
    description: readiness.blockedReasons[0] ?? "Add one clear example so HireWire can keep moving.",
    primaryLabel: "Prove Fit",
    href: `${base}/evidence-match`,
    readiness,
    workflowStage,
  }
}
