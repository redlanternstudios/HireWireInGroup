import { test, expect } from "@playwright/test"

// Smoke test for AI health endpoint

test("AI health endpoint returns 200 and healthy", async ({ request }) => {
  const res = await request.get("/api/ai/health")
  expect(res.status()).toBe(200)
  const json = await res.json()
  expect(json).toHaveProperty("healthy", true)
  expect(json).toHaveProperty("provider")
  expect(json).toHaveProperty("model")
})
