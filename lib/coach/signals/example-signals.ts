// Example signal payloads
import { CoachSignal } from "./index"

export const exampleSignals: CoachSignal[] = [
  {
    type: "repeated_regenerations",
    payload: { count: 4 },
    timestamp: "2026-05-10T12:00:00Z",
  },
  {
    type: "inactivity",
    payload: { days: 16 },
    timestamp: "2026-05-10T12:00:00Z",
  },
  {
    type: "low_evidence_coverage",
    payload: { coverage: 0.5 },
    timestamp: "2026-05-10T12:00:00Z",
  },
]
