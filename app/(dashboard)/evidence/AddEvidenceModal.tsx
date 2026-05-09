'use client'

import { useState, useTransition } from 'react'
import { addEvidence } from './actions'
import type { EvidenceRecord } from '@/lib/types'

const SOURCE_TYPE_OPTIONS: Array<{ value: EvidenceRecord['source_type']; label: string }> = [
  { value: 'work_experience', label: 'Work Experience' },
  { value: 'project',         label: 'Project' },
  { value: 'portfolio_entry', label: 'Portfolio Entry' },
  { value: 'shipped_product', label: 'Shipped Product' },
  { value: 'live_site',       label: 'Live Site' },
  { value: 'achievement',     label: 'Achievement' },
  { value: 'certification',   label: 'Certification' },
  { value: 'publication',     label: 'Publication' },
  { value: 'open_source',     label: 'Open Source' },
  { value: 'education',       label: 'Education' },
  { value: 'skill',           label: 'Skill' },
]

const EMPTY_FORM = {
  source_type: 'work_experience' as EvidenceRecord['source_type'],
  source_title: '',
  role_name: '',
  company_name: '',
  date_range: '',
  responsibilities: '',
  tools_used: '',
  outcomes: '',
}

export default function AddEvidenceModal({
  onClose,
  onAdded,
}: {
  onClose: () => void
  onAdded: () => void
}) {
  const [form, setForm] = useState(EMPTY_FORM)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.source_title.trim()) { setError('Title is required'); return }
    setError(null)
    startTransition(async () => {
      const result = await addEvidence({
        source_type:    form.source_type,
        source_title:   form.source_title.trim(),
        role_name:      form.role_name.trim() || null,
        company_name:   form.company_name.trim() || null,
        date_range:     form.date_range.trim() || null,
        responsibilities: form.responsibilities.trim()
          ? form.responsibilities.split('\n').map(s => s.trim()).filter(Boolean)
          : null,
        tools_used: form.tools_used.trim()
          ? form.tools_used.split(',').map(s => s.trim()).filter(Boolean)
          : null,
        outcomes: form.outcomes.trim()
          ? form.outcomes.split('\n').map(s => s.trim()).filter(Boolean)
          : null,
      })
      if (result.success) {
        onAdded()
      } else {
        setError(result.error ?? 'Failed to save.')
      }
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-xl border border-border bg-background shadow-xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="text-base font-semibold">Add Evidence</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground text-lg leading-none">✕</button>
        </div>
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4 max-h-[70vh] overflow-y-auto">
          <div>
            <label className="block text-xs font-medium mb-1">Type</label>
            <select
              name="source_type"
              value={form.source_type}
              onChange={handleChange}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
            >
              {SOURCE_TYPE_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          <Field label="Title *" name="source_title" value={form.source_title} onChange={handleChange} placeholder="e.g. Product Owner at Ingram Micro" />
          <Field label="Company / Organization" name="company_name" value={form.company_name} onChange={handleChange} />
          <Field label="Role / Position" name="role_name" value={form.role_name} onChange={handleChange} />
          <Field label="Date range" name="date_range" value={form.date_range} onChange={handleChange} placeholder="e.g. Nov 2022 – Dec 2024" />

          <div>
            <label className="block text-xs font-medium mb-1">Responsibilities (one per line)</label>
            <textarea
              name="responsibilities"
              value={form.responsibilities}
              onChange={handleChange}
              rows={3}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>

          <Field label="Tools / Skills (comma-separated)" name="tools_used" value={form.tools_used} onChange={handleChange} placeholder="e.g. Python, Jira, SAP" />

          <div>
            <label className="block text-xs font-medium mb-1">Outcomes (one per line)</label>
            <textarea
              name="outcomes"
              value={form.outcomes}
              onChange={handleChange}
              rows={3}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>

          {error && <p className="text-xs text-red-600">{error}</p>}

          <div className="flex items-center justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="text-sm text-muted-foreground hover:underline">
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="rounded-md bg-black text-white px-4 py-2 text-sm font-medium hover:bg-gray-800 disabled:opacity-50"
            >
              {isPending ? 'Saving…' : 'Add evidence'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function Field({ label, name, value, onChange, placeholder }: {
  label: string; name: string; value: string
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  placeholder?: string
}) {
  return (
    <div>
      <label className="block text-xs font-medium mb-1">{label}</label>
      <input
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
      />
    </div>
  )
}
