"use client"

import { useEffect, useRef } from "react"
import { cn } from "@/lib/utils"
import { CoachMessageBubble, UserMessageBubble } from "./MessageBubbles"
import { QuickReplyChips } from "./QuickReplyChips"
import { EvidenceSuggestionCard } from "./EvidenceSuggestionCard"
import { EvidenceSummaryCard } from "./EvidenceSummaryCard"
import { CompositeYearsCard } from "./CompositeYearsCard"
import type {
  InterviewMessage,
  EvidenceAction,
  SuggestedEvidence,
  YearsEntry,
} from "./types"

export function CoachChatThread({
  messages,
  isLoading,
  isSaving,
  onQuickReply,
  onEvidenceAction,
  onConfirmProof,
  onSkipClaim,
  onYearsUpdate,
  className,
}: {
  messages: InterviewMessage[]
  isLoading: boolean
  isSaving: boolean
  onQuickReply: (value: string) => void
  onEvidenceAction: (action: EvidenceAction, evidence: SuggestedEvidence) => void
  onConfirmProof: (messageId: string) => void
  onSkipClaim: () => void
  onYearsUpdate: (messageId: string, entries: YearsEntry[]) => void
  className?: string
}) {
  const bottomRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, isLoading])

  return (
    <div className={cn("flex flex-col gap-4 overflow-y-auto px-5 py-4", className)}>
      {messages.map((msg, i) => {
        const isLast = i === messages.length - 1

        if (msg.role === "user") {
          return <UserMessageBubble key={msg.id} content={msg.content ?? ""} />
        }

        // Coach messages with optional attachments below
        return (
          <div key={msg.id} className="flex flex-col gap-2.5">
            <CoachMessageBubble content={msg.content} />

            {/* Quick reply chips — only on last coach message */}
            {isLast && msg.quickReplies?.length ? (
              <QuickReplyChips
                replies={msg.quickReplies}
                onSelect={onQuickReply}
                disabled={isLoading || isSaving}
              />
            ) : null}

            {/* Evidence suggestion cards */}
            {msg.suggestedEvidence?.map((ev) => (
              <EvidenceSuggestionCard
                key={ev.id}
                evidence={ev}
                onAction={onEvidenceAction}
                disabled={isLoading || isSaving}
              />
            ))}

            {/* Composite years card */}
            {msg.type === "composite_years" && msg.yearsEntries !== undefined && (
              <CompositeYearsCard
                entries={msg.yearsEntries}
                onUpdate={(entries) => onYearsUpdate(msg.id, entries)}
              />
            )}

            {/* Proof summary card — appears as the final step before save */}
            {msg.type === "proof_summary" && msg.proofSummary && (
              <EvidenceSummaryCard
                summary={msg.proofSummary.text}
                confidence={msg.proofSummary.confidence}
                gapNotes={msg.proofSummary.gapNotes}
                onConfirm={() => onConfirmProof(msg.id)}
                onSkip={onSkipClaim}
                isSaving={isSaving}
              />
            )}
          </div>
        )
      })}

      {/* Streaming indicator */}
      {isLoading && (
        <CoachMessageBubble isLoading />
      )}

      <div ref={bottomRef} className="h-1" />
    </div>
  )
}
