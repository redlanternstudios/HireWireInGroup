// Example CoachContext object
import { CoachContext } from "./build-context";

export const exampleCoachContext: CoachContext = {
  workflowStage: "gap_resolution",
  blockers: ["Missing leadership evidence"],
  readiness: 0.7,
  evidenceCoverage: 0.5,
  fitScore: 0.68,
  generationHistory: [
    { type: "resume", date: "2026-05-01", outcome: "rejected" },
    { type: "resume", date: "2026-05-03", outcome: "rejected" },
    { type: "resume", date: "2026-05-05", outcome: "pending" },
  ],
  applicationHistory: [
    { jobId: 1, date: "2026-04-20", outcome: "rejected" },
    { jobId: 2, date: "2026-04-28", outcome: "interview" },
  ],
  recentOutcomes: ["interview", "rejected"],
  userPreferences: { tone: "concise" },
  currentPage: "/jobs/123/gap-resolution",
  currentAction: "reviewing_gaps",
};
