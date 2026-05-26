"use client"

import { useRef, useCallback } from "react"
import { Send } from "lucide-react"
import { cn } from "@/lib/utils"

export function ChatComposer({
  value,
  onChange,
  onSubmit,
  disabled = false,
  className,
}: {
  value: string
  onChange: (value: string) => void
  onSubmit: (value: string) => void
  disabled?: boolean
  className?: string
}) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault()
        const trimmed = value.trim()
        if (trimmed && !disabled) {
          onSubmit(trimmed)
        }
      }
    },
    [value, disabled, onSubmit],
  )

  const handleSubmit = () => {
    const trimmed = value.trim()
    if (trimmed && !disabled) {
      onSubmit(trimmed)
      textareaRef.current?.focus()
    }
  }

  return (
    <div
      className={cn(
        "shrink-0 border-t border-border/60 bg-background px-4 py-3",
        className,
      )}
    >
      <div
        className={cn(
          "flex items-end gap-2 rounded-xl border border-border bg-card shadow-sm transition-colors",
          "focus-within:border-primary/40 focus-within:ring-2 focus-within:ring-primary/10",
        )}
      >
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type your answer here..."
          disabled={disabled}
          rows={1}
          className={cn(
            "min-h-[44px] max-h-[160px] w-full resize-none bg-transparent px-4 py-3 text-sm text-foreground",
            "placeholder:text-muted-foreground",
            "focus:outline-none",
            "disabled:opacity-50",
            "scrollbar-thin",
          )}
          style={{ fieldSizing: "content" } as React.CSSProperties}
          aria-label="Your answer"
        />
        <button
          onClick={handleSubmit}
          disabled={disabled || !value.trim()}
          className={cn(
            "mb-2 mr-2 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary shadow-sm",
            "transition-all hover:bg-primary/90",
            "disabled:bg-muted disabled:text-muted-foreground disabled:shadow-none",
          )}
          aria-label="Send answer"
        >
          <Send className="h-3.5 w-3.5 text-white" />
        </button>
      </div>
      <p className="mt-1.5 px-1 text-[11px] text-muted-foreground">
        Answer naturally. HireWire will structure it for you.
      </p>
    </div>
  )
}
