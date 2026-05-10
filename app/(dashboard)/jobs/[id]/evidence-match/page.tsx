import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

export const dynamic = "force-dynamic"
export const revalidate = 0

export default async function EvidenceMatchPage({ params }: { params: { id: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  // Placeholder: Replace with actual evidence matching UI
  return (
    <div className="space-y-6 max-w-2xl mx-auto py-12">
      <h1 className="text-2xl font-semibold tracking-tight">Match Evidence</h1>
      <p className="text-muted-foreground text-sm mb-4">
        Map your experience and achievements to the requirements of this job. This step helps generate a tailored resume and cover letter.
      </p>
      <div className="flex flex-col items-center justify-center py-16 text-center border rounded-xl bg-card">
        <p className="text-muted-foreground text-sm">Evidence matching UI coming soon.</p>
        <a href="/evidence" className="mt-2 text-sm text-primary underline">Go to Career Context</a>
      </div>
    </div>
  )
}
