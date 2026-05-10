// Deduplicate recommendations by message
import { CoachRecommendation } from "./index"

export function deduplicateRecommendations(recs: CoachRecommendation[]): CoachRecommendation[] {
  return recs.filter((rec, idx, arr) => arr.findIndex(r => r.message === rec.message) === idx)
}

// Cooldown logic: do not repeat the same recommendation within a cooldown window (e.g., 24h)
export function filterByCooldown(
  recs: CoachRecommendation[],
  prior: { id: string; lastShown: string }[],
  cooldownMs: number = 24 * 60 * 60 * 1000
): CoachRecommendation[] {
  const now = Date.now()
  return recs.filter(rec => {
    const priorRec = prior.find(p => p.id === rec.id)
    if (!priorRec) return true
    const last = new Date(priorRec.lastShown).getTime()
    return now - last > cooldownMs
  })
}