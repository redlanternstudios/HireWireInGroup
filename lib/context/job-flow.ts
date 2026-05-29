/**
 * JobFlowContext - Execution context for job processing flows.
 * Separates system execution metadata from user input contracts.
 */

export interface JobFlowContext {
  /** Unique correlation ID for tracing this flow across logs/services */
  correlationId: string
  
  /** User ID owning this flow */
  userId: string
  
  /** Job ID being processed */
  jobId: string
  
  /** Timestamp when flow started */
  startedAt: Date
}

/**
 * Creates a JobFlowContext from request and input data.
 * Centralizes context creation logic.
 */
export function createJobFlowContext(params: {
  userId: string
  jobId: string
}): JobFlowContext {
  const { userId, jobId } = params
  
  return {
    correlationId: generateCorrelationId(),
    userId,
    jobId,
    startedAt: new Date(),
  }
}

/**
 * Generates a unique correlation ID for flow tracing.
 * Format: hw-{timestamp}-{random}
 */
function generateCorrelationId(): string {
  const timestamp = Date.now().toString(36)
  const random = Math.random().toString(36).substring(2, 8)
  return `hw-${timestamp}-${random}`
}
