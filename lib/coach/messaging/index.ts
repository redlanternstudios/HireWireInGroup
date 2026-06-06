// CoachMessaging: Calibrate tone and avoid generic chatbot phrasing
import { CoachBehaviorMode } from "../behavior/modes";

export function getCoachMessage(
  message: string,
  mode: CoachBehaviorMode = "operational",
): string {
  // Calibrate tone and avoid generic AI phrasing
  switch (mode) {
    case "warning":
      return `⚠️ ${message}`;
    case "celebratory":
      return `🎉 ${message}`;
    case "motivational":
      return `Keep going: ${message}`;
    case "concise":
      return message;
    case "strategic":
      return `Strategy: ${message}`;
    case "analytical":
      return `Analysis: ${message}`;
    default:
      return message;
  }
}

// Never use: "How can I help?", repetitive AI wording, or wall of text.
