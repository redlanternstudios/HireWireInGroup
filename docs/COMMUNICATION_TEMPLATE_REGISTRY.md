# Communication Template Registry

This registry documents all internal and external communication templates used in HireWire. Each entry includes the template key, domain, audience, intent, channel, tone, subject, body, and required variables.

## Example Entry

- **Key:** jobs.empty
- **Domain:** PRODUCT_UI
- **Audience:** USER
- **Intent:** INFORM
- **Channel:** in_app
- **Tone:** calm
- **Subject:** No jobs yet
- **Body:** This page shows all your job opportunities. Start by adding a new job to begin your pipeline.
- **Action Label:** Add Job
- **Next Action:** /jobs/new
- **Variables:** None

## Template List

See `lib/comms/registry.ts`, `lib/comms/external-templates.ts`, and `lib/comms/notifications.ts` for the full set of templates. Update this file as new templates are added.
