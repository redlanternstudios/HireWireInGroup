import React from 'react'

interface EmptyWithActionProps {
  message: string
  actionLabel: string
  onAction: () => void
}

export function EmptyWithAction({ message, actionLabel, onAction }: EmptyWithActionProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <p className="text-muted-foreground text-sm mb-2">{message}</p>
      <button className="text-sm text-primary underline" onClick={onAction}>
        {actionLabel}
      </button>
    </div>
  )
}
