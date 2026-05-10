// Coach drift scoring logic
import { Claim, DriftReport } from "./types"

export function calculateDriftScore(prevClaims: Claim[], newClaims: Claim[]): DriftReport {
  // Simple drift: count changed, added, removed claims
  const prevIds = new Set(prevClaims.map(c => c.claim_id))
  const newIds = new Set(newClaims.map(c => c.claim_id))
  const changed_claims = newClaims.filter(c => prevIds.has(c.claim_id) && JSON.stringify(c) !== JSON.stringify(prevClaims.find(pc => pc.claim_id === c.claim_id))).map(c => c.claim_id)
  const added_claims = newClaims.filter(c => !prevIds.has(c.claim_id)).map(c => c.claim_id)
  const removed_claims = prevClaims.filter(c => !newIds.has(c.claim_id)).map(c => c.claim_id)
  const drift_score = (changed_claims.length + added_claims.length + removed_claims.length) / Math.max(prevClaims.length, 1)
  return {
    drift_score,
    changed_claims,
    added_claims,
    removed_claims,
    notes: [],
  }
}
