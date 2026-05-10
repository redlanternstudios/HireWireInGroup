// Workflow-aware recommendation priority system
import { CoachRecommendation } from "./index"

export enum RecommendationPriority {
  Blocker = 1,
  NextAction = 2,
  HighImpact = 3,
  Strategic = 4,
  Motivational = 5,
}

export function sortRecommendations(recs: CoachRecommendation[]): CoachRecommendation[] {
  return recs.sort((a, b) => a.priority - b.priority)
}
