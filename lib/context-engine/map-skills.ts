import type { ContextEvidenceItem, ContextNormalizedEntity } from "./types"
import { canonicalize, overlapScore, unique } from "./utils"

export function mapSkills(evidenceItems: ContextEvidenceItem[], entities: ContextNormalizedEntity[]) {
  const skillEntities = entities.filter((entity) => ["skill", "tool", "domain"].includes(entity.category))
  return skillEntities.map((entity) => ({
    entity_id: entity.id,
    canonical_name: entity.canonical_name,
    category: entity.category,
    aliases: entity.aliases,
    evidence_ids: unique([
      ...entity.evidence_ids,
      ...evidenceItems
        .filter((item) => {
          const value = canonicalize(`${item.raw_text} ${item.normalized_value}`)
          return value.includes(canonicalize(entity.canonical_name)) ||
            entity.aliases.some((alias) => value.includes(canonicalize(alias))) ||
            overlapScore(value, entity.canonical_name) >= 0.5
        })
        .map((item) => item.id),
    ]),
  }))
}
