import { Screen05DeleteEvidence } from "@/app/(features)/evidence/screen-05-delete-evidence"

export default async function EvidenceDeletePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  return <Screen05DeleteEvidence evidenceId={id} />
}
