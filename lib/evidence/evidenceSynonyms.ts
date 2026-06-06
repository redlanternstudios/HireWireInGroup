export const EVIDENCE_SYNONYM_GROUPS: string[][] = [
  ["bachelor", "bachelors", "bachelor of science", "bachelor of arts", "degree", "undergraduate"],
  ["computer science", "cs", "comp sci", "software engineering"],
  ["artificial intelligence", "ai", "machine learning", "ml"],
  ["product manager", "technical product manager", "ai product manager", "product owner"],
  ["project manager", "program manager", "scrum master"],
  ["salesforce", "sfdc"],
  ["javascript", "js"],
  ["typescript", "ts"],
  ["postgres", "postgresql"],
  ["supabase", "postgres", "postgresql"],
  ["nextjs", "next.js", "react"],
  ["scrum", "agile"],
  ["safe", "scaled agile framework"],
  ["pmp", "project management professional"],
  ["cpmai", "cognitive project management for ai"],
]

export function expandSynonyms(tokens: string[]): Set<string> {
  const expanded = new Set(tokens)
  for (const token of tokens) {
    for (const group of EVIDENCE_SYNONYM_GROUPS) {
      if (group.includes(token)) {
        group.forEach(item => expanded.add(item))
      }
    }
  }
  return expanded
}

export function hasSynonymOverlap(aTokens: string[], bTokens: string[]): boolean {
  const aExpanded = expandSynonyms(aTokens)
  const bExpanded = expandSynonyms(bTokens)
  for (const token of aExpanded) {
    if (bExpanded.has(token)) return true
  }
  return false
}
