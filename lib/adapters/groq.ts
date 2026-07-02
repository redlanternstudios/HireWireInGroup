import { createGroq } from "@ai-sdk/groq"

// Groq provider — fast, cheap inference for the coach chat and document
// drafting. Bound to GROQ_API_KEY, the env the routes already reference.
// (Anthropic/OpenAI analysis models are resolved separately via lib/ai/gateway.)
const groqProvider = createGroq({
  apiKey: process.env.GROQ_API_KEY ?? "",
})

// Model ids used across the app. Keep these in one place so a model swap is
// a single edit rather than a scatter of string literals.
export const MODELS = {
  VERSATILE: "llama-3.3-70b-versatile",
  FAST: "llama-3.1-8b-instant",
} as const

export function isGroqConfigured(): boolean {
  return Boolean(process.env.GROQ_API_KEY?.trim())
}

// Returns an AI SDK v6 LanguageModel for the given Groq model id.
export function groq(modelId: string) {
  return groqProvider(modelId)
}
