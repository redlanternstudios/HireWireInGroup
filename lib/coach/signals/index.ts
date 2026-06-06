// CoachSignals: Detect workflow and user state signals

export type CoachSignalType =
  | "user_stuck"
  | "repeated_regenerations"
  | "low_evidence_coverage"
  | "high_drift_score"
  | "repeated_rejection"
  | "interview_momentum"
  | "inactivity"
  | "workflow_confusion";

export interface CoachSignal {
  type: CoachSignalType;
  payload: Record<string, any>;
  timestamp: string;
}

// Example signal detection stubs
export function detectSignals(context: any): CoachSignal[] {
  // Implement detection logic per signal type
  return [];
}
