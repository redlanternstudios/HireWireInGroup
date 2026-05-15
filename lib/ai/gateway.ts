import { createGroq } from "@ai-sdk/groq"
import {
  generateText as aiGenerateText,
  streamText as aiStreamText,
} from "ai"

const DEFAULT_GROQ_MODEL = "llama-3.3-70b-versatile"
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
  return process.env.AI_GATEWAY_API_KEY?.trim() || process.env.GROQ_API_KEY?.trim() || ""
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

export function getAiGatewayStatus() {
  return {
    configured: isAiGatewayConfigured(),
    provider: "groq",
    model: process.env.GROQ_MODEL?.trim() || DEFAULT_GROQ_MODEL,
    fastModel: process.env.GROQ_FAST_MODEL?.trim() || DEFAULT_GROQ_FAST_MODEL,
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
    return getModel(process.env.GROQ_MODEL?.trim() || DEFAULT_GROQ_MODEL)
  },
  get QUALITY() {
    return getModel(process.env.GROQ_FAST_MODEL?.trim() || DEFAULT_GROQ_FAST_MODEL)
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
