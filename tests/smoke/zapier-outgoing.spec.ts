import { test, expect } from "@playwright/test"

// Smoke test for outgoing Zapier relay

test("Zapier relay fires and returns success when ZAPIER_WEBHOOK_URL is set", async ({ request }) => {
  // Mock webhook URL (should be set in test env)
  process.env.ZAPIER_WEBHOOK_URL = "http://localhost:9999/mock-zapier" // or use nock in real test

  const payload = {
    eventType: "job_created",
    payload: { jobId: "test-job-id", title: "Test Job" }
  }

  const res = await request.post("/api/zapier/outgoing", {
    data: payload,
  })
  expect(res.status()).toBe(200)
  const json = await res.json()
  expect(json).toHaveProperty("success", true)
})
