import { generateStructuredText } from "@/lib/ai/gateway"
import { z } from "zod"
import { CLAUDE_MODELS } from "@/lib/ai/gateway"
import type { VoiceProfile } from "./voice-types"

const VoiceProfileSchema = z.object({
  tone: z.object({
    primary: z.enum(["plainspoken", "technical", "executive", "analytical", "warm", "direct"]),
    secondary: z.array(z.string()),
  }),
  formality: z.enum(["low", "medium", "high"]),
  sentencePattern: z.object({
    averageLength: z.enum(["short", "medium", "long"]),
    structure: z.enum(["concise_bullets", "narrative_bullets", "metric_first", "responsibility_first"]),
  }),
  bulletStyle: z.object({
    startsWithActionVerb: z.boolean(),
    metricDensity: z.enum(["low", "medium", "high"]),
    typicalPattern: z.enum([
      "action_context_result",
      "responsibility_tool_outcome",
      "task_based",
      "achievement_based",
    ]),
  }),
  vocabulary: z.object({
    level: z.enum(["simple", "professional", "technical", "executive"]),
    industryTerms: z.array(z.string()),
    repeatedTerms: z.array(z.string()),
    commonActionVerbs: z.array(z.string()),
  }),
  confidence: z.object({
    level: z.enum(["reserved", "balanced", "assertive"]),
    evidenceOfOverstatement: z.boolean(),
  }),
  quality: z.object({
    grammarRisk: z.enum(["low", "medium", "high"]),
    spellingRisk: z.enum(["low", "medium", "high"]),
    clarityRisk: z.enum(["low", "medium", "high"]),
  }),
  preserve: z.object({
    phrases: z.array(z.string()),
    styleNotes: z.array(z.string()),
  }),
  avoid: z.object({
    phrases: z.array(z.string()),
    risks: z.array(z.string()),
  }),
})

const VOICE_PROFILE_SCHEMA_DESCRIPTION = `{
  "tone": {
    "primary": "plainspoken" | "technical" | "executive" | "analytical" | "warm" | "direct",
    "secondary": string[]
  },
  "formality": "low" | "medium" | "high",
  "sentencePattern": {
    "averageLength": "short" | "medium" | "long",
    "structure": "concise_bullets" | "narrative_bullets" | "metric_first" | "responsibility_first"
  },
  "bulletStyle": {
    "startsWithActionVerb": boolean,
    "metricDensity": "low" | "medium" | "high",
    "typicalPattern": "action_context_result" | "responsibility_tool_outcome" | "task_based" | "achievement_based"
  },
  "vocabulary": {
    "level": "simple" | "professional" | "technical" | "executive",
    "industryTerms": string[],
    "repeatedTerms": string[],
    "commonActionVerbs": string[]
  },
  "confidence": {
    "level": "reserved" | "balanced" | "assertive",
    "evidenceOfOverstatement": boolean
  },
  "quality": {
    "grammarRisk": "low" | "medium" | "high",
    "spellingRisk": "low" | "medium" | "high",
    "clarityRisk": "low" | "medium" | "high"
  },
  "preserve": {
    "phrases": string[],
    "styleNotes": string[]
  },
  "avoid": {
    "phrases": string[],
    "risks": string[]
  }
}`

const FALLBACK_PROFILE: VoiceProfile = {
  tone: { primary: "plainspoken" },
  formality: "medium",
  sentencePattern: { averageLength: "medium", structure: "concise_bullets" },
  bulletStyle: {
    startsWithActionVerb: true,
    metricDensity: "medium",
    typicalPattern: "action_context_result",
  },
  vocabulary: {
    level: "professional",
    industryTerms: [],
    repeatedTerms: [],
    commonActionVerbs: [],
  },
  confidence: { level: "balanced", evidenceOfOverstatement: false },
  quality: { grammarRisk: "low", spellingRisk: "low", clarityRisk: "low" },
  preserve: { phrases: [], styleNotes: [] },
  avoid: { phrases: [], risks: [] },
}

export async function extractVoiceProfile(resumeText: string): Promise<VoiceProfile> {
  if (!resumeText || resumeText.trim().length < 100) {
    return FALLBACK_PROFILE
  }

  try {
    return await generateStructuredText({
      model: CLAUDE_MODELS.HAIKU,
      schema: VoiceProfileSchema,
      schemaDescription: VOICE_PROFILE_SCHEMA_DESCRIPTION,
      prompt: `Analyze this resume text and extract the author's professional voice profile.

RESUME TEXT:
${resumeText.slice(0, 3000)}

Return a JSON voice profile that captures:
- tone.primary: dominant style (plainspoken=direct/everyday, technical=jargon-heavy, executive=strategic/high-level, analytical=data-driven, warm=personable, direct=terse/confident)
- formality: low=casual/first-person-heavy, medium=professional, high=formal/third-person
- sentencePattern.averageLength: short=under 12 words per bullet, medium=12-20, long=20+
- sentencePattern.structure: how bullets are organized
- bulletStyle: verb patterns, metric density, typical pattern
- vocabulary: sophistication level and repeated terms found in the text
- confidence: how assertive the writing is; flag overstatement if you see unsupported superlatives
- quality: grammar/spelling/clarity risks observed
- preserve: up to 5 distinctive phrases or style notes worth keeping exactly
- avoid: patterns that would sound wrong for this person (e.g. "do not use synergy-type buzzwords")

Be specific — extract actual verbs, terms, and phrases from the text. If the text is too short or generic to reliably assess a field, use the most neutral/default value.`,
    })
  } catch {
    return FALLBACK_PROFILE
  }
}
