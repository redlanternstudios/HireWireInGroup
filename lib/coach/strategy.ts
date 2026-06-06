// Coach strategy profile logic
import type { StrategyProfile, GenerationIntent } from "./types"

export const DEFAULT_STRATEGY_PROFILE: StrategyProfile = {
  id: "default",
  name: "Default Coach Strategy",
  description: "Standard evidence-governed generation for all artifact types.",
  allowedIntents: [
    "ATS_OPTIMIZED",
    "MORE_CONCISE",
    "MORE_EXECUTIVE",
    "MORE_TECHNICAL",
    "MORE_LEADERSHIP",
    "MORE_RECRUITER_READABLE",
    "MORE_HIRING_MANAGER_READABLE",
    "MORE_METRICS_FOCUSED",
    "SECTION_REWRITE",
    "FULL_REWRITE"
  ],
  constraints: {
    maxResumeLength: 2, // pages
    maxBulletsPerSection: 6,
    maxSectionLength: 1200,
    atsSafe: true,
  },
}

export function getStrategyProfile(intent: GenerationIntent): StrategyProfile {
  // TODO: Add more profiles as needed
  return DEFAULT_STRATEGY_PROFILE
}
