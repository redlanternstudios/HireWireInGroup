import assert from "node:assert/strict"
import { describe, it } from "node:test"

const validCSV = `source_type,source_title,company_name,role_name,date_range,responsibilities,tools_used,outcomes,confidence_level\nwork_experience,Test Title,TestCo,Engineer,2020-2022,"Did X\nDid Y","Tool1,Tool2","Outcome1\nOutcome2",high`
const emptyCSV = ''
const malformedCSV = 'source_type,source_title\nwork_experience' // missing columns
const largeCSV = Array(1001).fill('work_experience,Title,Co,Role,2020-2022,"A","B","C",medium').join('\n')

async function uploadCSV(csv: string) {
  const baseUrl = process.env.E2E_BASE_URL ?? "http://localhost:3000"
  const res = await fetch(`${baseUrl}/api/evidence/import`, {
    method: 'POST',
    body: (() => { const f = new FormData(); f.append('file', new Blob([csv], { type: 'text/csv' }), 'test.csv'); return f })(),
  })
  return res.json()
}

const hasLiveApi = process.env.RUN_LIVE_API_TESTS === "1" || !!process.env.E2E_TEST_EMAIL

describe('Evidence Import API', { skip: hasLiveApi ? false : "requires live API env" }, () => {
  it('should import valid CSV', async () => {
    const result = await uploadCSV(validCSV)
    assert.ok(result.imported > 0)
  })
  it('should handle empty CSV', async () => {
    const result = await uploadCSV(emptyCSV)
    assert.ok(result.error)
  })
  it('should handle malformed CSV', async () => {
    const result = await uploadCSV(malformedCSV)
    assert.ok(result.error)
  })
  it('should handle large CSV', async () => {
    const result = await uploadCSV(largeCSV)
    assert.ok(result.imported > 1000)
  })
})
