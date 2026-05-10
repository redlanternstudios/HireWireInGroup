"use client"

import { useRef, useEffect } from "react"
import { useChat } from "@ai-sdk/react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"
import {
  Send,
  Sparkles,
  User,
  Loader2,
  Lightbulb,
  FileText,
  Target,
  HelpCircle
} from "lucide-react"
import ReactMarkdown from "react-markdown"

interface CoachChatProps {
  className?: string
  conversationId?: string
  compact?: boolean
  onClose?: () => void
  jobContext?: {
    jobId: string
    title: string
    company: string
    score?: number | null
    status?: string
  }
  gapContext?: {
    jobTitle: string
    company: string
    gap?: {
      requirement: string
      category: string
      coach_question: string
    }
  }
  initialMessage?: string
}

const quickActions = [
  { label: "Review my pipeline",    icon: Target,     prompt: "What should I focus on next in my job search? Review my pipeline and suggest the best next action." },
  { label: "Interview prep tips",   icon: HelpCircle, prompt: "I have an upcoming interview. Can you help me prepare? Give me your top tips." },
  { label: "Improve my resume",     icon: FileText,   prompt: "Can you review my evidence library and suggest how I could strengthen my resume?" },
  { label: "Build my evidence",     icon: Lightbulb,  prompt: "Help me add to my evidence library. Ask me about my achievements and experiences." },
]

export function CoachChat({ className, compact = false, jobContext, gapContext, initialMessage }: CoachChatProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const initialMessageSent = useRef(false)

  const {
    messages,
    input,
    setInput,
    handleInputChange,
    handleSubmit,
    isLoading,
    status,
    error,
  } = useChat({
    api: "/api/coach",
    body: {
      ...(jobContext ? { jobContext } : {}),
      ...(gapContext  ? { gapContext  } : {}),
    },
    onError: (err) => {
      console.error("[coach] stream error:", err)
    },
  })

  // Fire initial message once on mount
  useEffect(() => {
    if (initialMessage && !initialMessageSent.current && messages.length === 0) {
      initialMessageSent.current = true
      setInput(initialMessage)
      // Give React one tick to flush the input state, then submit
      setTimeout(() => {
        const fakeEvent = { preventDefault: () => {} } as React.FormEvent<HTMLFormElement>
        handleSubmit(fakeEvent)
      }, 0)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Auto-scroll on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, isLoading])

  const handleQuickAction = (prompt: string) => {
    if (isLoading) return
    setInput(prompt)
    setTimeout(() => {
      const fakeEvent = { preventDefault: () => {} } as React.FormEvent<HTMLFormElement>
      handleSubmit(fakeEvent)
    }, 0)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      if (!input.trim() || isLoading) return
      const fakeEvent = { preventDefault: () => {} } as React.FormEvent<HTMLFormElement>
      handleSubmit(fakeEvent)
    }
  }

  const canSend = input.trim().length > 0 && !isLoading

  return (
    <div className={cn("flex flex-col h-full", className)}>
      {/* Messages */}
      <ScrollArea
        ref={scrollRef as React.RefObject<HTMLDivElement>}
        className={cn("flex-1 px-4", compact ? "py-2" : "py-4")}
      >
        {messages.length === 0 && (
          <div className={cn("space-y-4", compact ? "py-2" : "py-6")}>
            <div className="flex items-start gap-3">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-primary text-white">
                  <Sparkles className="h-4 w-4" />
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-2">
                <p className="text-sm font-medium">HireWire Coach</p>
                <p className="text-sm text-muted-foreground">
                  Hey! I&apos;m your personal career coach. I can help you with job search strategy,
                  interview prep, building your evidence library, and improving your application materials.
                </p>
                {jobContext ? (
                  <div className="p-2 bg-muted rounded-md border text-sm">
                    <p className="font-medium">Currently focused on:</p>
                    <p className="text-muted-foreground">
                      {jobContext.title} at {jobContext.company}
                      {jobContext.score != null && ` · Fit: ${jobContext.score}%`}
                    </p>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">What would you like to work on today?</p>
                )}
              </div>
            </div>

            <div className={cn("grid gap-2", compact ? "grid-cols-1" : "grid-cols-2")}>
              {quickActions.map((action) => (
                <Button
                  key={action.label}
                  variant="outline"
                  className="justify-start gap-2 h-auto py-2 px-3 text-left"
                  onClick={() => handleQuickAction(action.prompt)}
                  disabled={isLoading}
                >
                  <action.icon className="h-4 w-4 text-primary shrink-0" />
                  <span className="text-xs">{action.label}</span>
                </Button>
              ))}
            </div>
          </div>
        )}

        <div className="space-y-4">
          {messages.map((message) => {
            const isUser = message.role === "user"
            const text = typeof message.content === "string" ? message.content : ""
            if (!text) return null

            return (
              <div key={message.id} className={cn("flex items-start gap-3", isUser && "flex-row-reverse")}>
                <Avatar className="h-8 w-8">
                  <AvatarFallback className={cn(isUser ? "bg-muted text-muted-foreground" : "bg-primary text-white")}>
                    {isUser ? <User className="h-4 w-4" /> : <Sparkles className="h-4 w-4" />}
                  </AvatarFallback>
                </Avatar>
                <div className={cn("flex-1 space-y-1", isUser && "text-right")}>
                  <p className="text-xs font-medium text-muted-foreground">
                    {isUser ? "You" : "HireWire Coach"}
                  </p>
                  <div className={cn("prose prose-sm max-w-none", isUser ? "text-right" : "text-left")}>
                    {isUser ? (
                      <p className="text-sm">{text}</p>
                    ) : (
                      <ReactMarkdown
                        components={{
                          p:      ({ children }) => <p className="text-sm text-foreground mb-2">{children}</p>,
                          ul:     ({ children }) => <ul className="text-sm list-disc pl-4 mb-2">{children}</ul>,
                          ol:     ({ children }) => <ol className="text-sm list-decimal pl-4 mb-2">{children}</ol>,
                          li:     ({ children }) => <li className="text-sm mb-1">{children}</li>,
                          strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                          code:   ({ children }) => <code className="bg-muted px-1 py-0.5 rounded text-xs">{children}</code>,
                        }}
                      >
                        {text}
                      </ReactMarkdown>
                    )}
                  </div>
                </div>
              </div>
            )
          })}

          {(isLoading || status === "streaming") && (
            <div className="flex items-start gap-3">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-primary text-white">
                  <Sparkles className="h-4 w-4" />
                </AvatarFallback>
              </Avatar>
              <div className="flex items-center gap-2 py-2">
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
                <span className="text-sm text-muted-foreground">Thinking...</span>
              </div>
            </div>
          )}

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm font-medium text-red-700">Something went wrong</p>
              <p className="text-xs text-red-600 mt-0.5">{error.message || "Failed to get a response. Please try again."}</p>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Input */}
      <div className={cn("border-t bg-background", compact ? "p-2" : "p-4")}>
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Textarea
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="Ask me anything about your job search..."
            className={cn("min-h-[40px] max-h-[120px] resize-none", compact && "text-sm")}
            rows={1}
            disabled={isLoading}
          />
          <Button
            type="submit"
            size="icon"
            disabled={!canSend}
            className="shrink-0 bg-primary text-primary-foreground hover:bg-primary/90"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </form>
      </div>
    </div>
  )
}
