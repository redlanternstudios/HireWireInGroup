import { describe, it, expect } from "vitest"
import { atsSanitize, atsIssues } from "./atsSanitize"

describe("atsSanitize", () => {
  it("normalizes bullet glyphs to '- ' with no indentation", () => {
    const out = atsSanitize("EXPERIENCE\n  • Led team\n▪ Shipped feature\n- Already fine")
    expect(out).toContain("- Led team")
    expect(out).toContain("- Shipped feature")
    expect(out).toContain("- Already fine")
    expect(atsIssues(out)).toEqual([])
  })

  it("strips markdown emphasis and headings", () => {
    const out = atsSanitize("## Summary\n**Bold** and __under__ and `code`")
    expect(out).toContain("Summary")
    expect(out).toContain("Bold and under and code")
    expect(out).not.toMatch(/\*\*|__|`|#/)
  })

  it("removes markdown table scaffolding, keeps cell text", () => {
    const out = atsSanitize("| Skill | Level |\n|-------|-------|\n| SQL | Expert |")
    expect(out).not.toMatch(/\|/)
    expect(out).toContain("Skill")
    expect(out).toContain("SQL")
    expect(out).toContain("Expert")
  })

  it("converts smart punctuation to ascii", () => {
    const out = atsSanitize("It’s a “great” role – really…")
    expect(out).toContain("It's a \"great\" role - really...")
    expect(atsIssues(out)).toEqual([])
  })

  it("collapses 3+ blank lines and is idempotent", () => {
    const once = atsSanitize("A\n\n\n\nB")
    expect(once).toBe("A\n\nB\n")
    expect(atsSanitize(once)).toBe(once)
  })

  it("atsIssues flags a raw dirty resume before sanitizing", () => {
    const dirty = "**Name**\n• bullet\n| a | b |"
    expect(atsIssues(dirty).length).toBeGreaterThan(0)
    expect(atsIssues(atsSanitize(dirty))).toEqual([])
  })
})
