# HireWire Quality Gates

## Hard Failures
- Unsupported claim
- Fabricated metric/title/employer/certification
- Changed chronology
- Missing required structure
- Generation attempted before job analysis exists

## Warnings
- Derived claim
- Keyword saturation too high
- Resume too long
- Weak evidence coverage
- Generic phrasing
- Low recruiter scanability
- High drift score

## Validation Flow
1. Validate all claims for truth state and evidence linkage.
2. Block generation if any hard fail is present.
3. Warn (but allow) if only warnings are present.
4. Log all failed gates and warnings for audit.
