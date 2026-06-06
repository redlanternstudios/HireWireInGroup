// CoachSignals engine: Detect key workflow/user signals
import { CoachSignal } from "./index";

export function detectCoachSignals(context: any, memory: any): CoachSignal[] {
  const signals: CoachSignal[] = [];
  // Example: user regenerated 4 times
  if (context.generationHistory && context.generationHistory.length >= 4) {
    signals.push({
      type: "repeated_regenerations",
      payload: { count: context.generationHistory.length },
      timestamp: new Date().toISOString(),
    });
  }
  // Example: no applications in 14 days
  if (context.applicationHistory && context.applicationHistory.length > 0) {
    const lastApp =
      context.applicationHistory[context.applicationHistory.length - 1];
    const lastDate = new Date(lastApp.date);
    const now = new Date();
    const diffDays =
      (now.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24);
    if (diffDays > 14) {
      signals.push({
        type: "inactivity",
        payload: { days: diffDays },
        timestamp: now.toISOString(),
      });
    }
  }
  // Add more signal detections as needed
  return signals;
}
