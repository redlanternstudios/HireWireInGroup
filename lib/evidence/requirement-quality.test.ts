import { describe, it, expect } from "vitest"
import { isBoilerplateRequirement } from "./requirement-quality"

describe("isBoilerplateRequirement", () => {
  it("drops posting headlines (X is hiring a Y)", () => {
    expect(isBoilerplateRequirement("E2E Labs 1779356362335 is hiring a Lead Product Manager")).toBe(true)
  })

  it("drops leaked UI status strings and near-empty lines", () => {
    expect(isBoilerplateRequirement("Package review 1779675613697")).toBe(true)
    expect(isBoilerplateRequirement("1779675613697")).toBe(true)
    expect(isBoilerplateRequirement("   ")).toBe(true)
  })

  it("KEEPS real requirements even when polluted with an appended id", () => {
    expect(isBoilerplateRequirement("Own ERP migrations 1779675718093")).toBe(false)
    expect(isBoilerplateRequirement("Lead roadmap analytics 1779675718093")).toBe(false)
  })

  it("KEEPS normal requirements", () => {
    expect(isBoilerplateRequirement("7+ years in product management")).toBe(false)
    expect(isBoilerplateRequirement("Required qualifications: 7+ years in product management")).toBe(false)
    expect(isBoilerplateRequirement("Cross-functional leadership")).toBe(false)
  })
})
