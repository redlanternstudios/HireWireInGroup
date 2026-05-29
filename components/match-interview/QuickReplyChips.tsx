"use client"

import { cn } from "@/lib/utils"

export function QuickReplyChips({
  replies,
  onSelect,
  disabled = false,
  className,
}: {
  replies: string[]
  onSelect: (value: string) => void
  disabled?: boolean
  className?: string
}) {
  if (!replies.length) return null

  return (
    <div className={cn("flex flex-wrap gap-2 pl-9", className)}>
      {replies.map((reply) => (
        <button
          key={reply}
          onClick={() => onSelect(reply)}
          disabled={disabled}
          className={cn(
            "rounded-full border border-border bg-background px-3.5 py-1.5 text-xs font-medium text-foreground",
            "shadow-sm transition-all duration-100",
            "hover:border-primary/40 hover:bg-primary/5 hover:text-primary",
            "disabled:pointer-events-none disabled:opacity-40",
          )}
        >
          {reply}
        </button>
      ))}
    </div>
  )
}
