// Coach tone calibration logic
import { CoachBehaviorMode } from "./behavior/modes"

export function calibrateCoachTone({ workflowStage, signals }: { workflowStage: string, signals: any[] }): CoachBehaviorMode {
  // Blockers → concise + warning
  if (signals.some(s => s.type === "repeated_regenerations" || s.type === "low_evidence_coverage" || s.type === "workflow_confusion")) {
    return "warning"
  }
  // Strong alignment → concise + celebratory
  if (signals.some(s => s.type === "interview_momentum")) {
    return "celebratory"
  }
  // Post-generation → strategic
  if (["materials_generated", "ready"].includes(workflowStage)) {
    return "strategic"
  }
  // Repeated failures → analytical
  if (signals.some(s => s.type === "repeated_rejection")) {
    return "analytical"
  }
  // Application ready → celebratory but restrained
  if (workflowStage === "ready") {
    return "celebratory"
  }
  // Default
  return "operational"
}