// Correlation ID utilities for error tracing

export function createCorrelationId(): string {
  return `hw_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`
}

export function getOrCreateCorrelationId(headers?: Record<string, string | undefined>): string {
  if (headers && headers['x-correlation-id']) {
    return headers['x-correlation-id'] as string
  }
  return createCorrelationId()
}

export function attachCorrelationIdToResponse(res: any, correlationId: string) {
  if (res && typeof res.setHeader === 'function') {
    res.setHeader('x-correlation-id', correlationId)
  }
}
