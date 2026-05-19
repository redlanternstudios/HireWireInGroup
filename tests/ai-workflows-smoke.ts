import { strict as assert } from "node:assert"
import { loadEnvConfig } from "@next/env"
import { z } from "zod"
import {
  AI_MODELS,
  generateStructuredText,
  getAiGatewayStatus,
  isAiGatewayConfigured,
  streamText,
} from "../lib/ai/gateway"
import { detectAIContent } from "../lib/integrity/ai-content-detector"
import { checkResumeLinkedInConsistency } from "../lib/integrity/consistency-checker"
import { analyzeJobProfileGap } from "../lib/integrity/gap-analyzer"
import { scoreResumeBullets } from "../lib/integrity/scorer"
import { simulateEmployerVerification } from "../lib/integrity/verification-simulator"

loadEnvConfig(process.cwd())

const JobSmokeSchema = z.object({
  title: z.string(),
  company: z.string(),
  responsibilities: z.array(z.string()),
  requiredSkills: z.array(z.string()),
})

const JOB_SMOKE_SCHEMA_DESCRIPTION = `{
  "title": string,
  "company": string,
  "responsibilities": string[],
  "requiredSkills": string[]
}`

async function step(name: string, run: () => Promise<void>) {
  const startedAt = Date.now()
  await run()
  console.log(`ok ${name} (${Date.now() - startedAt}ms)`)
}

async function main() {
  if (!isAiGatewayConfigured()) {
    throw new Error("AI is not configured. Set AI_GATEWAY_API_KEY or OPENAI_API_KEY.")
  }

  const status = getAiGatewayStatus()
  console.log(`AI smoke using provider=${status.provider} model=${status.model}`)

  const jobDescription =
    "Acme is hiring a Product Manager for AI workflow automation. Responsibilities include customer discovery, roadmap prioritization, analytics, and working with engineers on API integrations."
  const resume = {
    roles: [
      {
        title: "Product Manager",
        company: "ExampleCo",
        highlights: [
          "Led customer interviews for workflow automation features.",
          "Prioritized roadmap using funnel analytics and partner feedback.",
        ],
        skills: ["product discovery", "roadmap", "analytics", "API integrations"],
      },
    ],
  }

  await step("job-analysis-style structured output", async () => {
    const result = await generateStructuredText(
      {
        model: AI_MODELS.PRIMARY,
        schema: JobSmokeSchema,
        schemaDescription: JOB_SMOKE_SCHEMA_DESCRIPTION,
        prompt: `Extract a concise job analysis from this posting: ${jobDescription}`,
      },
      { route: "tests/ai-workflows-smoke", operation: "job_analysis_structured" }
    )
    assert.equal(typeof result.title, "string")
    assert.ok(result.responsibilities.length)
  })

  await step("coach-style streaming", async () => {
    const result = streamText(
      {
        model: AI_MODELS.PRIMARY,
        system: "You are a concise job-search coach. Answer in one short sentence.",
        prompt: "Name one concrete next step for improving fit for an AI product role.",
      },
      { route: "tests/ai-workflows-smoke", operation: "coach_stream" }
    )
    const text = await result.text
    assert.ok(text.trim().length > 0)
  })

  await step("gap matching", async () => {
    const results = await analyzeJobProfileGap(jobDescription, resume)
    assert.ok(Array.isArray(results))
    assert.ok(results.length > 0)
  })

  await step("resume integrity scoring", async () => {
    const results = await scoreResumeBullets([
      "Led customer discovery for workflow automation features used by sales teams.",
    ])
    assert.ok(Array.isArray(results))
    assert.ok(results.length > 0)
  })

  await step("AI content detection", async () => {
    const flags = await detectAIContent(
      "Product manager with experience in customer discovery, roadmap prioritization, and analytics."
    )
    assert.ok(Array.isArray(flags))
  })

  await step("resume/linkedin consistency", async () => {
    const flags = await checkResumeLinkedInConsistency(
      { title: "Product Manager", company: "ExampleCo", date_range: "2022-2024" },
      { title: "Product Manager", company: "ExampleCo", date_range: "2022-2024" }
    )
    assert.ok(Array.isArray(flags))
  })

  await step("verification simulation", async () => {
    const results = await simulateEmployerVerification([
      { claim_text: "Worked as Product Manager at ExampleCo", org_name: "ExampleCo" },
    ])
    assert.ok(Array.isArray(results))
    assert.ok(results.length > 0)
  })
}

main().catch(error => {
  console.error(error)
  process.exit(1)
})
