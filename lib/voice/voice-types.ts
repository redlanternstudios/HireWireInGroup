// Canonical VoiceProfile and VoiceDriftResult types for HireWire

export type VoiceProfile = {
  tone: {
    primary: "plainspoken" | "technical" | "executive" | "analytical" | "warm" | "direct"
    secondary?: string[]
  }
  formality: "low" | "medium" | "high"
  sentencePattern: {
    averageLength: "short" | "medium" | "long"
    structure: "concise_bullets" | "narrative_bullets" | "metric_first" | "responsibility_first"
  }
  bulletStyle: {
    startsWithActionVerb: boolean
    metricDensity: "low" | "medium" | "high"
    typicalPattern:
      | "action_context_result"
      | "responsibility_tool_outcome"
      | "task_based"
      | "achievement_based"
  }
  vocabulary: {
    level: "simple" | "professional" | "technical" | "executive"
    industryTerms: string[]
    repeatedTerms: string[]
    commonActionVerbs: string[]
  }
  confidence: {
    level: "reserved" | "balanced" | "assertive"
    evidenceOfOverstatement: boolean
  }
  quality: {
    grammarRisk: "low" | "medium" | "high"
    spellingRisk: "low" | "medium" | "high"
    clarityRisk: "low" | "medium" | "high"
  }
  preserve: {
    phrases: string[]
    styleNotes: string[]
  }
  avoid: {
    phrases: string[]
    risks: string[]
  }
}

export type VoiceDriftResult = {
  passed: boolean
  driftLevel: "none" | "low" | "medium" | "high"
  detectedIssues: Array<
    | "generic_ai_tone"
    | "over_polished"
    | "too_executive"
    | "too_casual"
    | "confidence_shift"
    | "unsupported_sophistication"
    | "lost_original_cadence"
  >
  warnings: string[]
  examples: {
    originalPattern: string
    generatedPattern: string
    issue: string
  }[]
  recommendedAction:
    | "accept"
    | "review"
    | "regenerate_with_less_polish"
    | "regenerate_with_more_clarity"
}
