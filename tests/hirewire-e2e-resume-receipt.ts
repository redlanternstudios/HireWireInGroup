import { writeFileSync } from "node:fs"
import { loadEnvConfig } from "@next/env"

loadEnvConfig(process.cwd())

const email = process.env.E2E_TEST_EMAIL ?? "hirewire.cdx.20260707183739@yopmail.com"
const password = process.env.E2E_TEST_PASSWORD ?? "HireWire!20260707183739aA1"
const jobPostUrl =
  process.env.E2E_TEST_JOB_URL ??
  "http://127.0.0.1:4321/hirewire-e2e-job-post-20260707183739.html"
const receiptPath =
  process.env.HIREWIRE_E2E_RECEIPT_PATH ?? "/private/tmp/hirewire-e2e-receipt-20260707183739.json"
const resumePath =
  process.env.HIREWIRE_E2E_RESUME_PATH ?? "/private/tmp/hirewire-e2e-generated-resume-20260707183739.txt"

function truthLabel(value: boolean) {
  return value ? "VERIFIED" : "BLOCKED"
}

async function main() {
  const {
    analyzeJob,
    generateDocuments,
    getJob,
    signIn,
  } = await import("./helpers/api-client.js")

  const session = await signIn(email, password)
  const analyzeResult = await analyzeJob(session, { job_url: jobPostUrl })

  if (!analyzeResult.ok || !analyzeResult.body.success) {
    throw new Error(
      `Analyze failed with ${analyzeResult.status}: ${JSON.stringify(analyzeResult.body, null, 2)}`
    )
  }

  const jobId = analyzeResult.body.jobId ?? analyzeResult.body.job?.id
  if (!jobId) {
    throw new Error(`Analyze did not return a job id: ${JSON.stringify(analyzeResult.body, null, 2)}`)
  }

  const generated = await generateDocuments(session, jobId)
  if (!generated.ok || !generated.body.success) {
    throw new Error(
      `Generate failed with ${generated.status}: ${JSON.stringify(generated.body, null, 2)}`
    )
  }

  const job = await getJob(session, jobId)
  const generatedResume =
    typeof job?.generated_resume === "string" && job.generated_resume.length > 0
      ? job.generated_resume
      : typeof generated.body.resume === "string"
        ? generated.body.resume
        : ""

  if (generatedResume) {
    writeFileSync(resumePath, generatedResume)
  }

  const receipt = {
    objective: "Real job post to resume receipt",
    truth: {
      account_reused: truthLabel(true),
      job_post_loaded: truthLabel(true),
      job_analyzed: truthLabel(Boolean(jobId)),
      resume_generated: truthLabel(generatedResume.length > 100),
      resume_persisted: truthLabel(Boolean(job?.generated_resume)),
    },
    account: {
      email,
      user_id: session.userId,
    },
    job_post_url: jobPostUrl,
    local_job_page: jobId ? `http://localhost:3000/jobs/${jobId}` : null,
    job: job
      ? {
          id: job.id,
          role_title: job.role_title,
          company_name: job.company_name,
          generation_status: job.generation_status,
          quality_passed: job.quality_passed,
          generated_resume_chars:
            typeof job.generated_resume === "string" ? job.generated_resume.length : 0,
          generated_cover_letter_chars:
            typeof job.generated_cover_letter === "string" ? job.generated_cover_letter.length : 0,
        }
      : null,
    generation: {
      status: generated.status,
      ok: generated.ok,
      body: generated.body,
    },
    files: {
      receipt_path: receiptPath,
      resume_path: generatedResume ? resumePath : null,
    },
  }

  writeFileSync(receiptPath, `${JSON.stringify(receipt, null, 2)}\n`)
  console.log(JSON.stringify(receipt, null, 2))
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
})
