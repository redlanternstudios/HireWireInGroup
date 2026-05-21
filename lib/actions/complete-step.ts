"use server"

import { revalidatePath } from "next/cache"
import { applyToJob } from "@/lib/actions/apply"
import { acceptApplicationPackage } from "@/lib/actions/package"
import type { CompleteStepPayload } from "@/lib/workflow/step-types"

export type CompleteStepResult = {
  success: boolean
  error?: string
  reasons?: string[]
}

export async function completeStep(
  jobId: string,
  payload: CompleteStepPayload,
): Promise<CompleteStepResult> {
  if (payload.step === "apply") {
    const result = await applyToJob(jobId, payload.method ?? "manual")
    revalidatePath("/jobs")
    revalidatePath(`/jobs/${jobId}`)
    revalidatePath("/dashboard")
    return {
      success: result.success,
      error: result.error,
      reasons: result.reasons,
    }
  }

  if (payload.step === "review") {
    const result = await acceptApplicationPackage(jobId)
    revalidatePath("/jobs")
    revalidatePath(`/jobs/${jobId}`)
    revalidatePath(`/jobs/${jobId}/documents`)
    revalidatePath("/dashboard")
    return {
      success: result.success,
      error: result.error,
    }
  }

  revalidatePath("/jobs")
  revalidatePath(`/jobs/${jobId}`)
  revalidatePath("/dashboard")
  return { success: true }
}
