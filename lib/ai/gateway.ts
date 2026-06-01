import { createOpenAI } from "@ai-sdk/openai"
import {
  createGateway,
  generateText as aiGenerateText,
  streamText as aiStreamText,
} from "ai"
import type { z } from "zod"
import { writeAiAuditEvent } from "./audit"

const DEFAULT_OPENAI_MODEL = "gpt-4o"
const DEFAULT_OPENAI_FAST_MODEL = "gpt-4o-mini"
const DEFAULT_TIMEOUT_MS = 30000
const STRUCTURED_OUTPUT_INCOMPATIBLE_MODEL_PATTERNS = [
  /(^|\/)llama/i,
  /(^|\/)meta-llama/i,
  /(^|\/)mixtral/i,
  /(^|\/)gemma/i,
  /(^|\/)deepseek/i,
  /(^|\/)qwen/i,
]

export const AI_GATEWAY_UNCONFIGURED_MESSAGE =
  "AI Gateway is not connected in this environment. Add AI_GATEWAY_API_KEY or OPENAI_API_KEY to enable live AI."

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
  userId?: string | null
  jobId?: string | null
  metadata?: Record<string, unknown>
}

type ProviderConfig =
  | {
      configured: true
      provider: "openai"
      apiKey: string
      keySource: "OPENAI_API_KEY" | "AI_GATEWAY_API_KEY"
    }
  | {
      configured: true
      provider: "gateway"
      apiKey: string
      keySource: "AI_GATEWAY_API_KEY"
    }
  | {
      configured: false
      provider: "none"
      apiKey: null
      keySource: null
    }

function getProviderConfig(): ProviderConfig {
  const openAiApiKey = process.env.OPENAI_API_KEY?.trim()
  if (openAiApiKey && !isPlaceholderApiKey(openAiApiKey)) {
    return {
      configured: true,
      provider: "openai",
      apiKey: openAiApiKey,
      keySource: "OPENAI_API_KEY",
    }
  }

  const aiGatewayApiKey = process.env.AI_GATEWAY_API_KEY?.trim()
  if (!aiGatewayApiKey || isPlaceholderApiKey(aiGatewayApiKey)) {
    return {
      configured: false,
      provider: "none",
      apiKey: null,
      keySource: null,
    }
  }

  if (looksLikeOpenAiKey(aiGatewayApiKey)) {
    return {
      configured: true,
      provider: "openai",
      apiKey: aiGatewayApiKey,
      keySource: "AI_GATEWAY_API_KEY",
    }
  }

  return {
    configured: true,
    provider: "gateway",
    apiKey: aiGatewayApiKey,
    keySource: "AI_GATEWAY_API_KEY",
  }
}

function looksLikeOpenAiKey(apiKey: string) {
  return apiKey.startsWith("sk-")
}

function isPlaceholderApiKey(apiKey: string) {
  const normalized = apiKey.toLowerCase()
  return (
    normalized.includes("replace") ||
    normalized.includes("your_") ||
    normalized.includes("your-") ||
    normalized.includes("changeme") ||
    normalized.includes("placeholder")
  )
}

function getTimeoutMs() {
  const parsed = Number(process.env.AI_GATEWAY_TIMEOUT_MS)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_TIMEOUT_MS
}

function getConfiguredModelName() {
  return getStructuredCompatibleModelName(
    process.env.OPENAI_MODEL?.trim(),
    DEFAULT_OPENAI_MODEL
  )
}

function getConfiguredFastModelName() {
  return getStructuredCompatibleModelName(
    process.env.OPENAI_FAST_MODEL?.trim(),
    DEFAULT_OPENAI_FAST_MODEL
  )
}

function getStructuredCompatibleModelName(modelName: string | undefined, fallback: string) {
  if (!modelName) return fallback

  const normalized = modelName.trim()
  if (
    normalized === "gpt-3.5-turbo" ||
    STRUCTURED_OUTPUT_INCOMPATIBLE_MODEL_PATTERNS.some(pattern =>
      pattern.test(normalized)
    )
  ) {
    console.warn("[ai-gateway] model does not support json_schema; using structured-output fallback", {
      requestedModel: normalized,
      fallback,
    })
    return fallback
  }

  return normalized
}

function toOpenAiModelId(modelName: string) {
  return modelName.startsWith("openai/") ? modelName.slice("openai/".length) : modelName
}

function toGatewayModelId(modelName: string) {
  return modelName.includes("/") ? modelName : `openai/${modelName}`
}

function getModel(modelName: string) {
  const config = getProviderConfig()
  if (!config.configured) throw new AiGatewayConfigurationError()

  if (config.provider === "openai") {
    return createOpenAI({ apiKey: config.apiKey })(toOpenAiModelId(modelName))
  }

  return createGateway({ apiKey: config.apiKey })(toGatewayModelId(modelName))
}

export function isAiGatewayConfigured(): boolean {
  return getProviderConfig().configured
}

export function getAiGatewayStatus() {
  const config = getProviderConfig()
  const configuredModel = getConfiguredModelName()
  const configuredFastModel = getConfiguredFastModelName()

  return {
    configured: config.configured,
    provider: config.provider,
    model:
      config.provider === "gateway"
        ? toGatewayModelId(configuredModel)
        : toOpenAiModelId(configuredModel),
    fastModel:
      config.provider === "gateway"
        ? toGatewayModelId(configuredFastModel)
        : toOpenAiModelId(configuredFastModel),
    timeoutMs: getTimeoutMs(),
    keySource: config.keySource,
  }
}

export function getActiveAnalysisModelName() {
  return getAiGatewayStatus().model
}

export const AI_MODELS = {
  get PRIMARY() {
    return getModel(getConfiguredModelName())
  },
  get QUALITY() {
    return getModel(getConfiguredFastModelName())
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
  const requestId = generateAiRequestId()
  const requestedModel = getRequestedModelName(options)
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
    void writeAiAuditEvent({
      requestId,
      userId: telemetry?.userId ?? null,
      jobId: telemetry?.jobId ?? null,
      route: source,
      operation: telemetry?.operation ?? "unknown",
      requestedModel,
      selectedProvider: status.provider,
      selectedModel: status.model,
      keySource: status.keySource,
      timeoutMs: status.timeoutMs,
      success: true,
      latencyMs: Date.now() - startedAt,
      usage: readAiUsage(result),
      finishReason: readFinishReason(result),
      metadata: telemetry?.metadata,
    })
    return result
  } catch (error) {
    const failureReason = error instanceof Error ? error.message : "Unknown AI gateway error"
    recordAiTelemetry({
      ...status,
      ...telemetry,
      route: source,
      success: false,
      latencyMs: Date.now() - startedAt,
      failureReason,
    })
    void writeAiAuditEvent({
      requestId,
      userId: telemetry?.userId ?? null,
      jobId: telemetry?.jobId ?? null,
      route: source,
      operation: telemetry?.operation ?? "unknown",
      requestedModel,
      selectedProvider: status.provider,
      selectedModel: status.model,
      keySource: status.keySource,
      timeoutMs: status.timeoutMs,
      success: false,
      latencyMs: Date.now() - startedAt,
      failureReason,
      metadata: telemetry?.metadata,
    })
    throw error
  }
}

type GenerateStructuredTextOptions<T> = Omit<GenerateTextOptions, "output"> & {
  schema: z.ZodType<T>
  schemaDescription: string
  contextPrompt?: string
}

function extractJsonFromText(text: string) {
  const trimmed = text.trim()
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i)
  if (fenced) return fenced[1].trim()

  const firstArray = trimmed.indexOf("[")
  const lastArray = trimmed.lastIndexOf("]")
  const firstObject = trimmed.indexOf("{")
  const lastObject = trimmed.lastIndexOf("}")

  if (
    firstArray !== -1 &&
    lastArray > firstArray &&
    (firstObject === -1 || firstArray < firstObject)
  ) {
    return trimmed.slice(firstArray, lastArray + 1)
  }

  if (firstObject !== -1 && lastObject > firstObject) {
    return trimmed.slice(firstObject, lastObject + 1)
  }

  return trimmed
}

export async function generateStructuredText<T>(
  options: GenerateStructuredTextOptions<T>,
  telemetry?: Partial<AiTelemetry>
): Promise<T> {
  const { schema, schemaDescription, prompt, contextPrompt, messages, ...textOptions } =
    options as GenerateStructuredTextOptions<T> & { messages?: unknown }
  const promptText =
    typeof contextPrompt === "string"
      ? contextPrompt
      : typeof prompt === "string"
        ? prompt
        : Array.isArray(prompt)
          ? JSON.stringify(prompt)
          : Array.isArray(messages)
            ? JSON.stringify(messages)
            : ""
  const structuredOptions = {
    ...textOptions,
    prompt: `${promptText}

Return only valid JSON. Do not include markdown fences, explanations, or extra text.
The JSON must match this schema exactly:
${schemaDescription}`,
  } as GenerateTextOptions

  const result = await generateText(structuredOptions, telemetry)

  return schema.parse(JSON.parse(extractJsonFromText(result.text)))
}

export function streamText(
  options: StreamTextOptions,
  telemetry?: Partial<AiTelemetry>
) {
  const startedAt = Date.now()
  const status = getAiGatewayStatus()
  const source = telemetry?.route ?? inferCallerSource()
  const requestId = generateAiRequestId()
  const requestedModel = getRequestedModelName(options)
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
        void writeAiAuditEvent({
          requestId,
          userId: telemetry?.userId ?? null,
          jobId: telemetry?.jobId ?? null,
          route: source,
          operation: telemetry?.operation ?? "unknown",
          requestedModel,
          selectedProvider: status.provider,
          selectedModel: status.model,
          keySource: status.keySource,
          timeoutMs: status.timeoutMs,
          success: true,
          latencyMs: Date.now() - startedAt,
          usage: readAiUsage(event),
          finishReason: readFinishReason(event),
          metadata: telemetry?.metadata,
        })
        await originalOnFinish?.(event)
      },
    })
  } catch (error) {
    const failureReason = error instanceof Error ? error.message : "Unknown AI gateway error"
    recordAiTelemetry({
      ...status,
      ...telemetry,
      route: source,
      success: false,
      latencyMs: Date.now() - startedAt,
      failureReason,
    })
    void writeAiAuditEvent({
      requestId,
      userId: telemetry?.userId ?? null,
      jobId: telemetry?.jobId ?? null,
      route: source,
      operation: telemetry?.operation ?? "unknown",
      requestedModel,
      selectedProvider: status.provider,
      selectedModel: status.model,
      keySource: status.keySource,
      timeoutMs: status.timeoutMs,
      success: false,
      latencyMs: Date.now() - startedAt,
      failureReason,
      metadata: telemetry?.metadata,
    })
    throw error
  }
}

function generateAiRequestId() {
  return `air_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`
}

function getRequestedModelName(options: GenerateTextOptions | StreamTextOptions) {
  const model = (options as { model?: unknown }).model
  if (!model) return null
  if (typeof model === "string") return model
  if (typeof model === "object" && model !== null) {
    const record = model as Record<string, unknown>
    return String(record.modelId ?? record.model ?? record.id ?? "configured-model")
  }
  return "configured-model"
}

function readAiUsage(result: unknown) {
  const usage = ((result as { usage?: Record<string, unknown> }).usage ?? {})
  const promptTokens = usage.promptTokens ?? usage.inputTokens
  const completionTokens = usage.completionTokens ?? usage.outputTokens
  const totalTokens = usage.totalTokens

  return {
    promptTokens: typeof promptTokens === "number" ? promptTokens : undefined,
    completionTokens: typeof completionTokens === "number" ? completionTokens : undefined,
    totalTokens: typeof totalTokens === "number" ? totalTokens : undefined,
  }
}

function readFinishReason(result: unknown) {
  const finishReason = (result as { finishReason?: unknown }).finishReason
  return typeof finishReason === "string" ? finishReason : null
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
