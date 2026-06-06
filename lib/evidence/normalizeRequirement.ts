export function normalizeText(input: string): string {
  return input
    .toLowerCase()
    .replace(/[’']/g, "")
    .replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
}

export function normalizeRequirement(input: string): string {
  let text = normalizeText(input)

  const replacements: Array<[RegExp, string]> = [
    [/\bb\.?s\.?\b/g, "bachelor of science"],
    [/\bbachelor'?s\b/g, "bachelor"],
    [/\bbachelors\b/g, "bachelor"],
    [/\bba\b/g, "bachelor of arts"],
    [/\bcs\b/g, "computer science"],
    [/\bcomp sci\b/g, "computer science"],
    [/\bcomputer sciences\b/g, "computer science"],
    [/\bpm\b/g, "product manager project manager"],
    [/\bpo\b/g, "product owner"],
    [/\bai\b/g, "artificial intelligence"],
    [/\bml\b/g, "machine learning"],
    [/\bsfdc\b/g, "salesforce"],
    [/\bjs\b/g, "javascript"],
    [/\bts\b/g, "typescript"],
  ]

  for (const [pattern, replacement] of replacements) {
    text = text.replace(pattern, replacement)
  }

  return text.replace(/\s+/g, " ").trim()
}

export function tokenize(input: string): string[] {
  const stopWords = new Set([
    "and",
    "or",
    "the",
    "a",
    "an",
    "of",
    "in",
    "to",
    "with",
    "for",
    "on",
    "at",
    "by",
    "from",
    "required",
    "preferred",
    "experience",
    "knowledge",
    "ability",
  ])

  return normalizeRequirement(input)
    .split(" ")
    .filter(token => token.length > 2 && !stopWords.has(token))
}
