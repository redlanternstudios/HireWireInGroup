import type { VoiceProfile, VoiceDriftResult } from "./voice-types"

const FORMALITY_SCALE: Record<string, number> = { low: 0, medium: 1, high: 2 }
const CONFIDENCE_SCALE: Record<string, number> = { reserved: 0, balanced: 1, assertive: 2 }
const VOCAB_SCALE: Record<string, number> = { simple: 0, professional: 1, technical: 2, executive: 3 }
const LENGTH_SCALE: Record<string, number> = { short: 0, medium: 1, long: 2 }

const EXECUTIVE_TONES = new Set(["executive", "analytical"])
const CASUAL_TONES = new Set(["warm", "plainspoken"])

export function checkVoiceDrift(original: VoiceProfile, generated: VoiceProfile): VoiceDriftResult {
  const issues: VoiceDriftResult["detectedIssues"] = []
  const warnings: string[] = []
  const examples: VoiceDriftResult["examples"] = []

  // Formality drift
  const formalityDelta =
    FORMALITY_SCALE[generated.formality] - FORMALITY_SCALE[original.formality]
  if (formalityDelta >= 2) {
    issues.push("too_executive")
    warnings.push(`Formality jumped from ${original.formality} to ${generated.formality}`)
    examples.push({
      originalPattern: `${original.formality} formality`,
      generatedPattern: `${generated.formality} formality`,
      issue: "Major formality shift — generated text is significantly more formal than the original",
    })
  } else if (formalityDelta <= -2) {
    issues.push("too_casual")
    warnings.push(`Formality dropped from ${original.formality} to ${generated.formality}`)
    examples.push({
      originalPattern: `${original.formality} formality`,
      generatedPattern: `${generated.formality} formality`,
      issue: "Major formality drop — generated text is significantly more casual than the original",
    })
  }

  // Tone shift: plainspoken/warm original → executive/analytical generated
  if (
    EXECUTIVE_TONES.has(generated.tone.primary) &&
    CASUAL_TONES.has(original.tone.primary)
  ) {
    if (!issues.includes("too_executive")) issues.push("too_executive")
    warnings.push(`Tone shifted from ${original.tone.primary} to ${generated.tone.primary}`)
    examples.push({
      originalPattern: `${original.tone.primary} tone`,
      generatedPattern: `${generated.tone.primary} tone`,
      issue: "Tone shifted toward executive register — does not match the candidate's natural voice",
    })
  }

  // Confidence shift
  const confidenceDelta =
    CONFIDENCE_SCALE[generated.confidence.level] -
    CONFIDENCE_SCALE[original.confidence.level]
  if (Math.abs(confidenceDelta) >= 2) {
    issues.push("confidence_shift")
    warnings.push(
      `Confidence shifted from ${original.confidence.level} to ${generated.confidence.level}`
    )
    examples.push({
      originalPattern: `${original.confidence.level} confidence`,
      generatedPattern: `${generated.confidence.level} confidence`,
      issue: "Confidence level changed significantly from the original writing style",
    })
  }

  // Vocabulary sophistication jump
  const vocabDelta =
    VOCAB_SCALE[generated.vocabulary.level] - VOCAB_SCALE[original.vocabulary.level]
  if (vocabDelta >= 2) {
    issues.push("unsupported_sophistication")
    warnings.push(
      `Vocabulary jumped from ${original.vocabulary.level} to ${generated.vocabulary.level}`
    )
    examples.push({
      originalPattern: `${original.vocabulary.level} vocabulary`,
      generatedPattern: `${generated.vocabulary.level} vocabulary`,
      issue: "Generated text uses vocabulary significantly more sophisticated than the original",
    })
  }

  // Action verb pattern lost
  if (original.bulletStyle.startsWithActionVerb && !generated.bulletStyle.startsWithActionVerb) {
    issues.push("generic_ai_tone")
    warnings.push("Generated bullets lost the action verb pattern from the original")
  }

  // Overstatement introduced
  if (generated.confidence.evidenceOfOverstatement && !original.confidence.evidenceOfOverstatement) {
    issues.push("over_polished")
    warnings.push(
      "Generated content shows overstatement or superlatives not present in the original"
    )
  }

  // Cadence (sentence length) drift
  const lengthDelta =
    LENGTH_SCALE[generated.sentencePattern.averageLength] -
    LENGTH_SCALE[original.sentencePattern.averageLength]
  if (Math.abs(lengthDelta) >= 2) {
    issues.push("lost_original_cadence")
    warnings.push(
      `Sentence length shifted from ${original.sentencePattern.averageLength} to ${generated.sentencePattern.averageLength}`
    )
  }

  // Derive drift level
  const hasSevereIssue =
    issues.includes("unsupported_sophistication") ||
    (issues.includes("too_executive") && issues.length > 1)

  let driftLevel: VoiceDriftResult["driftLevel"]
  if (issues.length === 0) {
    driftLevel = "none"
  } else if (issues.length === 1 && !hasSevereIssue) {
    driftLevel = "low"
  } else if (issues.length <= 2 && !hasSevereIssue) {
    driftLevel = "medium"
  } else {
    driftLevel = "high"
  }

  const passed = driftLevel === "none" || driftLevel === "low"

  let recommendedAction: VoiceDriftResult["recommendedAction"]
  if (driftLevel === "none" || driftLevel === "low") {
    recommendedAction = "accept"
  } else if (driftLevel === "medium") {
    recommendedAction = "review"
  } else if (
    issues.includes("too_executive") ||
    issues.includes("unsupported_sophistication") ||
    issues.includes("over_polished")
  ) {
    recommendedAction = "regenerate_with_less_polish"
  } else {
    recommendedAction = "regenerate_with_more_clarity"
  }

  return {
    passed,
    driftLevel,
    detectedIssues: issues,
    warnings,
    examples,
    recommendedAction,
  }
}
