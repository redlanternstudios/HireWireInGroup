// Minimal usage example for ResumeIntegrityFlags
import { ResumeIntegrityFlags, ResumeIntegrityFlag } from "@/components/integrity/ResumeIntegrityFlags"

const sampleFlags: ResumeIntegrityFlag[] = [
  {
    bullet: "Deployed Mars rover for NASA",
    risk_score: 0.95,
    risk_level: "high",
    flag_reason: "Unverifiable claim — requires proof of NASA employment.",
    suggested_rewrite: "Contributed to a university Mars rover simulation project."
  },
  {
    bullet: "Managed $10M budget at age 22",
    risk_score: 0.8,
    risk_level: "medium",
    flag_reason: "Implausible for typical career stage.",
    suggested_rewrite: "Assisted with budget tracking for departmental projects."
  }
]

export default function Demo() {
  return <ResumeIntegrityFlags flags={sampleFlags} />
}
