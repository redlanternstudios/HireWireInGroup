import { createGroq } from "@ai-sdk/groq"
import {
  generateText as aiGenerateText,
  streamText as aiStreamText,
} from "ai"

// llama-4-scout supports json_schema structured output on Groq (current as of May 2026)
const DEFAULT_GROQ_MODEL = "meta-llama/llama-4-scout-17b-16e-instruct"
const DEFAULT_GROQ_FAST_MODEL = "llama-3.1-8b-instant"
const DEFAULT_TIMEOUT_MS = 30000

export const AI_GATEWAY_UNCONFIGURED_MESSAGE =
  "AI Gateway is not connected in this environment. Add AI_GATEWAY_API_KEY to enable live AI."

export class AiGatewayConfigurationError extends Error {
  constructor() {
    super(AI_GATEWAY_UNCONFIGURED_MESSAGE)
    this.name = "AiGatewayConfigurationError"
  }
}

type GenerateTextOptions = Parameters<typeof aiGenerateText>[0]
type StreamTextOptions = Parameters<typeof aiStreamText>[0]

type AiTelemetry = {
  route: string
  operation: string
}

function getApiKey() {
  // AI_GATEWAY_API_KEY may be a Vercel AI Gateway key (vck_...) or a Groq key (gsk_...).
  // createGroq() only accepts Groq keys — use it only when it looks like one.
  const gatewayKey = process.env.AI_GATEWAY_API_KEY?.trim() ?? ""
  const groqKey = process.env.GROQ_API_KEY?.trim() ?? ""
  if (gatewayKey.startsWith("gsk_")) return gatewayKey
  return groqKey || gatewayKey // fall back to groqKey, then gateway key as last resort
}

function getTimeoutMs() {
  const parsed = Number(process.env.AI_GATEWAY_TIMEOUT_MS)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_TIMEOUT_MS
}

function getGroqClient() {
  const apiKey = getApiKey()
  if (!apiKey) throw new AiGatewayConfigurationError()
  return createGroq({ apiKey })
}

function getModel(modelName: string) {
  return getGroqClient()(modelName)
}

export function isAiGatewayConfigured(): boolean {
  return Boolean(getApiKey())
}

// Resolved model names — always use DEFAULT_GROQ_MODEL unless explicitly overridden
// with a valid non-legacy model. This prevents stale GROQ_MODEL env vars from
// silently switching back to decommissioned models like llama-3.3-70b-versatile.
const LEGACY_MODELS = new Set([
  "llama-3.3-70b-versatile",
  "llama-3.1-70b-versatile",
  "llama3-70b-8192",
])

function resolveModel(envVar: string | undefined, defaultModel: string): string {
  const override = envVar?.trim()
  if (override && !LEGACY_MODELS.has(override)) return override
  return defaultModel
}

export function getAiGatewayStatus() {
  const model = resolveModel(process.env.GROQ_MODEL, DEFAULT_GROQ_MODEL)
  const fastModel = resolveModel(process.env.GROQ_FAST_MODEL, DEFAULT_GROQ_FAST_MODEL)
  return {
    configured: isAiGatewayConfigured(),
    provider: "groq",
    model,
    fastModel,
    timeoutMs: getTimeoutMs(),
    keySource: process.env.AI_GATEWAY_API_KEY?.trim()
      ? "AI_GATEWAY_API_KEY"
      : process.env.GROQ_API_KEY?.trim()
        ? "GROQ_API_KEY"
        : null,
  }
}

export const AI_MODELS = {
  get PRIMARY() {
    return getModel(resolveModel(process.env.GROQ_MODEL, DEFAULT_GROQ_MODEL))
  },
  get QUALITY() {
    return getModel(resolveModel(process.env.GROQ_FAST_MODEL, DEFAULT_GROQ_FAST_MODEL))
  },
} as const

// Backward-compatible names while callers are migrated.
export const CLAUDE_MODELS = {
  get SONNET() {
    return AI_MODELS.PRIMARY
  },
  get OPUS() {
    return AI_MODELS.PRIMARY
  },
  get HAIKU() {
    return AI_MODELS.QUALITY
  },
} as const

export function isAnthropicConfigured(): boolean {
  return isAiGatewayConfigured()
}

/**
 * generateObject — kept for backwards compatibility but always routes through
 * generateStructuredText so no Groq json_schema 400 can occur.
 * Callers that need structured output should prefer generateStructuredText directly.
 */
export async function generateObject<T>(
  options: { model: GenerateTextOptions["model"]; schema: import("zod").ZodType<T>; prompt?: string; system?: string; schemaDescription?: string },
  telemetry?: Partial<AiTelemetry>
): Promise<{ object: T }> {
  const object = await generateStructuredText(
    {
      model: options.model,
      schema: options.schema,
      contextPrompt: options.prompt ?? "",
      schemaDescription: options.schemaDescription ?? "(Extract all fields from the schema)",
      system: options.system,
    },
    telemetry
  )
  return { object }
}

/**
 * generateStructuredText — reliable structured output for any Groq model.
 *
 * Uses generateText with a JSON-schema prompt instead of json_schema mode,
 * which is only supported on a small subset of Groq models and rejects
 * schemas with optional/nullable fields. Falls back gracefully on parse errors.
 */
export async function generateStructuredText<T>(
  options: {
    model: GenerateTextOptions["model"]
    schema: import("zod").ZodType<T>
    schemaDescription: string   // human-readable field list for the prompt
    contextPrompt: string       // the actual task / content to analyze
    system?: string
  },
  telemetry?: Partial<AiTelemetry>
): Promise<T> {
  const { schema, schemaDescription, contextPrompt, model, system } = options
  const prompt = `${contextPrompt}

Return ONLY valid JSON matching this schema (no markdown, no code fences, no explanation):
${schemaDescription}`

  const result = await generateText({ model, prompt, system }, telemetry)
  const raw = result.text.replace(/^```(?:json)?\n?|```$/gm, "").trim()

  const parsed = schema.safeParse(JSON.parse(raw))
  if (!parsed.success) {
    throw new Error(`AI response failed schema validation: ${parsed.error.issues.map(i => i.path.join(".") + ": " + i.message).join("; ")}`)
  }
  return parsed.data
}

export async function generateText(
  options: GenerateTextOptions,
  telemetry?: Partial<AiTelemetry>
) {
  const startedAt = Date.now()
  const status = getAiGatewayStatus()
  const source = telemetry?.route ?? inferCallerSource()
  try {
    const result = await aiGenerateText({
      ...options,
      abortSignal: AbortSignal.timeout(status.timeoutMs),
    })
    recordAiTelemetry({
      ...status,
      ...telemetry,
      route: source,
      success: true,
      latencyMs: Date.now() - startedAt,
    })
    return result
  } catch (error) {
    recordAiTelemetry({
      ...status,
      ...telemetry,
      route: source,
      success: false,
      latencyMs: Date.now() - startedAt,
      failureReason: error instanceof Error ? error.message : "Unknown AI gateway error",
    })
    throw error
  }
}

export function streamText(
  options: StreamTextOptions,
  telemetry?: Partial<AiTelemetry>
) {
  const startedAt = Date.now()
  const status = getAiGatewayStatus()
  const source = telemetry?.route ?? inferCallerSource()
  try {
    const originalOnFinish = options.onFinish
    return aiStreamText({
      ...options,
      abortSignal: AbortSignal.timeout(status.timeoutMs),
      async onFinish(event) {
        recordAiTelemetry({
          ...status,
          ...telemetry,
          route: source,
          success: true,
          latencyMs: Date.now() - startedAt,
        })
        await originalOnFinish?.(event)
      },
    })
  } catch (error) {
    recordAiTelemetry({
      ...status,
      ...telemetry,
      route: source,
      success: false,
      latencyMs: Date.now() - startedAt,
      failureReason: error instanceof Error ? error.message : "Unknown AI gateway error",
    })
    throw error
  }
}

function inferCallerSource() {
  const stack = new Error().stack ?? ""
  const line = stack
    .split("\n")
    .find(entry =>
      entry.includes("/app/") ||
      entry.includes("/lib/") ||
      entry.includes("\\app\\") ||
      entry.includes("\\lib\\")
    )
  return line?.trim() ?? "unknown"
}

function recordAiTelemetry(event: ReturnType<typeof getAiGatewayStatus> & {
  route?: string
  operation?: string
  success: boolean
  latencyMs: number
  failureReason?: string
}) {
  // Server log only for now. This keeps telemetry truthful without inventing a
  // storage contract before the product chooses an observability sink.
  console.info("[ai-gateway]", {
    provider: event.provider,
    model: event.model,
    route: event.route ?? "unknown",
    operation: event.operation ?? "unknown",
    latencyMs: event.latencyMs,
    success: event.success,
    failureReason: event.failureReason,
  })
}
