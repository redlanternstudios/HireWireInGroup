import { redirect } from "next/navigation"

export const dynamic = "force-dynamic"

/**
 * /jobs/[id]/evidence → redirect to canonical /jobs/[id]/evidence-match
 * Handles stale bookmarks, typos, or old links that used the short form.
 */
export default async function EvidenceRedirectPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  redirect(`/jobs/${id}/evidence-match`)
}
