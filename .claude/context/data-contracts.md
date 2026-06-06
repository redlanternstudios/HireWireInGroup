# Data Contracts

## Readiness

`lib/readiness/evaluator.ts` is the only readiness authority.

Do not gate apply, generation, next action, or ready/not-ready state using local page logic.

## Apply

`lib/actions/apply.ts` is the only apply mutation path.

All apply CTAs should route through `/ready-to-apply` or call the same server action with the same gate and override logging.

## Documents

Canonical generated document content:

- `jobs.generated_resume`
- `jobs.generated_cover_letter`

Do not introduce a competing `generated_documents` source of truth unless the user approves a package architecture migration.

## Evidence

Generated claims must be grounded in `evidence_library`.

Evidence may come from:

- resume upload
- LinkedIn import
- manual Career Context entries
- Match Interview confirmed claims

Evidence mutations should trigger downstream readiness/evidence-map invalidation when applicable.

## Column Name Map

| Table | Use | Never use |
| --- | --- | --- |
| `source_resumes` | `file_name` | `filename` |
| `source_resumes` | `parsed_text` | `content_text` |
| `jobs` | `role_title` | `title` |
| `jobs` | `company_name` | `company` |
| `job_analyses` | `title`, `company` | `jobs.title`, `jobs.company` |
| `user_profile` | `website_url`, `github_url` | `linkedin_url`, `portfolio_url` |
| `evidence_library` | `confidence_level` | `confidence_score` as display authority |

