import { AppError } from './app-error'

interface ErrorLogContext {
  userId?: string
  jobId?: string
  applicationId?: string
  documentId?: string
  route?: string
  action?: string
  provider?: string
  model?: string
  requestUrl?: string
  method?: string
  metadata?: Record<string, any>
}

export function logError(error: AppError, context: ErrorLogContext = {}) {
  if (process.env.NODE_ENV !== 'production') {
    // eslint-disable-next-line no-console
    console.error('[HireWire Error]', error, context)
  }
  // TODO: Insert into Supabase audit_events or processing_events
  // TODO: Add Sentry or external logging if needed
}

export function logWarning(error: AppError, context: ErrorLogContext = {}) {
  if (process.env.NODE_ENV !== 'production') {
    // eslint-disable-next-line no-console
    console.warn('[HireWire Warning]', error, context)
  }
}

export function logInfo(message: string, context: ErrorLogContext = {}) {
  if (process.env.NODE_ENV !== 'production') {
    // eslint-disable-next-line no-console
    console.info('[HireWire Info]', message, context)
  }
}

export function logCritical(error: AppError, context: ErrorLogContext = {}) {
  if (process.env.NODE_ENV !== 'production') {
    // eslint-disable-next-line no-console
    console.error('[HireWire CRITICAL]', error, context)
  }
  // TODO: Insert into Supabase or Sentry
}
