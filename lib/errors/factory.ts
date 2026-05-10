import { AppError } from './app-error'
import { AppErrorShape, ErrorCategory, ErrorSeverity, ErrorSource } from './types'
import { createCorrelationId } from './correlation'

const now = () => new Date().toISOString()

function base(shape: Partial<AppErrorShape>): AppErrorShape {
  return {
    code: shape.code || 'UNKNOWN',
    category: shape.category || 'UNKNOWN_ERROR',
    severity: shape.severity || 'error',
    source: shape.source || 'unknown',
    message: shape.message || 'An unknown error occurred.',
    userMessage: shape.userMessage || 'Something unexpected happened. Try again or contact support with this error ID.',
    actionLabel: shape.actionLabel,
    retryable: shape.retryable ?? false,
    statusCode: shape.statusCode ?? 500,
    details: shape.details,
    correlationId: shape.correlationId || createCorrelationId(),
    timestamp: shape.timestamp || now(),
    cause: shape.cause,
  }
}

export function authError(opts: Partial<AppErrorShape> = {}) {
  return new AppError(base({
    ...opts,
    category: 'AUTH_ERROR',
    statusCode: 401,
    userMessage: opts.userMessage || 'Your session expired. Please sign in again.',
    actionLabel: opts.actionLabel || 'Sign in',
    retryable: false,
    severity: 'warning',
    source: opts.source || 'client',
  }))
}

export function validationError(opts: Partial<AppErrorShape> = {}) {
  return new AppError(base({
    ...opts,
    category: 'VALIDATION_ERROR',
    statusCode: 422,
    userMessage: opts.userMessage || 'Please check your input and try again.',
    actionLabel: opts.actionLabel || 'Check input',
    retryable: false,
    severity: 'warning',
    source: opts.source || 'client',
  }))
}

export function notFoundError(opts: Partial<AppErrorShape> = {}) {
  return new AppError(base({
    ...opts,
    category: 'NOT_FOUND_ERROR',
    statusCode: 404,
    userMessage: opts.userMessage || 'We could not find that item. It may have been deleted.',
    actionLabel: opts.actionLabel || 'Back',
    retryable: false,
    severity: 'info',
    source: opts.source || 'client',
  }))
}

export function permissionError(opts: Partial<AppErrorShape> = {}) {
  return new AppError(base({
    ...opts,
    category: 'PERMISSION_ERROR',
    statusCode: 403,
    userMessage: opts.userMessage || 'You do not have access to this item.',
    actionLabel: opts.actionLabel || 'Back',
    retryable: false,
    severity: 'error',
    source: opts.source || 'client',
  }))
}

export function supabaseError(opts: Partial<AppErrorShape> = {}) {
  return new AppError(base({
    ...opts,
    category: 'SUPABASE_ERROR',
    statusCode: 500,
    userMessage: opts.userMessage || 'We could not save this change. Please try again.',
    actionLabel: opts.actionLabel || 'Retry',
    retryable: true,
    severity: 'error',
    source: opts.source || 'supabase',
  }))
}

export function aiProviderError(opts: Partial<AppErrorShape> = {}) {
  return new AppError(base({
    ...opts,
    category: 'AI_PROVIDER_ERROR',
    statusCode: 502,
    userMessage: opts.userMessage || 'The AI service did not respond in time. Try again.',
    actionLabel: opts.actionLabel || 'Retry',
    retryable: true,
    severity: 'error',
    source: opts.source || 'ai_provider',
  }))
}

export function aiOutputError(opts: Partial<AppErrorShape> = {}) {
  return new AppError(base({
    ...opts,
    category: 'AI_OUTPUT_ERROR',
    statusCode: 422,
    userMessage: opts.userMessage || 'AI output could not be used. Please try again.',
    actionLabel: opts.actionLabel || 'Retry',
    retryable: true,
    severity: 'error',
    source: opts.source || 'ai_provider',
  }))
}

export function scrapeError(opts: Partial<AppErrorShape> = {}) {
  return new AppError(base({
    ...opts,
    category: 'SCRAPE_ERROR',
    statusCode: 422,
    userMessage: opts.userMessage || 'This job board blocked automated reading. Paste the job description manually instead.',
    actionLabel: opts.actionLabel || 'Paste job description',
    retryable: false,
    severity: 'warning',
    source: opts.source || 'scraper',
  }))
}

export function documentGenerationError(opts: Partial<AppErrorShape> = {}) {
  return new AppError(base({
    ...opts,
    category: 'DOCUMENT_GENERATION_ERROR',
    statusCode: 500,
    userMessage: opts.userMessage || 'We could not generate the document. Try again.',
    actionLabel: opts.actionLabel || 'Retry',
    retryable: true,
    severity: 'error',
    source: opts.source || 'document_generation',
  }))
}

export function fileParseError(opts: Partial<AppErrorShape> = {}) {
  return new AppError(base({
    ...opts,
    category: 'FILE_PARSE_ERROR',
    statusCode: 422,
    userMessage: opts.userMessage || 'We could not parse the file. Please try another file.',
    actionLabel: opts.actionLabel || 'Try another file',
    retryable: false,
    severity: 'error',
    source: opts.source || 'file_parser',
  }))
}

export function readinessError(opts: Partial<AppErrorShape> = {}) {
  return new AppError(base({
    ...opts,
    category: 'READINESS_ERROR',
    statusCode: 409,
    userMessage: opts.userMessage || 'This job is not ready yet. Review the missing steps below.',
    actionLabel: opts.actionLabel || 'Review steps',
    retryable: false,
    severity: 'warning',
    source: opts.source || 'readiness',
  }))
}

export function qualityGateError(opts: Partial<AppErrorShape> = {}) {
  return new AppError(base({
    ...opts,
    category: 'QUALITY_GATE_ERROR',
    statusCode: 409,
    userMessage: opts.userMessage || 'This application package needs review before it can move to Ready to Apply.',
    actionLabel: opts.actionLabel || 'Open review',
    retryable: false,
    severity: 'warning',
    source: opts.source || 'quality_gate',
  }))
}

export function applicationError(opts: Partial<AppErrorShape> = {}) {
  return new AppError(base({
    ...opts,
    category: 'APPLICATION_ERROR',
    statusCode: 500,
    userMessage: opts.userMessage || 'We could not submit your application. Please try again.',
    actionLabel: opts.actionLabel || 'Retry',
    retryable: true,
    severity: 'error',
    source: opts.source || 'application_flow',
  }))
}

export function paymentError(opts: Partial<AppErrorShape> = {}) {
  return new AppError(base({
    ...opts,
    category: 'PAYMENT_ERROR',
    statusCode: 402,
    userMessage: opts.userMessage || 'We could not process your payment. Try again.',
    actionLabel: opts.actionLabel || 'Retry',
    retryable: true,
    severity: 'error',
    source: opts.source || 'billing',
  }))
}

export function rateLimitError(opts: Partial<AppErrorShape> = {}) {
  return new AppError(base({
    ...opts,
    category: 'RATE_LIMIT_ERROR',
    statusCode: 429,
    userMessage: opts.userMessage || 'You are sending requests too quickly. Please wait and try again.',
    actionLabel: opts.actionLabel || 'Wait and retry',
    retryable: true,
    severity: 'warning',
    source: opts.source || 'client',
  }))
}

export function networkError(opts: Partial<AppErrorShape> = {}) {
  return new AppError(base({
    ...opts,
    category: 'NETWORK_ERROR',
    statusCode: 503,
    userMessage: opts.userMessage || 'A network error occurred. Please check your connection and try again.',
    actionLabel: opts.actionLabel || 'Retry',
    retryable: true,
    severity: 'error',
    source: opts.source || 'client',
  }))
}

export function integrationError(opts: Partial<AppErrorShape> = {}) {
  return new AppError(base({
    ...opts,
    category: 'INTEGRATION_ERROR',
    statusCode: 502,
    userMessage: opts.userMessage || 'An integration failed. Please try again.',
    actionLabel: opts.actionLabel || 'Retry',
    retryable: true,
    severity: 'error',
    source: opts.source || 'integration',
  }))
}

export function unknownError(opts: Partial<AppErrorShape> = {}) {
  return new AppError(base({
    ...opts,
    category: 'UNKNOWN_ERROR',
    statusCode: 500,
    userMessage: opts.userMessage || 'Something unexpected happened. Try again or contact support with this error ID.',
    actionLabel: opts.actionLabel || 'Retry',
    retryable: true,
    severity: 'critical',
    source: opts.source || 'unknown',
  }))
}
