// Utility to ensure CoachContext and related props are JSON-serializable
import type { CoachContext } from "./build-context"
import type { CoachRecommendation } from "@/lib/coach/recommendations"

export function sanitizeCoachContext(context: CoachContext): CoachContext {
  // Convert any Date objects to ISO strings, remove non-serializables
  return {
    ...context,
    generationHistory: (context.generationHistory || []).map(sanitizeHistory),
    applicationHistory: (context.applicationHistory || []).map(sanitizeHistory),
    recentOutcomes: (context.recentOutcomes || []).map(String),
    userPreferences: JSON.parse(JSON.stringify(context.userPreferences || {})),
    // All other fields are primitives or arrays
  }
}

function sanitizeHistory(item: any) {
  if (!item) return item
  const out: any = {}
  for (const k in item) {
    const v = item[k]
    if (v instanceof Date) out[k] = v.toISOString()
    else if (typeof v === "object" && v !== null) out[k] = JSON.parse(JSON.stringify(v))
    else out[k] = v
  }
  return out
}

export function sanitizeRecommendations(recs: CoachRecommendation[]): CoachRecommendation[] {
  return recs.map(r => ({ ...r, message: String(r.message), context: String(r.context) }))
}
