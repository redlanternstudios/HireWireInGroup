/**
 * Bullet Enhancer
 * 
 * Pre-generation enhancement pass that strengthens bullets
 * with known profile data before final resume assembly.
 * 
 * Key behaviors:
 * 1. Replace abstract product references with named products
 * 2. Add missing metrics from evidence when safe
 * 3. Add business/domain context
 * 4. Add scope when explicitly known
 * 5. Never invent - only use grounded data
 */

import {
  type KnownProduct,
  type ProfileKnowledge,
  type EnhancementSuggestion,
  extractKnownProducts,
  buildProfileKnowledge,
  attemptAutoRepair,
  matchToKnownProduct,
} from "./profile-knowledge-resolver"
import type { EvidenceRecord } from "./types"

// ============================================================================
// TYPES
// ============================================================================

export interface BulletEnhancementInput {
  bulletText: string
  sourceEvidenceId?: string
  matchedRequirement?: string
  keywordsToInclude?: string[]
}

export interface EnhancedBullet {
  originalText: string
  enhancedText: string
  wasEnhanced: boolean
  enhancementType: "auto_fixed" | "user_review_needed" | "no_change"
  enhancements: EnhancementSuggestion[]
  confidence: "high" | "medium" | "low"
  namedProduct?: string
  addedMetric?: string
  addedContext?: string
}

export interface EnhancementReport {
  totalBullets: number
  autoFixed: number
  needsReview: number
  unchanged: number
  enhancedBullets: EnhancedBullet[]
}

// ============================================================================
// CORE ENHANCEMENT LOGIC
// ============================================================================

/**
 * Enhance a single bullet using profile knowledge
 */
export function enhanceSingleBullet(
  input: BulletEnhancementInput,
  knownProducts: KnownProduct[],
  profileKnowledge: ProfileKnowledge,
  sourceEvidence?: EvidenceRecord
): EnhancedBullet {
  const { bulletText, keywordsToInclude = [] } = input
  
  // Start with original
  let enhancedText = bulletText
  const enhancements: EnhancementSuggestion[] = []
  let namedProduct: string | undefined
  let addedMetric: string | undefined
  let addedContext: string | undefined
  
  // 1. Try to match and replace abstract product references
  const matchedProduct = matchToKnownProduct(bulletText, knownProducts)
  if (matchedProduct && matchedProduct.confidence === "explicit") {
    // Check if bullet already mentions the product name
    if (!bulletText.toLowerCase().includes(matchedProduct.name.toLowerCase())) {
      // Find abstract patterns to replace
      const abstractPatterns = [
        /\b(?:the\s+)?(AI|ML)\s+(platform|system|tool|application|product)\b/gi,
        /\b(?:the\s+)?(career|job)\s+(platform|system|tool|application)\b/gi,
        /\b(?:the\s+)?(trading|finance)\s+(platform|system|tool|application)\b/gi,
        /\b(?:an?\s+)?(platform|system|tool|application|product)\b/gi,
      ]
      
      for (const pattern of abstractPatterns) {
        const match = bulletText.match(pattern)
        if (match) {
          enhancedText = enhancedText.replace(match[0], matchedProduct.name)
          namedProduct = matchedProduct.name
          enhancements.push({
            type: "product_name",
            confidence: "safe",
            original: match[0],
            enhanced: matchedProduct.name,
            source: `Evidence: ${matchedProduct.evidenceIds[0]}`,
            reason: `Replaced generic reference with known product "${matchedProduct.name}"`,
          })
          break
        }
      }
    }
  }
  
  // 2. Add metrics if missing and available from source evidence
  const hasMetric = /\d+%|\$[\d,]+|\d+[xX]|\d+\s*(users?|customers?|clients?|teams?|projects?)/i.test(enhancedText)
  if (!hasMetric && sourceEvidence) {
    // Check for metrics in source evidence outcomes
    for (const outcome of sourceEvidence.outcomes || []) {
      const metricMatch = outcome.match(/(\d+%|\$[\d,]+|\d+[xX]|\d+\s*(users?|customers?|clients?|teams?|projects?))/i)
      if (metricMatch) {
        // Try to naturally incorporate the metric
        const metric = metricMatch[0]
        
        // Add metric at end of bullet if it makes sense
        if (enhancedText.endsWith(".")) {
          enhancedText = enhancedText.slice(0, -1) + `, achieving ${metric}.`
        } else {
          enhancedText = enhancedText + `, achieving ${metric}`
        }
        
        addedMetric = metric
        enhancements.push({
          type: "metric",
          confidence: "safe",
          original: "(no metric)",
          enhanced: metric,
          source: `Evidence: ${sourceEvidence.id}`,
          reason: `Added metric from source evidence outcomes`,
        })
        break
      }
    }
  }
  
  // 3. Add business context if bullet is too technical
  const isTooTechnical = /^(Built|Developed|Created|Implemented|Designed)\s+/i.test(bulletText) && 
    !/(for|to|enabling|supporting|serving|helping)/i.test(bulletText)
  
  if (isTooTechnical && sourceEvidence?.business_goal) {
    const context = sourceEvidence.business_goal.split(".")[0]
    if (context.length < 60) {
      if (enhancedText.endsWith(".")) {
        enhancedText = enhancedText.slice(0, -1) + ` to ${context.toLowerCase()}.`
      } else {
        enhancedText = enhancedText + ` to ${context.toLowerCase()}`
      }
      
      addedContext = context
      enhancements.push({
        type: "context",
        confidence: "safe",
        original: "(no context)",
        enhanced: context,
        source: `Evidence: ${sourceEvidence.id}`,
        reason: `Added business context from evidence`,
      })
    }
  }
  
  // 4. Incorporate any required keywords naturally if not already present
  for (const keyword of keywordsToInclude) {
    if (!enhancedText.toLowerCase().includes(keyword.toLowerCase())) {
      // Only add if it fits naturally (don't force)
      // This is a placeholder for more sophisticated keyword injection
    }
  }
  
  // Determine enhancement result
  const wasEnhanced = enhancedText !== bulletText
  const needsReview = enhancements.some(e => e.confidence === "needs_review")
  
  return {
    originalText: bulletText,
    enhancedText,
    wasEnhanced,
    enhancementType: needsReview ? "user_review_needed" : wasEnhanced ? "auto_fixed" : "no_change",
    enhancements,
    confidence: wasEnhanced && !needsReview ? "high" : needsReview ? "medium" : "low",
    namedProduct,
    addedMetric,
    addedContext,
  }
}

/**
 * Enhance multiple bullets in batch
 */
export function enhanceBulletsBatch(
  bullets: BulletEnhancementInput[],
  profile: {
    full_name?: string
    email?: string
    phone?: string
    location?: string
    summary?: string
    skills?: string[]
    links?: { portfolio?: string; linkedin?: string; github?: string; website?: string }
    experience?: Array<{ title: string; company: string; description?: string }>
  },
  evidence: EvidenceRecord[]
): EnhancementReport {
  // Build knowledge base
  const knownProducts = extractKnownProducts(evidence)
  const profileKnowledge = buildProfileKnowledge(profile, evidence)
  
  // Create evidence lookup
  const evidenceLookup = new Map<string, EvidenceRecord>()
  for (const ev of evidence) {
    evidenceLookup.set(ev.id, ev)
  }
  
  // Enhance each bullet
  const enhancedBullets: EnhancedBullet[] = []
  
  for (const bullet of bullets) {
    const sourceEvidence = bullet.sourceEvidenceId 
      ? evidenceLookup.get(bullet.sourceEvidenceId)
      : undefined
    
    const enhanced = enhanceSingleBullet(
      bullet,
      knownProducts,
      profileKnowledge,
      sourceEvidence
    )
    
    enhancedBullets.push(enhanced)
  }
  
  // Generate report
  return {
    totalBullets: bullets.length,
    autoFixed: enhancedBullets.filter(b => b.enhancementType === "auto_fixed").length,
    needsReview: enhancedBullets.filter(b => b.enhancementType === "user_review_needed").length,
    unchanged: enhancedBullets.filter(b => b.enhancementType === "no_change").length,
    enhancedBullets,
  }
}

// ============================================================================
// PRE-GENERATION ENHANCEMENT PASS
// ============================================================================

/**
 * Run the full pre-generation enhancement pass
 * This should be called after evidence mapping but before final formatting
 */
export async function runPreGenerationEnhancement(
  draftBullets: Array<{
    bullet_text: string
    source_evidence_id: string
    source_role: string
    source_company: string
    matched_requirement?: string
    keywords_used: string[]
  }>,
  profile: {
    full_name?: string
    email?: string
    phone?: string
    location?: string
    summary?: string
    skills?: string[]
    links?: { portfolio?: string; linkedin?: string; github?: string }
    experience?: Array<{ title: string; company: string; description?: string }>
  },
  evidence: EvidenceRecord[]
): Promise<{
  enhancedBullets: Array<{
    bullet_text: string
    source_evidence_id: string
    source_role: string
    source_company: string
    matched_requirement?: string
    keywords_used: string[]
    was_enhanced: boolean
    enhancement_notes: string[]
  }>
  report: EnhancementReport
}> {
  // Convert to enhancement input format
  const inputs: BulletEnhancementInput[] = draftBullets.map(b => ({
    bulletText: b.bullet_text,
    sourceEvidenceId: b.source_evidence_id,
    matchedRequirement: b.matched_requirement,
    keywordsToInclude: b.keywords_used,
  }))
  
  // Run batch enhancement
  const report = enhanceBulletsBatch(inputs, profile, evidence)
  
  // Merge enhanced text back into original structure
  const enhancedBullets = draftBullets.map((original, i) => {
    const enhanced = report.enhancedBullets[i]
    return {
      ...original,
      bullet_text: enhanced.enhancementType === "auto_fixed" 
        ? enhanced.enhancedText 
        : original.bullet_text,
      was_enhanced: enhanced.wasEnhanced,
      enhancement_notes: enhanced.enhancements.map(e => e.reason),
    }
  })
  
  return {
    enhancedBullets,
    report,
  }
}

// ============================================================================
// PROJECT SECTION GENERATION
// ============================================================================

/**
 * Generate a "Selected Products" or "Projects" section
 * for resumes when the user has named systems with live artifacts
 */
export function generateProjectsSection(
  knownProducts: KnownProduct[],
  maxProjects: number = 3
): string {
  // Filter to products with live artifacts and explicit confidence
  const productsWithArtifacts = knownProducts
    .filter(p => (p.website || p.github || p.liveUrl) && p.confidence === "explicit")
    .slice(0, maxProjects)
  
  if (productsWithArtifacts.length === 0) {
    return ""
  }
  
  const lines = ["SELECTED PRODUCTS", ""]
  
  for (const product of productsWithArtifacts) {
    const techLine = product.techStack?.slice(0, 5).join(", ") || ""
    const urlLine = product.website || product.liveUrl || product.github || ""
    
    lines.push(`${product.name}`)
    if (product.description) {
      lines.push(`  ${product.description.split(".")[0]}`)
    }
    if (techLine) {
      lines.push(`  Stack: ${techLine}`)
    }
    if (urlLine) {
      lines.push(`  ${urlLine}`)
    }
    lines.push("")
  }
  
  return lines.join("\n")
}
