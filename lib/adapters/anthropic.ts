/**
 * AI provider adapter — backed by Groq (free tier).
 *
 * Exports the same CLAUDE_MODELS and isAnthropicConfigured() names so every
 * call site (generate-documents, coach, integrity, re-analyze) works unchanged.
 * Swap the model IDs below to change which Groq model each tier uses.
 *
 * Free-tier Groq models used:
 *   SONNET → llama-3.3-70b-versatile  (high quality, 32k context)
 *   OPUS   → llama-3.3-70b-versatile  (same, Groq has no larger free model)
 *   HAIKU  → llama-3.1-8b-instant     (fast, used for quality checks)
 *
 * Required env var: GROQ_API_KEY
 * Get one free at https://console.groq.com → API Keys
 */

import { createGroq } from "@ai-sdk/groq"

function getGroqClient() {
  return createGroq({ apiKey: process.env.GROQ_API_KEY })
}

export const CLAUDE_MODELS = {
  get SONNET() {
    return getGroqClient()("llama-3.3-70b-versatile")
  },
  get OPUS() {
    return getGroqClient()("llama-3.3-70b-versatile")
  },
  get HAIKU() {
    return getGroqClient()("llama-3.1-8b-instant")
  },
} as const

export type ClaudeModel = ReturnType<typeof getGroqClient>

export function isAnthropicConfigured(): boolean {
  return Boolean(process.env.GROQ_API_KEY?.trim())
}
