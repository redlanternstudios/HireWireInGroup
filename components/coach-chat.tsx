"use client"

import { useRef, useEffect, useState } from "react"
import { useChat, Chat } from "@ai-sdk/react"
import { DefaultChatTransport } from "ai"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"


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
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const initialMessageSent = useRef(false)
  const [input, setInput] = useState("")

  // AI SDK v6: Chat requires a transport instance for custom api/body.
  // DefaultChatTransport handles the fetch to our route.
  const chat = useRef(new Chat({
    transport: new DefaultChatTransport({
      api: "/api/coach",
      body: {
        ...(jobContext ? { jobContext } : {}),
        ...(gapContext  ? { gapContext  } : {}),
      },
    }),
    onError: (err: Error) => {
      console.error("[coach] stream error:", err)
    },
  })).current

  const { messages, status, sendMessage } = useChat({ chat })

  const isLoading = status === "streaming" || status === "submitted"

  // Fire initial message once on mount
  useEffect(() => {
    if (initialMessage && !initialMessageSent.current && messages.length === 0) {
      initialMessageSent.current = true
      sendMessage({ role: "user", parts: [{ type: "text", text: initialMessage }] })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Auto-scroll to bottom on new messages / streaming updates
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, status])

  const submit = () => {
    const text = input.trim()
    if (!text || isLoading) return
    setInput("")
    sendMessage({ role: "user", parts: [{ type: "text", text }] })
  }

  const handleQuickAction = (prompt: string) => {
    if (isLoading) return
    sendMessage({ role: "user", parts: [{ type: "text", text: prompt }] })
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      submit()
    }
  }

  const canSend = input.trim().length > 0 && !isLoading

  return (
    <div className={cn("flex flex-col h-full bg-background", className)}>

      {/* Scrollable message area */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto"
      >
        <div className={cn("space-y-1 px-4", compact ? "py-3" : "py-5")}>

          {/* Welcome state */}
          {messages.length === 0 && (
            <div className="space-y-4">
              {/* Coach intro bubble */}
              <div className="flex items-start gap-3">
                <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center shrink-0 shadow-sm">
                  <Sparkles className="h-4 w-4 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-muted-foreground mb-1 uppercase tracking-wide">HireWire Coach</p>
                  <div className="bg-card border border-border rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
                    <p className="text-sm text-foreground leading-relaxed">
                      Hey! I&apos;m your personal career coach. I can help you with job search strategy,
                      interview prep, building your evidence library, and improving your application materials.
                    </p>
                    {jobContext ? (
                      <div className="mt-3 pt-3 border-t border-border">
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-0.5">Focused on</p>
                        <p className="text-sm font-medium text-foreground">
                          {jobContext.title}
                          <span className="text-muted-foreground font-normal"> at {jobContext.company}</span>
                          {jobContext.score != null && (
                            <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-primary/10 text-primary">
                              {jobContext.score}% fit
                            </span>
                          )}
                        </p>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground mt-1">What would you like to work on today?</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Quick actions */}
              <div className={cn("grid gap-2 pl-11", compact ? "grid-cols-1" : "grid-cols-2")}>
                {quickActions.map((action) => (
                  <button
                    key={action.label}
                    onClick={() => handleQuickAction(action.prompt)}
                    disabled={isLoading}
                    className={cn(
                      "flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left transition-all",
                      "bg-card border border-border hover:border-primary/30 hover:bg-primary/5",
                      "shadow-sm hover:shadow disabled:opacity-50 disabled:cursor-not-allowed"
                    )}
                  >
                    <div className="h-6 w-6 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <action.icon className="h-3.5 w-3.5 text-primary" />
                    </div>
                    <span className="text-xs font-medium text-foreground">{action.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Conversation messages */}
          <div className="space-y-4 pt-2">
            {messages.map((message) => {
              const isUser = message.role === "user"
              const text = (message.parts ?? [])
                .filter((p: { type: string }) => p.type === "text")
                .map((p: { type: string; text?: string }) => p.text ?? "")
                .join("")
              if (!text) return null

              return (
                <div
                  key={message.id}
                  className={cn("flex items-end gap-2.5", isUser ? "flex-row-reverse" : "flex-row")}
                >
                  {/* Avatar */}
                  {!isUser && (
                    <div className="h-7 w-7 rounded-full bg-primary flex items-center justify-center shrink-0 mb-0.5 shadow-sm">
                      <Sparkles className="h-3.5 w-3.5 text-white" />
                    </div>
                  )}
                  {isUser && (
                    <div className="h-7 w-7 rounded-full bg-foreground/10 border border-border flex items-center justify-center shrink-0 mb-0.5">
                      <User className="h-3.5 w-3.5 text-foreground/60" />
                    </div>
                  )}

                  {/* Bubble */}
                  <div className={cn("max-w-[78%]", isUser ? "items-end" : "items-start", "flex flex-col gap-1")}>
                    <div
                      className={cn(
                        "px-4 py-2.5 text-sm leading-relaxed",
                        isUser
                          ? "bg-foreground text-background rounded-2xl rounded-br-sm shadow-sm"
                          : "bg-card border border-border text-foreground rounded-2xl rounded-bl-sm shadow-sm"
                      )}
                    >
                      {isUser ? (
                        <p>{text}</p>
                      ) : (
                        <ReactMarkdown
                          components={{
                            p:      ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                            ul:     ({ children }) => <ul className="list-disc pl-4 mb-2 space-y-0.5">{children}</ul>,
                            ol:     ({ children }) => <ol className="list-decimal pl-4 mb-2 space-y-0.5">{children}</ol>,
                            li:     ({ children }) => <li>{children}</li>,
                            strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                            code:   ({ children }) => <code className="bg-muted px-1 py-0.5 rounded text-xs font-mono">{children}</code>,
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

            {/* Typing indicator */}
            {isLoading && (
              <div className="flex items-end gap-2.5">
                <div className="h-7 w-7 rounded-full bg-primary flex items-center justify-center shrink-0 mb-0.5 shadow-sm">
                  <Sparkles className="h-3.5 w-3.5 text-white" />
                </div>
                <div className="bg-card border border-border rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm">
                  <div className="flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/60 animate-bounce [animation-delay:0ms]" />
                    <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/60 animate-bounce [animation-delay:150ms]" />
                    <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/60 animate-bounce [animation-delay:300ms]" />
                  </div>
                </div>
              </div>
            )}

            {status === "error" && (
              <div className="flex justify-center">
                <div className="px-4 py-2.5 bg-red-50 border border-red-200 rounded-xl text-center">
                  <p className="text-sm font-medium text-red-700">Something went wrong</p>
                  <p className="text-xs text-red-500 mt-0.5">Failed to get a response. Please try again.</p>
                </div>
              </div>
            )}

            {/* Scroll sentinel */}
            <div ref={messagesEndRef} />
          </div>
        </div>
      </div>

      {/* Input bar — always pinned at bottom, visually distinct */}
      <div className="shrink-0 border-t border-border bg-card px-4 py-3">
        <form onSubmit={(e) => { e.preventDefault(); submit() }} className="flex items-end gap-2">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask me anything about your job search..."
            className={cn(
              "flex-1 min-h-[40px] max-h-[120px] resize-none bg-background border-border",
              "focus-visible:ring-1 focus-visible:ring-primary/50 text-sm",
              compact && "text-xs"
            )}
            rows={1}
            disabled={isLoading}
          />
          <Button
            type="submit"
            size="icon"
            disabled={!canSend}
            className="shrink-0 h-10 w-10 rounded-xl bg-primary text-white hover:bg-primary/90 shadow-sm disabled:opacity-40"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </form>
        <p className="text-[10px] text-muted-foreground mt-2 text-center">
          Responses grounded in your verified evidence library
        </p>
      </div>
    </div>
  )
}
