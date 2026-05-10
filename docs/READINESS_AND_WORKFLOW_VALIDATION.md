# Readiness and Workflow State Validation

This document validates that HireWire never fakes workflow state and readiness is always derived from canonical logic.


## Canonical Readiness

- has job analysis
- has evidence mapping
- has score
- has resume
- has cover letter
- quality passed
- is applied
- is archived
- can generate
- can apply
- reasons not ready
- next action

## Rules

- No inline readiness computation
- No writing status ready to fake approval
- No Apply Now unless gates satisfied
- No Ready Now unless readiness proves it
- No duplicate apply paths
