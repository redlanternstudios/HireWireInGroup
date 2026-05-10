import React from "react"
import { CoachRecommendation } from "@/lib/coach/recommendations"

export function CoachRecommendation({ rec }: { rec: CoachRecommendation }) {
  return (
    <div className="p-2 border-l-4 border-primary bg-muted mb-2">
      <span className="font-medium">{rec.message}</span>
    </div>
  )
}
