import { redirect } from "next/navigation"

// /ready-queue is a compatibility redirect — the canonical gate is /ready-to-apply
export default function ReadyQueuePage() {
  redirect("/ready-to-apply")
}
