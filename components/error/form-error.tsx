import React from 'react'

interface FormErrorProps {
  message: string
  field?: string
  correlationId?: string
}

export function FormError({ message, field, correlationId }: FormErrorProps) {
  return (
    <div className="text-destructive text-xs mt-1">
      {field && <span className="font-semibold">{field}: </span>}
      {message}
      {correlationId && (
        <span className="ml-2 text-muted-foreground select-all">({correlationId})</span>
      )}
    </div>
  )
}
