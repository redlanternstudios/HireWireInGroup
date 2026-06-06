import React from "react";
import { CoachRecommendation } from "@/lib/coach/recommendations";

export function EmbeddedCoachCard({
  recommendation,
}: {
  recommendation: CoachRecommendation;
}) {
  return (
    <div className="rounded-lg border bg-card p-4 shadow-sm">
      <div className="font-semibold text-base mb-1">Coach</div>
      <div className="text-foreground text-sm">{recommendation.message}</div>
    </div>
  );
}
