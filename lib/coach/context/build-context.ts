import { CoachBehaviorMode } from "../behavior/modes"

export interface CoachContext {
  workflowStage: string
  blockers: string[]
  readiness: number | string
  evidenceCoverage: number
  fitScore: number
  generationHistory: Array<any>
  applicationHistory: Array<any>
  recentOutcomes: Array<any>
  userPreferences: Record<string, any>
  currentPage: string
  currentAction: string
}

// Compile all context into a single object for the Coach
export function buildCoachContext(params: Partial<CoachContext>): CoachContext {
  return {
    workflowStage: params.workflowStage || "unknown",
    blockers: params.blockers || [],
    readiness: params.readiness ?? 0,
    evidenceCoverage: params.evidenceCoverage ?? 0,
    fitScore: params.fitScore ?? 0,
    generationHistory: params.generationHistory || [],
    applicationHistory: params.applicationHistory || [],
    recentOutcomes: params.recentOutcomes || [],
    userPreferences: params.userPreferences || {},
    currentPage: params.currentPage || "",
    currentAction: params.currentAction || "",
  }
}
