# HireWire Error Handling Test Plan

## Auth
- Expired session
- Not logged in
- Access another user’s job

## Job Intake
- Invalid URL
- Blocked LinkedIn page
- 404 job page
- Empty job content

## AI
- Missing API key
- Provider timeout
- Invalid model JSON
- Schema validation failure
- Rate limit

## Supabase
- Insert failure
- Missing table
- RLS denial
- Duplicate job

## Documents
- Missing resume export
- DOCX generation failure
- Cover letter missing

## Readiness
- No evidence
- Materials missing
- Quality not passed
- Already applied

## Apply
- Try apply before ready
- Try apply already applied job
- Application insert fails

## UI
- Global error boundary
- Route error boundary
- Form field error
- Empty state
- Retry action

## Logging
- Error is logged with correlation ID
- No stack trace or sensitive data exposed to user

## Acceptance
- All error categories are covered
- User sees actionable, friendly messages
- Correlation ID is shown
- No fake success or stack traces
