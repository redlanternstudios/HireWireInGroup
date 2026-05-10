import { describe, it, expect } from 'vitest'

const validCSV = `source_type,source_title,company_name,role_name,date_range,responsibilities,tools_used,outcomes,confidence_level\nwork_experience,Test Title,TestCo,Engineer,2020-2022,"Did X\nDid Y","Tool1,Tool2","Outcome1\nOutcome2",high`
const emptyCSV = ''
const malformedCSV = 'source_type,source_title\nwork_experience' // missing columns
const largeCSV = Array(1001).fill('work_experience,Title,Co,Role,2020-2022,"A","B","C",medium').join('\n')

async function uploadCSV(csv: string) {
  const res = await fetch('http://localhost:3000/api/evidence/import', {
    method: 'POST',
    body: (() => { const f = new FormData(); f.append('file', new Blob([csv], { type: 'text/csv' }), 'test.csv'); return f })(),
  })
  return res.json()
}

describe('Evidence Import API', () => {
  it('should import valid CSV', async () => {
    const result = await uploadCSV(validCSV)
    expect(result.imported).toBeGreaterThan(0)
  })
  it('should handle empty CSV', async () => {
    const result = await uploadCSV(emptyCSV)
    expect(result.error).toBeDefined()
  })
  it('should handle malformed CSV', async () => {
    const result = await uploadCSV(malformedCSV)
    expect(result.error).toBeDefined()
  })
  it('should handle large CSV', async () => {
    const result = await uploadCSV(largeCSV)
    expect(result.imported).toBeGreaterThan(1000)
  })
})
