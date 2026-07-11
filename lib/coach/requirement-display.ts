export function buildRequirementDisplayText(
  requirementText: string,
  normalizedRequirement?: string | null,
): string {
  const raw = requirementText.trim().replace(/\s+/g, " ")
  const normalized = (normalizedRequirement ?? "").trim().replace(/\s+/g, " ")
  const source = normalized || raw

  const chromeMarkers = [
    "Job Application for",
    "Back to jobs",
    "Apply ABOUT US",
    "ABOUT US",
  ]

  const hasChrome = chromeMarkers.some((marker) =>
    source.toLowerCase().includes(marker.toLowerCase()),
  )

  if (!hasChrome) {
    return source
  }

  const stripped = source
    .replace(/^job application for\s+/i, "")
    .replace(/\bapply about us\b.*$/i, "")
    .replace(/\bback to jobs\b.*$/i, "")
    .replace(/\s{2,}/g, " ")
    .trim()

  if (stripped.length > 0) {
    return stripped
  }

  return normalized || raw
}
