import { NextRequest, NextResponse } from "next/server";
import { AnalyzeJobInputSchema } from "@/lib/schemas/job-intake";
import { analyzeJobCore } from "@/lib/analyze/analyze-job-core";
import {
  AI_GATEWAY_UNCONFIGURED_MESSAGE,
  AiGatewayConfigurationError,
  isAnthropicConfigured,
} from "@/lib/ai/gateway";
import { requireUser } from "@/lib/supabase/require-user";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const parseResult = AnalyzeJobInputSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: parseResult.error.errors[0]?.message || "Invalid input",
        },
        { status: 400 },
      );
    }

    const { job_url, job_description } = parseResult.data;

    const auth = await requireUser();
    if (!auth.ok) return auth.response;
    const { supabase, user } = auth;

    if (!isAnthropicConfigured()) {
      return NextResponse.json(
        {
          success: false,
          error: "ai_gateway_not_configured",
          user_message: AI_GATEWAY_UNCONFIGURED_MESSAGE,
        },
        { status: 503 },
      );
    }

    // Pass both job_url and job_description to analyzeJobCore
    const result = await analyzeJobCore(
      job_url ?? null,
      supabase,
      user,
      request,
      job_description ?? null,
    );

    if (!result.success) {
      const status = "retryAfter" in result ? 429 : 500;
      return NextResponse.json(
        { success: false, error: result.error },
        { status },
      );
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error in analyze-job:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Analysis failed";
    const isAiGatewayAuthError =
      error instanceof AiGatewayConfigurationError ||
      errorMessage.includes("Unauthenticated request to AI Gateway") ||
      errorMessage.includes("AI_GATEWAY_API_KEY") ||
      errorMessage.includes("OPENAI_API_KEY");
    if (isAiGatewayAuthError) {
      return NextResponse.json(
        {
          success: false,
          error: "ai_gateway_not_configured",
          user_message: AI_GATEWAY_UNCONFIGURED_MESSAGE,
        },
        { status: 503 },
      );
    }
    const isRateLimit =
      errorMessage.includes("rate_limit") ||
      errorMessage.includes("Rate limit");
    if (isRateLimit) {
      return NextResponse.json(
        {
          success: false,
          error:
            "AI service is temporarily busy. Please wait 30 seconds and try again.",
          retryAfter: 30,
        },
        { status: 429 },
      );
    }
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 },
    );
  }
}
