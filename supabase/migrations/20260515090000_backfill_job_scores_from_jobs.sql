-- Backfill historical score drift created before document generation synced
-- jobs.score and job_scores.overall_score consistently.
--
-- Canonical current behavior writes the final fit score to jobs.score and then
-- synchronizes job_scores.overall_score. This idempotent migration only updates
-- existing job_scores rows when jobs.score is populated and the normalized score
-- differs. Null jobs.score values never overwrite existing normalized scores.

update public.job_scores js
set
  overall_score = j.score,
  updated_at = now()
from public.jobs j
where js.job_id = j.id
  and j.score is not null
  and js.overall_score is distinct from j.score;
