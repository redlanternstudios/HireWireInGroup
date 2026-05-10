import React from 'react'

interface InlineErrorProps {
  message: string
  correlationId?: string
}

export function InlineError({ message, correlationId }: InlineErrorProps) {
  return (
    <div className="text-destructive text-sm flex items-center gap-2">
      <span>{message}</span>
      {correlationId && (
        <span className="text-xs text-muted-foreground select-all">({correlationId})</span>
      )}
    </div>
  )
}
