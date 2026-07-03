import assert from "node:assert/strict"
import { describe, it } from "node:test"
import { atsSanitize, atsIssues } from "./atsSanitize"

describe("atsSanitize", () => {
  it("normalizes bullet glyphs to '- ' with no indentation", () => {
    const out = atsSanitize("EXPERIENCE\n  • Led team\n▪ Shipped feature\n- Already fine")
    assert.match(out, /- Led team/)
    assert.match(out, /- Shipped feature/)
    assert.match(out, /- Already fine/)
    assert.deepEqual(atsIssues(out), [])
  })

  it("strips markdown emphasis and headings", () => {
    const out = atsSanitize("## Summary\n**Bold** and __under__ and `code`")
    assert.match(out, /Summary/)
    assert.match(out, /Bold and under and code/)
    assert.doesNotMatch(out, /\*\*|__|`|#/)
  })

  it("removes markdown table scaffolding, keeps cell text", () => {
    const out = atsSanitize("| Skill | Level |\n|-------|-------|\n| SQL | Expert |")
    assert.doesNotMatch(out, /\|/)
    assert.match(out, /Skill/)
    assert.match(out, /SQL/)
    assert.match(out, /Expert/)
  })

  it("converts smart punctuation to ascii", () => {
    const out = atsSanitize("It’s a “great” role – really…")
    assert.match(out, /It's a "great" role - really\.\.\./)
    assert.deepEqual(atsIssues(out), [])
  })

  it("collapses 3+ blank lines and is idempotent", () => {
    const once = atsSanitize("A\n\n\n\nB")
    assert.equal(once, "A\n\nB\n")
    assert.equal(atsSanitize(once), once)
  })

  it("atsIssues flags a raw dirty resume before sanitizing", () => {
    const dirty = "**Name**\n• bullet\n| a | b |"
    assert.ok(atsIssues(dirty).length > 0)
    assert.deepEqual(atsIssues(atsSanitize(dirty)), [])
  })
})
