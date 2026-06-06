import React from "react";

export function CoachBlocker({ blocker }: { blocker: string }) {
  return (
    <div className="p-2 border-l-4 border-destructive bg-muted mb-2">
      <span className="font-medium text-destructive">{blocker}</span>
    </div>
  );
}
