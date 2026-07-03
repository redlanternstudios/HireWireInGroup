import assert from "node:assert/strict"
import { describe, it } from "node:test"
import { isBoilerplateRequirement, normalizeRequirementText } from "./requirement-quality"

describe("isBoilerplateRequirement", () => {
  it("drops posting headlines (X is hiring a Y)", () => {
    assert.equal(isBoilerplateRequirement("E2E Labs 1779356362335 is hiring a Lead Product Manager"), true)
  })

  it("drops leaked UI status strings and near-empty lines", () => {
    assert.equal(isBoilerplateRequirement("Package review 1779675613697"), true)
    assert.equal(isBoilerplateRequirement("1779675613697"), true)
    assert.equal(isBoilerplateRequirement("   "), true)
  })

  it("KEEPS real requirements even when polluted with an appended id", () => {
    assert.equal(isBoilerplateRequirement("Own ERP migrations 1779675718093"), false)
    assert.equal(isBoilerplateRequirement("Lead roadmap analytics 1779675718093"), false)
  })

  it("KEEPS normal requirements", () => {
    assert.equal(isBoilerplateRequirement("7+ years in product management"), false)
    assert.equal(isBoilerplateRequirement("Required qualifications: 7+ years in product management"), false)
    assert.equal(isBoilerplateRequirement("Cross-functional leadership"), false)
  })
})

describe("normalizeRequirementText", () => {
  it("strips appended numeric id pollution", () => {
    assert.equal(normalizeRequirementText("Own ERP migrations 1779675718093"), "Own ERP migrations")
  })
  it("strips leading qualification-label prefix", () => {
    assert.equal(normalizeRequirementText("Required qualifications: 7+ years in product management"), "7+ years in product management")
  })
  it("leaves clean requirements unchanged", () => {
    assert.equal(normalizeRequirementText("Cross-functional leadership"), "Cross-functional leadership")
  })
  it("falls back to original when cleaning would empty it", () => {
    assert.equal(normalizeRequirementText("12345678"), "12345678")
  })
})
