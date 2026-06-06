# Canonical Routes

| Route | Purpose | File |
| --- | --- | --- |
| `/dashboard` | Command center | `app/(dashboard)/dashboard/page.tsx` |
| `/coach` | State-aware guidance | `app/(dashboard)/coach/page.tsx` |
| `/jobs` | All jobs pipeline | `app/(dashboard)/jobs/page.tsx` |
| `/jobs/new` | Add job redirect/entry | `app/(dashboard)/jobs/new/page.tsx` |
| `/jobs/[id]` | Job detail and progress | `app/(dashboard)/jobs/[id]/page.tsx` |
| `/jobs/[id]/evidence-match` | Prove Fit / evidence gaps | `app/(dashboard)/jobs/[id]/evidence-match/page.tsx` |
| `/jobs/[id]/documents` | Generated materials review | `app/(dashboard)/jobs/[id]/documents/page.tsx` |
| `/ready-to-apply` | Apply gate | `app/(dashboard)/ready-to-apply/page.tsx` |
| `/ready-queue` | Compatibility redirect | `app/(dashboard)/ready-queue/page.tsx` |
| `/applications` | Applied/outcome tracker | `app/(dashboard)/applications/page.tsx` |
| `/documents` | Materials library | `app/(dashboard)/documents/page.tsx` |
| `/evidence` | Career Context / proof library | `app/(dashboard)/evidence/page.tsx` |
| `/career-context` | Compatibility redirect | `app/(dashboard)/career-context/page.tsx` |
| `/analytics` | Pipeline analytics | `app/(dashboard)/analytics/page.tsx` |
| `/logs` | Activity log | `app/(dashboard)/logs/page.tsx` |
| `/profile` | User profile | `app/(dashboard)/profile/page.tsx` |
| `/billing` | Plan and billing | `app/(dashboard)/billing/page.tsx` |
| `/settings` | Settings | `app/(dashboard)/settings/page.tsx` |

## Non-Canonical Routes

Do not link these unless the user explicitly asks to revive them:

- `/jobs/[id]/red-team`
- `/jobs/[id]/interview-prep`
- `/companies`
- `/templates`
- `/manual-entry`

