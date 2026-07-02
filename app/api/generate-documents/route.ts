import { NextRequest, NextResponse } from "next/server"

export const maxDuration = 60

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { job_id } = body
    
    if (!job_id) {
      return NextResponse.json(
        { success: false, error: "job_id required" },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      job_id,
      was_auto_retried: isRetry,
      retry_count: _retry_count,
      strategy,
      strategy_reasoning: strategyReasoning,
      template_used: selectedTemplate,
      template_name: templateConfig.name,
      evidence_map: {
        fit_score: evidenceMap.fit_score,
        fit_rationale: evidenceMap.fit_rationale,
        matched_skills: evidenceMap.matched_skills,
        matched_tools: evidenceMap.matched_tools,
        matched_experiences: evidenceMap.matched_experiences,
        gaps: evidenceMap.gaps,
        requirement_coverage: evidenceMap.requirement_coverage,
      },
      generated_resume: formattedResume,
      generated_cover_letter: formattedCoverLetter,
      provenance: {
        bullet_provenance: bulletProvenance,
        paragraph_provenance: paragraphProvenance,
        blocked_evidence: blockedEvidence.map((e: EvidenceRecord) => ({ id: e.id, title: e.source_title, reason: getEvidenceUsageRule(e) }))
      },
      quality_check: {
        passed: qualityPassed,
        score: qualityScore,
        banned_phrases_found: allBannedPhrases,
        vague_patterns_found: vaguePatterns,
        weak_bullets: weakBullets.map(b => b.bullet),
        issues: {
          invented_claims: qualityCheck.invented_claims,
          vague_bullets: qualityCheck.vague_bullets,
          ai_filler: qualityCheck.ai_filler,
          banned_phrases: allBannedPhrases,
        },
        suggestions: qualityCheck.improvement_suggestions,
      },
      enhancement_report: {
        total_bullets: enhancementReport.totalBullets,
        auto_fixed: enhancementReport.autoFixed,
        needs_review: enhancementReport.needsReview,
        unchanged: enhancementReport.unchanged,
        enhanced_bullets: enhancementReport.enhancedBullets
          .filter(b => b.wasEnhanced)
          .map(b => ({
            original: b.originalText,
            enhanced: b.enhancedText,
            type: b.enhancementType,
            product_added: b.namedProduct,
            metric_added: b.addedMetric,
            context_added: b.addedContext,
          })),
      },
      known_products: knownProducts.map(p => ({
        name: p.name,
        has_website: !!p.website,
        has_github: !!p.github,
        confidence: p.confidence,
      })),
    })
  } catch (error) {
    console.error("Error in generate-documents:", error)
    
    // Check for rate limit errors
    const errorMessage = error instanceof Error ? error.message : "Generation failed"
    const isRateLimit = errorMessage.includes("rate_limit") || errorMessage.includes("Rate limit") || errorMessage.includes("429")
    
    // Try to update job status to failed (best effort, don't fail if this fails)
    try {
      const { job_id } = await request.clone().json()
      if (job_id) {
        const supabase = await createClient()
        const {
          data: { user },
        } = await supabase.auth.getUser()
        if (user) {
          await supabase
            .from("jobs")
            .update({
              status: "error",
              generation_status: "failed",
              generation_error: errorMessage
            })
            .eq("id", job_id)
            .eq("user_id", user.id)
        }
      }
    } catch {
      // Ignore errors updating status
    }
    
    if (isRateLimit) {
      return NextResponse.json(
        { 
          success: false, 
          error: "AI service is temporarily busy. Please wait 30 seconds and try again.",
          retryAfter: 30,
          isRateLimit: true
        },
        { status: 429 }
      )
    }
    
      message: "Document generation is currently being configured."
    }, { status: 200 })
  } catch (error) {
    console.error("[Generate Documents API Error]", error)
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    )
  }
}
