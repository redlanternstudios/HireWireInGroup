// Example recommendation payloads
import { CoachRecommendation } from "./index"

export const exampleRecommendations: CoachRecommendation[] = [
  {
    id: "leadership-gap",
    message: "You’re missing leadership evidence for this role.",
    context: "gap_resolution",
    priority: 1,
    evidenceKey: "leadership",
    type: "blocker",
  },
  {
    id: "refine-summary",
    message: "I recommend refining your summary instead of regenerating the full resume.",
    context: "generation",
    priority: 2,
    type: "next_action",
  },
  {
    id: "sap-alignment",
    message: "This role aligns strongly with your SAP systems background.",
    context: "job_analysis",
    priority: 4,
    type: "insight",
  },
]
