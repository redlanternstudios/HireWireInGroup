// CoachMemory: Store prior recommendations, outcomes, and recurring weak areas

export interface CoachMemory {
  priorRecommendations: string[];
  acceptedRecommendations: string[];
  ignoredRecommendations: string[];
  generationOutcomes: Array<any>;
  applicationOutcomes: Array<any>;
  recurringWeakAreas: string[];
}

export function createCoachMemory(): CoachMemory {
  return {
    priorRecommendations: [],
    acceptedRecommendations: [],
    ignoredRecommendations: [],
    generationOutcomes: [],
    applicationOutcomes: [],
    recurringWeakAreas: [],
  };
}
