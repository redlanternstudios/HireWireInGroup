/**
 * Application Snapshot — Architecture Stub
 *
 * At apply time, freeze the exact resume content, version ID, and export
 * format so that outcome analytics (interviews, rejections, offers) can be
 * correlated back to the precise document that was submitted.
 *
 * Wire createApplicationSnapshot() from lib/actions/apply.ts before
 * building v2 outcome analytics or recruiter pattern learning.
 */

export interface ApplicationSnapshot {
  job_id: string
  user_id: string
  resume_content: string
  cover_letter_content: string
  resume_version_id: string | null
  content_hash: string
  export_format: string
  snapshot_at: string
}

// TODO: implement — call from lib/actions/apply.ts at apply time
// 1. compute content_hash = sha256(resume_content)
// 2. read current job_resume_versions.id for the active version
// 3. insert into application_snapshots (table not yet created)
// 4. attach snapshot_id to the application_events row
export async function createApplicationSnapshot(
  _job_id: string,
  _user_id: string,
): Promise<void> {
  // Not yet implemented — architecture stub only
}
