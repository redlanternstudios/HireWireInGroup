import { z } from "zod"

// POST /api/coach — message payload
export const CoachMessageSchema = z.object({
  message: z
    .string()
    .min(1, "Message cannot be empty")
    .max(4000, "Message exceeds maximum length"),
  session_id: z.string().uuid("Invalid session ID").optional(),
  job_id: z.string().uuid("Invalid job ID").optional(),
  context_type: z
    .enum(["general", "job_specific", "evidence_building", "interview_prep"])
    .optional()
    .default("general"),
})

export type CoachMessage = z.infer<typeof CoachMessageSchema>

// POST /api/coach/sessions — create session
export const CreateCoachSessionSchema = z.object({
  job_id: z.string().uuid("Invalid job ID").optional(),
  initial_context: z.string().max(2000).optional(),
})

export type CreateCoachSession = z.infer<typeof CreateCoachSessionSchema>
