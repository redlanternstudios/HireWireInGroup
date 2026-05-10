// CoachRecommendations: Generate contextual, workflow-aware, actionable recommendations

export interface CoachRecommendation {
  id: string
  message: string
  context: string
  priority: number
  evidenceKey?: string
  type?: "blocker" | "next_action" | "improvement" | "insight" | "motivation"
}

export function generateRecommendations(context: any, signals: any[]): CoachRecommendation[] {
  // Implement recommendation logic using context and signals
  // Example: priorRecommendations = [{ id, lastShown }]
  let recs: CoachRecommendation[] = []

  // Blockers first
  if (Array.isArray(context.blockers) && context.blockers.length > 0) {
    recs.push(
      ...context.blockers.map((b: string, i: number) => ({
        id: `blocker-${i}`,
        message: b,
        context: context.workflowStage,
        priority: 1,
        type: "blocker",
      }))
    )
  }

  // Next action
  if (context.currentAction) {
    recs.push({
      id: `next-action`,
      message: `Next: ${context.currentAction}`,
      context: context.workflowStage,
      priority: 2,
      type: "next_action",
    })
  }

  // Example: evidence coverage
  if (context.evidenceCoverage < 0.5) {
    recs.push({
      id: "low-evidence-coverage",
      message: "Evidence coverage is low. Add more relevant experience.",
      context: context.workflowStage,
      priority: 3,
      type: "improvement",
    })
  }

  // Example: fit score
  if (context.fitScore < 60) {
    recs.push({
      id: "low-fit-score",
      message: "Fit score is low. Address gaps or improve mapped evidence.",
      context: context.workflowStage,
      priority: 3,
      type: "improvement",
    })
  }

  // Example: strong alignment
  if (context.fitScore >= 80) {
    recs.push({
      id: "strong-alignment",
      message: "Strong technical alignment detected. Consider applying soon.",
      context: context.workflowStage,
      priority: 4,
      type: "insight",
    })
  }

  // Deduplicate
  recs = deduplicateRecommendations(recs)
  // Cooldown
  recs = filterByCooldown(recs, priorRecommendations)
  // Sort by priority
  recs = sortRecommendations(recs)
  return recs
}

// Example recommendations:
// - “You’re missing leadership evidence for this role.”
// - “I recommend refining your summary instead of regenerating the full resume.”
// - “This role aligns strongly with your SAP systems background.”
