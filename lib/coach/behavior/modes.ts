// Coach behavior modes for tone and guidance calibration
export type CoachBehaviorMode =
  | "operational"
  | "strategic"
  | "motivational"
  | "analytical"
  | "concise"
  | "warning"
  | "celebratory";

export const COACH_BEHAVIOR_MODES: CoachBehaviorMode[] = [
  "operational",
  "strategic",
  "motivational",
  "analytical",
  "concise",
  "warning",
  "celebratory",
];
