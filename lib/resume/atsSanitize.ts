/**
 * ATS SANITIZER — single control point that guarantees generated resume text
 * parses cleanly through applicant tracking systems and AI/ML resume parsers.
 *
 * Applied to every generated resume before persistence, regardless of which
 * generation path (LLM or fallback) produced it. Deterministic and idempotent.
 *
 * ATS/ML parsers fail on: non-standard bullet glyphs, markdown emphasis,
 * markdown/box-drawing tables, headings with markup, smart punctuation, and
 * runs of blank lines. This strips all of them to plain, single-column text
 * with standard "- " bullets. Uses unicode escapes only (no literal glyphs).
 */

// Leading bullet-ish glyph: bullet, black square, triangle bullet, white bullet,
// middle dot, asterisk, hyphen, en/em dash — plus following whitespace.
const LEADING_BULLET = /^[ \t]*[•▪‣◦·*\-–—][ \t]+/

const SMART_PUNCTUATION: Array<[RegExp, string]> = [
  [/[‘’‚‛]/g, "'"], // smart single quotes
  [/[“”„‟]/g, '"'], // smart double quotes
  [/[–—]/g, "-"], // en / em dash
  [/…/g, "..."], // ellipsis
  [/[   ]/g, " "], // non-breaking / figure / narrow no-break spaces
]

// Box-drawing (U+2500–U+257F) + block elements (U+2580–U+259F) glyphs that
// break ATS column detection.
const BOX_DRAWING = /[─-▟]/g

// Non-standard bullets still present (used by atsIssues verification).
const NONSTANDARD_BULLET = /[•▪‣◦]/

export function atsSanitize(input: string): string {
  if (!input) return ""

  let text = input.replace(/\r\n/g, "\n").replace(/\r/g, "\n")

  for (const [pattern, replacement] of SMART_PUNCTUATION) {
    text = text.replace(pattern, replacement)
  }

  const lines = text.split("\n").map((rawLine) => {
    let line = rawLine

    // Strip markdown emphasis / code / heading / quote markers.
    line = line.replace(/\*\*(.*?)\*\*/g, "$1")
    line = line.replace(/__(.*?)__/g, "$1")
    line = line.replace(/`([^`]*)`/g, "$1")
    line = line.replace(/^\s{0,3}#{1,6}\s+/, "")
    line = line.replace(/^\s{0,3}>\s?/, "")

    // Markdown/pipe table scaffolding → keep cell text, drop separator rows.
    if (/\|.*\|/.test(line)) {
      if (/^\s*\|?[\s:|-]*\|[\s:|-]*$/.test(line)) return ""
      line = line.replace(/\s*\|\s*/g, "  ").trim()
    }
    line = line.replace(BOX_DRAWING, " ")

    // Normalize any bullet glyph to a standard "- " with no indentation.
    if (LEADING_BULLET.test(line)) {
      line = line.replace(LEADING_BULLET, "- ")
    }

    // Collapse internal whitespace runs (from stripped scaffolding); trim tail.
    line = line.replace(/[ \t]{2,}/g, " ").replace(/[ \t]+$/g, "")

    return line
  })

  // Collapse 3+ blank lines to a single blank line.
  const out = lines.join("\n").replace(/\n{3,}/g, "\n\n").trim()

  return out + "\n"
}

/**
 * Verification receipt — returns the ATS issues still present after
 * sanitization (should be empty). Not a blocker; used by tests / QA logging.
 */
export function atsIssues(text: string): string[] {
  const issues: string[] = []
  if (NONSTANDARD_BULLET.test(text)) issues.push("non-standard bullet glyph present")
  if (/\*\*|__|`|^#{1,6}\s/m.test(text)) issues.push("markdown markup present")
  if (/[─-▟]/.test(text)) issues.push("box-drawing characters present")
  if (/\|.*\|/.test(text)) issues.push("table pipes present")
  if (/[‘’“”]/.test(text)) issues.push("smart punctuation present")
  return issues
}
