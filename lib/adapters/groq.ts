import { createGroq } from "@ai-sdk/groq"

// Initialize Groq client
export const groq = createGroq({ 
  apiKey: process.env.GROQ_API_KEY 
})

// Model constants
export const MODELS = {
  VERSATILE: "llama-3.3-70b-versatile",
  FAST: "llama-3.1-8b-instant",
  DETAILED: "llama-3.3-70b-versatile",
} as const

// Check if Groq is properly configured
export function isGroqConfigured(): boolean {
  return !!process.env.GROQ_API_KEY
}
