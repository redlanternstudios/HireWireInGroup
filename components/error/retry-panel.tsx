import React from 'react'

interface RetryPanelProps {
  message: string
  onRetry: () => void
  correlationId?: string
}

export function RetryPanel({ message, onRetry, correlationId }: RetryPanelProps) {
  return (
    <div className="rounded-lg bg-muted p-4 flex flex-col items-center">
      <p className="mb-2 text-muted-foreground">{message}</p>
      <button className="btn btn-primary" onClick={onRetry}>
        Retry
      </button>
      {correlationId && (
        <div className="text-xs text-muted-foreground mt-2 select-all">
          Error ID: <span>{correlationId}</span>
        </div>
      )}
    </div>
  )
}
