import { z } from "zod"

const ProfileExperienceSchema = z.object({
  title: z.string().min(1, "Job title is required"),
  company: z.string().min(1, "Company name is required"),
  location: z.string().optional(),
  start_date: z.string().min(1, "Start date is required"),
  end_date: z.string().optional(),
  description: z.string().optional(),
  highlights: z.array(z.string()).optional(),
})

const ProfileEducationSchema = z.object({
  degree: z.string().min(1, "Degree is required"),
  school: z.string().min(1, "School name is required"),
  field: z.string().optional(),
  start_year: z.string().optional(),
  end_year: z.string().optional(),
  honors: z.string().optional(),
  gpa: z.string().optional(),
})

// PUT/PATCH /api/profile
export const UpdateProfileSchema = z
  .object({
    full_name: z.string().min(1, "Full name is required").optional(),
    email: z.string().email("Invalid email format").optional(),
    phone: z.string().optional(),
    location: z.string().optional(),
    headline: z.string().max(200, "Headline too long").optional(),
    summary: z.string().max(2000, "Summary too long").optional(),
    skills: z.array(z.string()).optional(),
    certifications: z.array(z.string()).optional(),
    experience: z.array(ProfileExperienceSchema).optional(),
    education: z.array(ProfileEducationSchema).optional(),
    links: z.record(z.string().url("Invalid URL in links")).optional(),
  })
  .strict()

export type UpdateProfile = z.infer<typeof UpdateProfileSchema>
export type ProfileExperience = z.infer<typeof ProfileExperienceSchema>
export type ProfileEducation = z.infer<typeof ProfileEducationSchema>
