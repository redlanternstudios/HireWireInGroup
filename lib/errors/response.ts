import { AppError } from './app-error'
import { AppErrorShape } from './types'

export function toActionResult(error: AppError | Error | unknown) {
  const err = normalizeUnknownError(error)
  return {
    success: false,
    error: err.userMessage,
    code: err.code,
    category: err.category,
    retryable: err.retryable,
    actionLabel: err.actionLabel,
    correlationId: err.correlationId,
  }
}

export function toApiErrorResponse(error: AppError | Error | unknown) {
  const err = normalizeUnknownError(error)
  // error is a flat string so client code can safely render it as a React child.
  // Structured fields are available alongside for programmatic handling.
  return {
    success: false,
    error: err.userMessage,
    error_code: err.code,
    error_category: err.category,
    retryable: err.retryable,
    actionLabel: err.actionLabel,
    correlationId: err.correlationId,
  }
}

export function safeErrorMessage(error: AppError | Error | unknown) {
  const err = normalizeUnknownError(error)
  return err.userMessage
}

export function normalizeUnknownError(error: AppError | Error | unknown): AppErrorShape {
  if (error instanceof AppError) return error
  if (error && typeof error === 'object' && 'message' in error) {
    return new AppError({
      code: 'UNKNOWN',
      category: 'UNKNOWN_ERROR',
      severity: 'error',
      source: 'unknown',
      message: (error as any).message,
      userMessage: 'Something unexpected happened. Try again or contact support with this error ID.',
      retryable: true,
      statusCode: 500,
      correlationId: '',
      timestamp: new Date().toISOString(),
    })
  }
  return new AppError({
    code: 'UNKNOWN',
    category: 'UNKNOWN_ERROR',
    severity: 'error',
    source: 'unknown',
    message: 'Unknown error',
    userMessage: 'Something unexpected happened. Try again or contact support with this error ID.',
    retryable: true,
    statusCode: 500,
    correlationId: '',
    timestamp: new Date().toISOString(),
  })
}

export function getHttpStatus(error: AppError | Error | unknown): number {
  const err = normalizeUnknownError(error)
  return err.statusCode || 500
}
