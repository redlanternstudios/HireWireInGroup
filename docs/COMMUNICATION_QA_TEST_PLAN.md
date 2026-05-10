# Communication QA Test Plan

## Goals
- Ensure all internal and external messages are governed by the comms system.
- Verify that no random copy exists in components where templating is appropriate.
- Confirm that empty states, error recovery, and coach responses use the comms layer.
- Validate that all external messages require approval and preview.
- Check that no message claims readiness, achievements, or application status unless proven.

## Test Cases
- [ ] UI empty states display correct message, action, and next step.
- [ ] Error recovery messages are actionable and user-friendly.
- [ ] Coach responses follow mode and length rules.
- [ ] External messages (recruiter, referral, follow up) are in draft, preview, and require approval.
- [ ] All variables in templates are correctly interpolated.
- [ ] No message exposes internal system language to users.
- [ ] Communication preferences are respected if implemented.
- [ ] No fake sending of external messages.

## Manual and Automated QA
- Manual review of all major flows.
- Automated tests for message rendering and variable interpolation.
- Spot checks for new templates and registry updates.
