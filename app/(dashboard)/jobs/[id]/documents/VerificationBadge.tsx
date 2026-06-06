'use client'

import { CheckCircle, AlertTriangle, XCircle } from 'lucide-react'

export type Verdict = 'verified' | 'unverified' | 'contested' | null

interface VerificationBadgeProps {
  verdict: Verdict
  onClick?: () => void
  compact?: boolean
  evidenceCount?: number
}

const VERDICT_CONFIG = {
  verified: {
    icon: CheckCircle,
    label: 'Verified',
    className: 'text-green-600 bg-green-50 border-green-200 hover:bg-green-100',
    iconClass: 'text-green-500',
  },
  unverified: {
    icon: AlertTriangle,
    label: 'Unverified',
    className: 'text-amber-600 bg-amber-50 border-amber-200 hover:bg-amber-100',
    iconClass: 'text-amber-500',
  },
  contested: {
    icon: XCircle,
    label: 'Contested',
    className: 'text-red-600 bg-red-50 border-red-200 hover:bg-red-100',
    iconClass: 'text-red-500',
  },
}

export default function VerificationBadge({
  verdict,
  onClick,
  compact = false,
  evidenceCount,
}: VerificationBadgeProps) {
  if (!verdict) return null

  const config = VERDICT_CONFIG[verdict]
  const Icon = config.icon
  const tooltip = evidenceCount != null
    ? `${config.label} · Backed by ${evidenceCount} evidence item${evidenceCount !== 1 ? 's' : ''}`
    : config.label

  return (
    <button
      type="button"
      onClick={onClick}
      title={tooltip}
      className={`inline-flex items-center gap-1 rounded border px-1.5 py-0.5 text-xs font-medium transition-colors ${config.className} ${onClick ? 'cursor-pointer' : 'cursor-default'}`}
    >
      <Icon className={`h-3 w-3 shrink-0 ${config.iconClass}`} />
      {!compact && <span>{config.label}</span>}
    </button>
  )
}
