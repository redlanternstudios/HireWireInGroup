import { describe, it, expect } from 'vitest'

async function downloadCSV() {
  const res = await fetch('http://localhost:3000/api/evidence/export')
  return res.text()
}

describe('Evidence Export API', () => {
  it('should export CSV with correct headers', async () => {
    const csv = await downloadCSV()
    expect(csv).toContain('source_type,source_title,company_name,role_name,date_range,responsibilities,tools_used,outcomes,confidence_level')
  })
})
