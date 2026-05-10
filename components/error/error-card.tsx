import React from 'react'

interface ErrorCardProps {
  title: string
  message: string
  actionLabel?: string
  onAction?: () => void
  secondaryActionLabel?: string
  onSecondaryAction?: () => void
  severity?: 'info' | 'warning' | 'error' | 'critical'
  correlationId?: string
  retryable?: boolean
}

export function ErrorCard({
  title,
  message,
  actionLabel,
  onAction,
  secondaryActionLabel,
  onSecondaryAction,
  severity = 'error',
  correlationId,
  retryable,
}: ErrorCardProps) {
  return (
    <div className={`rounded-xl p-6 bg-background border shadow-md max-w-lg mx-auto my-8 ${severity === 'critical' ? 'border-destructive' : 'border-muted'}`}>
      <h2 className="text-lg font-semibold mb-2 text-foreground">{title}</h2>
      <p className="mb-4 text-muted-foreground">{message}</p>
      <div className="flex gap-2 mb-2">
        {actionLabel && (
          <button className="btn btn-primary" onClick={onAction}>
            {actionLabel}
          </button>
        )}
        {secondaryActionLabel && (
          <button className="btn btn-secondary" onClick={onSecondaryAction}>
            {secondaryActionLabel}
          </button>
        )}
      </div>
      {correlationId && (
        <div className="text-xs text-muted-foreground mt-2 select-all">
          Error ID: <span>{correlationId}</span>
        </div>
      )}
      {retryable && (
        <div className="text-xs text-muted-foreground mt-1">You can try again.</div>
      )}
    </div>
  )
}
