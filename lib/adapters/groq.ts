// Groq adapter shim — delegates to the configured AI gateway.
// @ai-sdk/groq is not installed; all generation routes through lib/ai/gateway.
import { AI_MODELS, isAiGatewayConfigured } from "@/lib/ai/gateway"

export const MODELS = {
  VERSATILE: "llama-3.3-70b-versatile",
  FAST: "llama-3.1-8b-instant",
} as const

// Returns the configured gateway model regardless of the requested modelId.
// When a real Groq key is added, replace this with createGroq()(modelId).
export function groq(_modelId?: string) {
  return AI_MODELS.PRIMARY
}

export function isGroqConfigured(): boolean {
  return isAiGatewayConfigured()
}
