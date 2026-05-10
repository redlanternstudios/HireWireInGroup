import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { AnalyzeJobInputSchema } from "@/lib/schemas/job-intake"
import { analyzeJobCore } from "@/lib/analyze/analyze-job-core"

export async function POST(request: NextRequest) {
  const { validationError, authError, aiProviderError, unknownError } = await import("@/lib/errors/factory")
  const { logError: logErr } = await import("@/lib/errors/logger")
  const { toApiErrorResponse } = await import("@/lib/errors/response")
  const { createCorrelationId } = await import("@/lib/errors/correlation")
  const correlationId = createCorrelationId()
  try {
    const body = await request.json()
    const parseResult = AnalyzeJobInputSchema.safeParse(body)
    if (!parseResult.success) {
      const err = validationError({ code: "INVALID_INPUT", message: parseResult.error.errors[0]?.message, correlationId })
      logErr(err, { route: "/api/analyze" })
      return NextResponse.json(toApiErrorResponse(err), { status: 400 })
    }
    const { job_url } = parseResult.data
    const supabase = await createClient()
    const {
      data: { user },
      error: authErrorObj,
    } = await supabase.auth.getUser()
    if (authErrorObj || !user) {
      const err = authError({ code: "NOT_AUTHENTICATED", correlationId })
      logErr(err, { route: "/api/analyze" })
      return NextResponse.json(toApiErrorResponse(err), { status: 401 })
    }
    const result = await analyzeJobCore(job_url, supabase, user, request)
    if (!result.success) {
      // If rate limit, return AI_PROVIDER_ERROR with retryable
      if (result.error && (result.error.includes("rate_limit") || result.error.includes("Rate limit"))) {
        const err = aiProviderError({ code: "AI_RATE_LIMIT", message: result.error, correlationId, retryable: true })
        logErr(err, { route: "/api/analyze" })
        return NextResponse.json({ ...toApiErrorResponse(err), retryAfter: 30 }, { status: 429 })
      }
      const err = aiProviderError({ code: "ANALYZE_JOB_FAILED", message: result.error, correlationId })
      logErr(err, { route: "/api/analyze" })
      return NextResponse.json(toApiErrorResponse(err), { status: 500 })
    }
    return NextResponse.json({ ...result, correlationId })
  } catch (error) {
    const errObj = unknownError({ code: "ANALYZE_API_EXCEPTION", cause: error, correlationId })
    logErr(errObj, { route: "/api/analyze" })
    return NextResponse.json(toApiErrorResponse(errObj), { status: 500 })
  }
}
