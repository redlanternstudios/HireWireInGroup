import React from "react"
import { CoachRecommendation } from "@/lib/coach/recommendations"
import { EmbeddedCoachCard } from "./EmbeddedCoachCard"
import { CoachBlocker } from "./CoachBlocker"
import { CoachInsight } from "./CoachInsight"
import { CoachMomentum } from "./CoachMomentum"

interface WorkflowCoachPanelProps {
  recommendations: CoachRecommendation[]
  blockers: string[]
  insights: string[]
  momentum?: string
}

export function WorkflowCoachPanel({ recommendations, blockers, insights, momentum }: WorkflowCoachPanelProps) {
  return (
    <div className="space-y-3">
      {blockers.map((b, i) => <CoachBlocker key={i} blocker={b} />)}
      {recommendations.map((r) => <EmbeddedCoachCard key={r.id} recommendation={r} />)}
      {insights.map((ins, i) => <CoachInsight key={i} insight={ins} />)}
      {momentum && <CoachMomentum momentum={momentum} />}
    </div>
  )
}
