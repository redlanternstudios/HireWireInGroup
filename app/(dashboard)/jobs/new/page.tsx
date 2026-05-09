import { redirect } from "next/navigation"

// /jobs/new redirects to /jobs where the JobInputForm lives
export default function NewJobPage() {
  redirect("/jobs")
}
