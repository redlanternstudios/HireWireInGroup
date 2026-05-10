import React from "react"

export function CoachMomentum({ momentum }: { momentum: string }) {
  return (
    <div className="p-2 border-l-4 border-success bg-muted mb-2">
      <span className="font-medium text-success-foreground">{momentum}</span>
    </div>
  )
}
