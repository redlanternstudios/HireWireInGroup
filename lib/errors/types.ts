// Universal error types for HireWire

export type ErrorCategory =
  | 'AUTH_ERROR'
  | 'VALIDATION_ERROR'
  | 'NOT_FOUND_ERROR'
  | 'PERMISSION_ERROR'
  | 'SUPABASE_ERROR'
  | 'AI_PROVIDER_ERROR'
  | 'AI_OUTPUT_ERROR'
  | 'SCRAPE_ERROR'
  | 'DOCUMENT_GENERATION_ERROR'
  | 'FILE_PARSE_ERROR'
  | 'READINESS_ERROR'
  | 'QUALITY_GATE_ERROR'
  | 'APPLICATION_ERROR'
  | 'PAYMENT_ERROR'
  | 'RATE_LIMIT_ERROR'
  | 'NETWORK_ERROR'
  | 'INTEGRATION_ERROR'
  | 'UNKNOWN_ERROR'

export type ErrorSeverity = 'info' | 'warning' | 'error' | 'critical'

export type ErrorSource =
  | 'client'
  | 'server_action'
  | 'api_route'
  | 'supabase'
  | 'ai_provider'
  | 'scraper'
  | 'document_generation'
  | 'file_parser'
  | 'readiness'
  | 'quality_gate'
  | 'application_flow'
  | 'billing'
  | 'integration'
  | 'unknown'

export type AppErrorCode = string

export interface AppErrorShape {
  code: AppErrorCode
  category: ErrorCategory
  severity: ErrorSeverity
  source: ErrorSource
  message: string
  userMessage: string
  actionLabel?: string
  retryable: boolean
  statusCode: number
  details?: Record<string, any>
  correlationId: string
  timestamp: string
  cause?: unknown
}
