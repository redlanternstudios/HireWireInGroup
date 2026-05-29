import assert from "node:assert/strict"
import { describe, it } from "node:test"

async function downloadCSV() {
  const baseUrl = process.env.E2E_BASE_URL ?? "http://localhost:3000"
  const res = await fetch(`${baseUrl}/api/evidence/export`)
  return res.text()
}

const hasLiveApi = process.env.RUN_LIVE_API_TESTS === "1" || !!process.env.E2E_TEST_EMAIL

describe("Evidence Export API", { skip: hasLiveApi ? false : "requires live API env" }, () => {
  it("should export CSV with correct headers", async () => {
    const csv = await downloadCSV()
    assert.ok(csv.includes("source_type,source_title,company_name,role_name,date_range,responsibilities,tools_used,outcomes,confidence_level"))
  })
})
