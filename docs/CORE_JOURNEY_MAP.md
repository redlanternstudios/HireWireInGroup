# HireWire Core Journey Map

This map keeps agents oriented around the Application Readiness Engine rather than isolated screens.

| Step | Primary Surface | Canonical Logic | Data Source | Status |
| --- | --- | --- | --- | --- |
| Sign up/sign in | `app/(auth)/` | Supabase Auth | `auth.users` | Exists |
| Dashboard | `app/(dashboard)/dashboard/` | Server-side dashboard queries | `jobs`, readiness summaries | Exists |
| Add or capture job | `app/(dashboard)/jobs/` | Job creation and parsing routes | `jobs`, `job_analyses` | Exists |
| Analyze job | Job detail/API routes | Job analysis pipeline | `job_analyses`, `jobs` | Partial, verify per task |
| Compare against Career Context | Prove Fit/evidence surfaces | Evidence mapping | `evidence_library`, job requirements | Partial, verify per task |
| Clarify weak evidence | Coach surfaces | Match Interview / coach save paths | `evidence_library`, clarifications | Partial, avoid duplicate coach paths |
| Save confirmed/skipped proof | Evidence APIs/actions | Evidence mapping helpers | `evidence_library`, requirement mappings | Partial, verify downstream writes |
| Recalculate readiness | Shared consumers | `lib/readiness/evaluator.ts` | Jobs, evidence, package quality | Canonical authority |
| Generate Application Package | Generate button/API | `app/api/generate-documents/route.ts` | `jobs`, `evidence_library` | High-risk generation spine |
| Preview provenance | Documents page/components | Package preview components | `jobs.generated_resume`, `jobs.generated_cover_letter`, provenance | Exists |
| Ready to Apply gate | `/ready-to-apply` | `lib/readiness/evaluator.ts` | Readiness evaluator | Canonical gate |
| Apply or override | Ready gate/actions | `lib/actions/apply.ts` | `jobs`, audit/override records | Canonical mutation path |
| Track status/outcomes | Jobs/status surfaces | Outcome tracking | `jobs.status`, outcome data | Exists |
| Feed outcomes back | Context/evidence systems | Context engine and evidence updates | Career Context/evidence tables | Partial, verify per task |

## Agent Rule

If a change does not strengthen one of these steps or a dependency of these steps, treat it as secondary scope.
