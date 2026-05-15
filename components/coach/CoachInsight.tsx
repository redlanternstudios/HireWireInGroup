import React from "react";

export function CoachInsight({ insight }: { insight: string }) {
  return (
    <div className="p-2 border-l-4 border-accent bg-muted mb-2">
      <span className="font-medium text-accent-foreground">{insight}</span>
    </div>
  );
}
