import { createClient } from "@/lib/supabase/server"
import { redirect, notFound } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ArrowRight, ShieldCheck, AlertCircle, Lightbulb } from "lucide-react"

export const dynamic = "force-dynamic"

export default async function EvidenceMatchPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: job, error } = await supabase
    .from("jobs")
    .select("id, role_title, company_name, qualifications_required, responsibilities")
    .eq("id", id)
    .eq("user_id", user.id)
    .is("deleted_at", null)
    .single()

  if (error || !job) notFound()

  const [{ data: evidenceItems }, { data: analysis }] = await Promise.all([
    supabase
      .from("evidence_library")
      .select("id, title, source_type, confidence_score, outcomes")
      .eq("user_id", user.id)
      .order("confidence_score", { ascending: false }),
    supabase
      .from("job_analyses")
      .select("matched_skills, known_gaps, requirements")
      .eq("job_id", id)
      .eq("user_id", user.id)
      .maybeSingle(),
  ])

  const requirements: string[] = [
    ...(Array.isArray(job.qualifications_required) ? job.qualifications_required : []),
    ...(Array.isArray(analysis?.requirements) ? analysis.requirements : []),
  ].filter(Boolean)

  const matchedSkills: string[] = Array.isArray(analysis?.matched_skills) ? analysis.matched_skills : []
  const gaps: string[] = Array.isArray(analysis?.known_gaps) ? analysis.known_gaps : []
  const evidenceCount = evidenceItems?.length ?? 0

  return (
    <div className="hw-page max-w-3xl">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2">
        <Link
          href={`/jobs/${id}`}
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
          {job.role_title ?? "Job"} at {job.company_name ?? "—"}
        </Link>
      </div>

      {/* Header */}
      <div className="hw-card px-6 py-5">
        <p className="hw-section-label mb-1">Step 2 of 5</p>
        <h1 className="hw-page-title">Evidence Matching</h1>
        <p className="hw-page-subtitle">
          Map your proof points from your evidence library to the requirements of this role.
          Stronger coverage leads to a higher fit score and better-tailored documents.
        </p>
      </div>

      {/* Status strip */}
      <div className="hw-metrics">
        <div className="hw-stat">
          <span className="hw-stat-value text-primary">{requirements.length}</span>
          <span className="hw-stat-label">Requirements</span>
        </div>
        <div className="hw-stat">
          <span className="hw-stat-value text-emerald-600">{matchedSkills.length}</span>
          <span className="hw-stat-label">Matched</span>
        </div>
        <div className="hw-stat">
          <span className="hw-stat-value text-amber-600">{gaps.length}</span>
          <span className="hw-stat-label">Gaps</span>
        </div>
        <div className="hw-stat">
          <span className="hw-stat-value">{evidenceCount}</span>
          <span className="hw-stat-label">Proof Points</span>
        </div>
      </div>

      {/* Main content */}
      <div className="hw-workspace">
        <div className="hw-workspace-main space-y-4">

          {/* Matched skills */}
          {matchedSkills.length > 0 && (
            <div className="hw-card px-5 py-4">
              <h2 className="hw-section-label mb-3">Matched Requirements</h2>
              <ul className="space-y-2">
                {matchedSkills.map((skill, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-sm">
                    <ShieldCheck className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span className="text-foreground">{skill}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Gaps */}
          {gaps.length > 0 && (
            <div className="hw-card px-5 py-4">
              <h2 className="hw-section-label mb-3">Gaps to Address</h2>
              <p className="text-xs text-muted-foreground mb-3">
                These requirements have no strong evidence match yet. Add proof points to your Career Context to fill them.
              </p>
              <ul className="space-y-2">
                {gaps.map((gap, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-sm">
                    <AlertCircle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                    <span className="text-foreground">{gap.replace(/^Gap:\s*/i, "")}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-4 pt-3 border-t border-border">
                <Link href="/evidence">
                  <Button variant="outline" size="sm" className="gap-1.5 text-xs">
                    Add to Career Context <ArrowRight className="h-3 w-3" />
                  </Button>
                </Link>
              </div>
            </div>
          )}

          {/* No analysis yet */}
          {requirements.length === 0 && matchedSkills.length === 0 && (
            <div className="hw-empty">
              <div className="hw-empty-icon">
                <AlertCircle className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm font-semibold">Analysis required first</p>
                <p className="text-xs text-muted-foreground mt-1 max-w-xs">
                  Run job analysis before matching evidence. Return to the job detail page and trigger analysis.
                </p>
              </div>
              <Link href={`/jobs/${id}`}>
                <Button size="sm" className="hw-btn-primary gap-1.5">
                  Go back and analyze <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </Link>
            </div>
          )}
        </div>

        {/* Right rail */}
        <div className="hw-workspace-rail">
          <h2 className="hw-section-label mb-3">Your Proof Points</h2>
          <div className="hw-panel p-4 space-y-2">
            {evidenceCount === 0 ? (
              <div className="text-center py-4">
                <p className="text-xs text-muted-foreground">No evidence yet.</p>
                <Link href="/evidence" className="text-xs text-primary hover:underline mt-1 block">
                  Add career context
                </Link>
              </div>
            ) : (
              (evidenceItems ?? []).slice(0, 8).map((item) => (
                <div key={item.id} className="flex items-start gap-2 py-1.5 border-b border-border/50 last:border-0">
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-500 shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-foreground truncate">{item.title}</p>
                    <p className="text-[10px] text-muted-foreground capitalize">{item.source_type?.replace(/_/g, " ")}</p>
                  </div>
                </div>
              ))
            )}
            {evidenceCount > 8 && (
              <p className="text-[10px] text-muted-foreground text-center pt-1">
                +{evidenceCount - 8} more in your library
              </p>
            )}
          </div>

          <div className="mt-4">
            <h2 className="hw-section-label mb-2">Tip</h2>
            <div className="hw-panel p-4">
              <div className="flex items-start gap-2">
                <Lightbulb className="h-3.5 w-3.5 text-amber-500 shrink-0 mt-0.5" />
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Every gap you address with real evidence reduces the AI&apos;s need to infer, producing stronger and more accurate application materials.
                </p>
              </div>
            </div>
          </div>

          {/* Continue CTA */}
          <div className="mt-4">
            <Link href={`/jobs/${id}`}>
              <Button className="w-full hw-btn-primary gap-1.5 text-sm">
                Continue to scoring <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
