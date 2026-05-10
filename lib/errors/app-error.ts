import { AppErrorShape, ErrorCategory, ErrorSeverity, ErrorSource } from './types'

export class AppError extends Error {
  code: string
  category: ErrorCategory
  severity: ErrorSeverity
  source: ErrorSource
  userMessage: string
  actionLabel?: string
  retryable: boolean
  statusCode: number
  details?: Record<string, any>
  correlationId: string
  timestamp: string
  cause?: unknown

  constructor(shape: AppErrorShape) {
    super(shape.message)
    this.name = 'AppError'
    this.code = shape.code
    this.category = shape.category
    this.severity = shape.severity
    this.source = shape.source
    this.userMessage = shape.userMessage
    this.actionLabel = shape.actionLabel
    this.retryable = shape.retryable
    this.statusCode = shape.statusCode
    this.details = shape.details
    this.correlationId = shape.correlationId
    this.timestamp = shape.timestamp
    this.cause = shape.cause
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AppError)
    }
  }

  toJSON() {
    return {
      code: this.code,
      category: this.category,
      severity: this.severity,
      source: this.source,
      message: this.message,
      userMessage: this.userMessage,
      actionLabel: this.actionLabel,
      retryable: this.retryable,
      statusCode: this.statusCode,
      details: this.details,
      correlationId: this.correlationId,
      timestamp: this.timestamp,
    }
  }

  safeUserResponse() {
    return {
      code: this.code,
      category: this.category,
      message: this.userMessage,
      actionLabel: this.actionLabel,
      retryable: this.retryable,
      correlationId: this.correlationId,
    }
  }
}
