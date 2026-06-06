"use client"

import { Sparkles } from "lucide-react"
import ReactMarkdown from "react-markdown"
import { cn } from "@/lib/utils"

export function CoachMessageBubble({
  content,
  isLoading = false,
  className,
}: {
  content?: string
  isLoading?: boolean
  className?: string
}) {
  return (
    <div className={cn("flex items-start gap-2.5", className)}>
      {/* Avatar */}
      <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary shadow-sm">
        <Sparkles className="h-3.5 w-3.5 text-white" />
      </div>

      <div className="min-w-0 max-w-[82%]">
        <div className="rounded-2xl rounded-tl-sm bg-card border border-border/60 px-4 py-3 shadow-sm">
          {isLoading ? (
            <span className="flex items-center gap-1 text-muted-foreground text-sm">
              <span
                className="inline-block h-1.5 w-1.5 rounded-full bg-muted-foreground/60 animate-bounce"
                style={{ animationDelay: "0ms" }}
              />
              <span
                className="inline-block h-1.5 w-1.5 rounded-full bg-muted-foreground/60 animate-bounce"
                style={{ animationDelay: "150ms" }}
              />
              <span
                className="inline-block h-1.5 w-1.5 rounded-full bg-muted-foreground/60 animate-bounce"
                style={{ animationDelay: "300ms" }}
              />
            </span>
          ) : (
            <div className="prose prose-sm prose-slate max-w-none text-foreground [&>p]:leading-relaxed [&>p:last-child]:mb-0 [&>ul]:mt-2 [&>ul>li]:text-sm">
              <ReactMarkdown>{content ?? ""}</ReactMarkdown>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export function UserMessageBubble({
  content,
  className,
}: {
  content: string
  className?: string
}) {
  return (
    <div className={cn("flex items-start justify-end gap-2.5", className)}>
      <div className="min-w-0 max-w-[82%]">
        <div className="rounded-2xl rounded-tr-sm bg-primary px-4 py-3 shadow-sm">
          <p className="text-sm leading-relaxed text-white">{content}</p>
        </div>
      </div>
    </div>
  )
}
