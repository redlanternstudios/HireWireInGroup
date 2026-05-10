"use client"

<<<<<<< HEAD
import { useState, useMemo, useRef, useEffect } from "react"
import { useChat } from "@ai-sdk/react"
import { TextStreamChatTransport, UIMessage, isTextUIPart } from "ai"
=======
import { useRef, useEffect, useState } from "react"
import { useChat, Chat } from "@ai-sdk/react"
import { DefaultChatTransport } from "ai"
>>>>>>> 7e1a8af916b56410048e0bfccadd90f00d881991
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
  HelpCircle,
  Mic,
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

const promptClusters = [
  {
    group: "Pipeline",
    icon: Target,
    prompts: [
      { label: "Review my pipeline",         prompt: "What should I focus on next in my job search? Review my pipeline and suggest the best next action." },
      { label: "Which job should I prioritize?", prompt: "Looking at my pipeline, which job should I prioritize and why?" },
      { label: "Why is nothing ready?",      prompt: "Why aren't any of my jobs in the Ready to Apply queue? What's blocking me?" },
    ],
  },
  {
    group: "Resume & package",
    icon: FileText,
    prompts: [
      { label: "Improve my resume",          prompt: "Can you review my evidence library and suggest how I could strengthen my resume?" },
      { label: "Review flagged claims",      prompt: "Are there any claims in my application materials that need stronger evidence backing?" },
      { label: "Help me tailor this package", prompt: "Help me tailor my application package to better match a specific job's requirements." },
    ],
  },
  {
    group: "Career Context",
    icon: Lightbulb,
    prompts: [
      { label: "Build my evidence",          prompt: "Help me add to my evidence library. Ask me about my achievements and experiences." },
      { label: "What proof am I missing?",   prompt: "What types of evidence or achievements am I missing that could strengthen my applications?" },
      { label: "Stronger bullets",           prompt: "Help me turn my experience into stronger, more impactful achievement bullets." },
    ],
  },
  {
    group: "Interview & follow up",
    icon: Mic,
    prompts: [
      { label: "Interview prep tips",        prompt: "I have an upcoming interview. Can you help me prepare with targeted tips?" },
      { label: "Draft a recruiter follow up", prompt: "Help me draft a professional follow-up message to a recruiter." },
      { label: "What to say after applying", prompt: "I just applied for a job. What should I do next and what should I say if I follow up?" },
    ],
  },
]

<<<<<<< HEAD
function getMessageText(message: UIMessage): string {
  return (message.parts ?? []).filter(isTextUIPart).map(p => p.text).join('')
}

export function CoachChat({ className, conversationId, compact = false, onClose, jobContext, gapContext, initialMessage }: CoachChatProps) {
=======
export function CoachChat({ className, compact = false, jobContext, gapContext, initialMessage }: CoachChatProps) {
>>>>>>> 7e1a8af916b56410048e0bfccadd90f00d881991
  const scrollRef = useRef<HTMLDivElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const initialMessageSent = useRef(false)
<<<<<<< HEAD
  const [input, setInput] = useState('')

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const transport = useMemo(() => new TextStreamChatTransport({
    api: '/api/coach',
    body: {
      ...(jobContext ? { jobContext } : {}),
      ...(gapContext ? { gapContext } : {}),
    },
  }), [])

  const { messages, sendMessage, status, error } = useChat({
    transport,
    onError: (err) => {
      console.error("[v0] Coach useChat error:", err)
    },
  })

  const isLoading = status === 'submitted' || status === 'streaming'

  // Debug logging
  useEffect(() => {
    console.log("[v0] CoachChat mounted", {
      hasJobContext: !!jobContext,
      hasGapContext: !!gapContext,
      hasInitialMessage: !!initialMessage
    })
  }, [])
=======
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
>>>>>>> 7e1a8af916b56410048e0bfccadd90f00d881991

  const isLoading = status === "streaming" || status === "submitted"

  // Fire initial message once on mount
  useEffect(() => {
    if (initialMessage && !initialMessageSent.current && messages.length === 0) {
      initialMessageSent.current = true
<<<<<<< HEAD
      sendMessage({ text: initialMessage })
    }
  }, [initialMessage, messages.length, sendMessage])
=======
      sendMessage({ role: "user", parts: [{ type: "text", text: initialMessage }] })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
>>>>>>> 7e1a8af916b56410048e0bfccadd90f00d881991

  // Auto-scroll to bottom on new messages / streaming updates
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, status])

<<<<<<< HEAD
  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return
    console.log("[v0] CoachChat submitting message:", input.substring(0, 50))
    sendMessage({ text: input })
    setInput('')
=======
  const submit = () => {
    const text = input.trim()
    if (!text || isLoading) return
    setInput("")
    sendMessage({ role: "user", parts: [{ type: "text", text }] })
>>>>>>> 7e1a8af916b56410048e0bfccadd90f00d881991
  }

  const handleQuickAction = (prompt: string) => {
    if (isLoading) return
<<<<<<< HEAD
    sendMessage({ text: prompt })
=======
    sendMessage({ role: "user", parts: [{ type: "text", text: prompt }] })
>>>>>>> 7e1a8af916b56410048e0bfccadd90f00d881991
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      submit()
    }
  }

  const canSend = input.trim().length > 0 && !isLoading

  return (
<<<<<<< HEAD
    <div className={cn("flex flex-col h-full", className)}>
      {/* Messages area */}
      <ScrollArea
        ref={scrollRef as React.RefObject<HTMLDivElement>}
        className={cn("flex-1 px-4", compact ? "py-2" : "py-4")}
      >
        {/* Welcome message if no messages */}
        {messages.length === 0 && (
          <div className={cn("space-y-4", compact ? "py-2" : "py-6")}>
            <div className="flex items-start gap-3">
              <Avatar className="h-8 w-8 bg-primary/10">
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
                      {jobContext.score !== null && jobContext.score !== undefined && ` (Fit: ${jobContext.score}%)`}
                    </p>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    What would you like to work on today?
                  </p>
                )}
              </div>
            </div>

            {/* Quick actions grid */}
            <div className={cn(
              "grid gap-2",
              compact ? "grid-cols-1" : "grid-cols-2"
            )}>
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

        {/* Message list */}
        <div className="space-y-4">
          {messages.map((message) => {
            const isUser = message.role === "user"
            const text = getMessageText(message)

            if (!text) return null

            return (
              <div
                key={message.id}
                className={cn(
                  "flex items-start gap-3",
                  isUser && "flex-row-reverse"
                )}
              >
                <Avatar className={cn(
                  "h-8 w-8",
                  isUser ? "bg-muted" : "bg-primary/10"
                )}>
                  <AvatarFallback className={cn(
                    isUser ? "bg-muted text-muted-foreground" : "bg-primary text-white"
                  )}>
                    {isUser ? <User className="h-4 w-4" /> : <Sparkles className="h-4 w-4" />}
                  </AvatarFallback>
                </Avatar>
                <div className={cn(
                  "flex-1 space-y-1",
                  isUser && "text-right"
                )}>
                  <p className="text-xs font-medium text-muted-foreground">
                    {isUser ? "You" : "HireWire Coach"}
                  </p>
                  <div className={cn(
                    "prose prose-sm max-w-none",
                    isUser ? "text-right" : "text-left",
                    "[&>p]:mb-2 [&>ul]:mb-2 [&>ol]:mb-2"
                  )}>
                    {isUser ? (
                      <p className="text-sm">{text}</p>
=======
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
>>>>>>> 7e1a8af916b56410048e0bfccadd90f00d881991
                    ) : (
                      <p className="text-sm text-muted-foreground mt-1">What would you like to work on today?</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Grouped prompt clusters */}
              <div className="pl-11 space-y-3">
                {promptClusters.map((cluster) => (
                  <div key={cluster.group}>
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <cluster.icon className="h-3 w-3 text-muted-foreground" />
                      <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                        {cluster.group}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {cluster.prompts.map((p) => (
                        <button
                          key={p.label}
                          onClick={() => handleQuickAction(p.prompt)}
                          disabled={isLoading}
                          className={cn(
                            "px-3 py-1.5 rounded-lg text-left transition-all text-xs font-medium",
                            "bg-card border border-border text-foreground",
                            "hover:border-primary/40 hover:bg-primary/6 hover:text-primary",
                            "disabled:opacity-40 disabled:cursor-not-allowed"
                          )}
                        >
                          {p.label}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

<<<<<<< HEAD
          {/* Error display */}
          {error && (
            <div className="flex items-start gap-3 p-3 bg-red-50 border border-red-200 rounded-lg mt-4">
              <div className="text-sm text-red-700">
                <p className="font-medium">Coach Error</p>
                <p className="text-red-600">{error.message || "Failed to get response. Please try again."}</p>
=======
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
>>>>>>> 7e1a8af916b56410048e0bfccadd90f00d881991
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
<<<<<<< HEAD
              "min-h-10 max-h-30 resize-none",
              compact && "text-sm"
=======
              "flex-1 min-h-[40px] max-h-[120px] resize-none bg-background border-border",
              "focus-visible:ring-1 focus-visible:ring-primary/50 text-sm",
              compact && "text-xs"
>>>>>>> 7e1a8af916b56410048e0bfccadd90f00d881991
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
