import { redirect } from "next/navigation"

// /jobs/new is a compatibility redirect to the Jobs page with intake open.
export default function NewJobPage() {
  redirect("/jobs?add=true")
}
