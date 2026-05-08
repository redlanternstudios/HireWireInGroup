"use client"

import { useState, useRef, useEffect } from "react"
import { useChat } from "@ai-sdk/react"
import { TextStreamChatTransport } from "ai"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"
import { Send, Sparkles, User, Loader2, Lightbulb, FileText, Target, HelpCircle } from "lucide-react"
import ReactMarkdown from "react-markdown"

interface CoachChatProps {
  className?: string
  compact?: boolean
}

const quickActions = [
  { label: "Review my pipeline", icon: Target, prompt: "What should I focus on next in my job search? Review my pipeline and suggest the best next action." },
  { label: "Interview prep tips", icon: HelpCircle, prompt: "I have an upcoming interview. Can you help me prepare? Give me your top tips." },
  { label: "Improve my resume", icon: FileText, prompt: "Can you review my evidence library and suggest how I could strengthen my resume?" },
  { label: "Build my evidence", icon: Lightbulb, prompt: "Help me add to my evidence library. Ask me about my achievements and experiences." },
]

function getMessageText(parts: Array<{ type: string; text?: string }> | undefined): string {
  if (!parts) return ""
  return parts.filter(p => p.type === "text").map(p => p.text ?? "").join("")
}

export function CoachChat({ className, compact = false }: CoachChatProps) {
  const [input, setInput] = useState("")
  const scrollRef = useRef<HTMLDivElement>(null)

  const { messages, sendMessage, status, error } = useChat({
    transport: new TextStreamChatTransport({ api: "/api/coach/chat" }),
  })

  const isLoading = status === "submitted" || status === "streaming"

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  const handleSend = () => {
    const trimmed = input.trim()
    if (!trimmed || isLoading) return
    sendMessage({ text: trimmed })
    setInput("")
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className={cn("flex flex-col h-full", className)}>
      {/* Messages */}
      <div
        ref={scrollRef}
        className={cn("flex-1 overflow-y-auto space-y-4", compact ? "px-4 py-2" : "px-4 py-4")}
      >
        {messages.length === 0 && (
          <div className={cn("space-y-4", compact ? "py-2" : "py-4")}>
            <div className="flex items-start gap-3">
              <Avatar className="h-8 w-8 shrink-0">
                <AvatarFallback className="bg-black text-white">
                  <Sparkles className="h-4 w-4" />
                </AvatarFallback>
              </Avatar>
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground">HireWire Coach</p>
                <p className="text-sm">
                  Hey! I&apos;m your career coach. I can help with job search strategy, interview prep, building your evidence library, and improving your application materials.
                </p>
                <p className="text-sm text-muted-foreground">What would you like to work on?</p>
              </div>
            </div>

            <div className={cn("grid gap-2", compact ? "grid-cols-1" : "grid-cols-2")}>
              {quickActions.map((action) => (
                <Button
                  key={action.label}
                  variant="outline"
                  className="justify-start gap-2 h-auto py-2 px-3 text-left"
                  onClick={() => { sendMessage({ text: action.prompt }) }}
                  disabled={isLoading}
                >
                  <action.icon className="h-4 w-4 text-primary shrink-0" />
                  <span className="text-xs">{action.label}</span>
                </Button>
              ))}
            </div>
          </div>
        )}

        {messages.map((message) => {
          const isUser = message.role === "user"
          const text = getMessageText(message.parts)
          if (!text) return null

          return (
            <div key={message.id} className={cn("flex items-start gap-3", isUser && "flex-row-reverse")}>
              <Avatar className="h-8 w-8 shrink-0">
                <AvatarFallback className={cn(isUser ? "bg-muted text-muted-foreground" : "bg-black text-white")}>
                  {isUser ? <User className="h-4 w-4" /> : <Sparkles className="h-4 w-4" />}
                </AvatarFallback>
              </Avatar>
              <div className={cn("flex-1 min-w-0 space-y-0.5", isUser && "text-right")}>
                <p className="text-xs font-medium text-muted-foreground">
                  {isUser ? "You" : "HireWire Coach"}
                </p>
                {isUser ? (
                  <p className="text-sm">{text}</p>
                ) : (
                  <div className="prose prose-sm max-w-none text-left [&>p]:text-sm [&>p]:mb-2 [&>ul]:text-sm [&>ul]:mb-2 [&>ol]:text-sm [&>li]:mb-1">
                    <ReactMarkdown>{text}</ReactMarkdown>
                  </div>
                )}
              </div>
            </div>
          )
        })}

        {isLoading && (
          <div className="flex items-start gap-3">
            <Avatar className="h-8 w-8 shrink-0">
              <AvatarFallback className="bg-black text-white">
                <Sparkles className="h-4 w-4" />
              </AvatarFallback>
            </Avatar>
            <div className="flex items-center gap-2 py-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm text-muted-foreground">Thinking…</span>
            </div>
          </div>
        )}

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
            {error.message || "Failed to get a response. Please try again."}
          </div>
        )}
      </div>

      {/* Input */}
      <div className={cn("border-t bg-background shrink-0", compact ? "p-2" : "p-4")}>
        <div className="flex gap-2">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask anything about your job search…"
            className={cn("min-h-[40px] max-h-[120px] resize-none", compact && "text-sm")}
            rows={1}
            disabled={isLoading}
          />
          <Button
            type="button"
            size="icon"
            disabled={!input.trim() || isLoading}
            onClick={handleSend}
            className="shrink-0"
          >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>
      </div>
    </div>
  )
}
