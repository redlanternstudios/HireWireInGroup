"use client";

import { WorkflowCoachPanel } from "@/components/coach/WorkflowCoachPanel";
import type { CoachRecommendation } from "@/lib/coach/recommendations";

export type WorkflowCoachPanelClientProps = {
  recommendations: CoachRecommendation[];
  blockers: string[];
  insights: string[];
  momentum?: string;
  hidden?: boolean;
};

export function WorkflowCoachPanelClient(props: WorkflowCoachPanelClientProps) {
  if (props.hidden) return null;
  return <WorkflowCoachPanel {...props} />;
}
