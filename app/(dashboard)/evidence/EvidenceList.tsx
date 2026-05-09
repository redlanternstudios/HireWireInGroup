'use client'

import { useState, useRef } from 'react'
import EvidenceCard from './EvidenceCard'
import AddEvidenceModal from './AddEvidenceModal'
import { cn } from '@/lib/utils'
import type { EvidenceRecord } from '@/lib/types'

// ─── Tab configuration ────────────────────────────────────────────────────────

const TABS = [
  { id: 'experience',     label: 'Experience',        types: ['work_experience'] },
  { id: 'skills',         label: 'Skills',            types: ['skill'] },
  { id: 'projects',       label: 'Projects',          types: ['project', 'shipped_product', 'portfolio_entry', 'live_site', 'open_source'] },
  { id: 'education',      label: 'Education',         types: ['education'] },
  { id: 'certifications', label: 'Certifications',    types: ['certification'] },
  { id: 'achievements',   label: 'Achievements',      types: ['achievement', 'publication'] },
  { id: 'documents',      label: 'Documents',         types: [] },
] as const

type TabId = typeof TABS[number]['id']
type MemoryFilter = 'all' | 'core' | 'extended'

export interface SourceResume {
  id: string
  file_name: string
  file_type: string
  created_at: string
}

// ─── Core detection ───────────────────────────────────────────────────────────

function isCore(item: EvidenceRecord, coreSet: Set<string>): boolean {
  // Core = high confidence AND proven in generation, OR manually approved
  return (item.confidence_level === 'high' && coreSet.has(item.id)) || item.is_user_approved
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function EvidenceList({
  initialItems,
  coreIds,
  sourceResumes,
}: {
  initialItems: EvidenceRecord[]
  coreIds: string[]
  sourceResumes: SourceResume[]
}) {
  const [items, setItems] = useState(initialItems)
  const [showModal, setShowModal] = useState(false)
  const [activeTab, setActiveTab] = useState<TabId>('experience')
  const [memoryFilter, setMemoryFilter] = useState<MemoryFilter>('all')
  const [collapsedCompanies, setCollapsedCompanies] = useState<Set<string>>(new Set())
  const [importing, setImporting] = useState(false)
  const [importFeedback, setImportFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const coreSet = new Set(coreIds)

  function handleArchived(id: string) {
    setItems(prev => prev.filter(item => item.id !== id))
  }

  function handleAdded() {
    window.location.reload()
  }

  async function handleImportCSV(e: React.ChangeEvent<HTMLInputElement>) {
    setImportFeedback(null)
    const file = e.target.files?.[0]
    if (!file) return
    setImporting(true)
    const formData = new FormData()
    formData.append('file', file)
    try {
      const res = await fetch('/api/evidence/import', { method: 'POST', body: formData })
      const data = await res.json()
      if (!res.ok) {
        setImportFeedback({ type: 'error', message: data.error || 'Import failed' })
      } else {
        setImportFeedback({ type: 'success', message: `Imported ${data.imported} item${data.imported !== 1 ? 's' : ''}.` })
        window.location.reload()
      }
    } catch {
      setImportFeedback({ type: 'error', message: 'Import failed. Please try again.' })
    } finally {
      setImporting(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  function toggleCompany(company: string) {
    setCollapsedCompanies(prev => {
      const next = new Set(prev)
      next.has(company) ? next.delete(company) : next.add(company)
      return next
    })
  }

  // Items for current tab (before memory filter)
  const tab = TABS.find(t => t.id === activeTab)!
  const tabItems = tab.types.length > 0
    ? items.filter(i => (tab.types as readonly string[]).includes(i.source_type))
    : []

  // Apply Core/Extended filter
  const filteredItems = memoryFilter === 'all'
    ? tabItems
    : memoryFilter === 'core'
    ? tabItems.filter(i => isCore(i, coreSet))
    : tabItems.filter(i => !isCore(i, coreSet))

  function tabCount(t: typeof TABS[number]) {
    if (t.types.length === 0) return sourceResumes.length
    return items.filter(i => (t.types as readonly string[]).includes(i.source_type)).length
  }

  return (
    <>
      {/* ── Toolbar ───────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:justify-between">
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => window.open('/api/evidence/export', '_blank')}
            className="rounded-md border border-border px-3 py-1.5 text-xs font-medium hover:bg-muted transition-colors"
          >
            Export CSV
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={importing}
            className="rounded-md border border-border px-3 py-1.5 text-xs font-medium hover:bg-muted transition-colors disabled:opacity-50"
          >
            {importing ? 'Importing…' : 'Import CSV'}
          </button>
          <input ref={fileInputRef} type="file" accept=".csv" className="hidden" onChange={handleImportCSV} />
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="rounded-md bg-black px-4 py-1.5 text-xs font-medium text-white hover:bg-gray-800 transition-colors w-fit"
        >
          + Add evidence
        </button>
      </div>

      {importFeedback && (
        <p className={cn('text-xs', importFeedback.type === 'error' ? 'text-red-600' : 'text-green-700')}>
          {importFeedback.message}
        </p>
      )}

      {/* ── Tab bar ───────────────────────────────────────────────────────── */}
      <div className="border-b border-border">
        <div className="flex overflow-x-auto">
          {TABS.map(t => {
            const count = tabCount(t)
            const active = activeTab === t.id
            return (
              <button
                key={t.id}
                onClick={() => { setActiveTab(t.id); setMemoryFilter('all') }}
                className={cn(
                  'relative shrink-0 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap',
                  active
                    ? 'border-foreground text-foreground'
                    : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
                )}
              >
                {t.label}
                {count > 0 && (
                  <span className={cn(
                    'ml-1.5 inline-flex items-center justify-center rounded-full px-1.5 text-[10px] font-semibold min-w-4.5',
                    active ? 'bg-foreground text-background' : 'bg-muted text-muted-foreground'
                  )}>
                    {count}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* ── Core / Extended toggle ─────────────────────────────────────────── */}
      {activeTab !== 'documents' && tabItems.length > 0 && (
        <div className="flex items-center gap-1 p-1 rounded-lg bg-muted w-fit">
          {(['all', 'core', 'extended'] as MemoryFilter[]).map(f => (
            <button
              key={f}
              onClick={() => setMemoryFilter(f)}
              className={cn(
                'px-3 py-1 rounded-md text-xs font-medium capitalize transition-colors',
                memoryFilter === f
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {f === 'core' ? '⚡ Core' : f === 'extended' ? 'Extended' : 'All'}
            </button>
          ))}
        </div>
      )}

      {/* ── Tab content ───────────────────────────────────────────────────── */}
      {activeTab === 'documents' ? (
        <DocumentsTab sourceResumes={sourceResumes} />
      ) : activeTab === 'experience' ? (
        <ExperienceTab
          items={filteredItems}
          coreSet={coreSet}
          collapsedCompanies={collapsedCompanies}
          onToggleCompany={toggleCompany}
          onArchived={handleArchived}
          memoryFilter={memoryFilter}
        />
      ) : (
        <FlatTab
          items={filteredItems}
          coreSet={coreSet}
          onArchived={handleArchived}
          memoryFilter={memoryFilter}
        />
      )}

      {showModal && (
        <AddEvidenceModal onClose={() => setShowModal(false)} onAdded={handleAdded} />
      )}
    </>
  )
}

// ─── Experience tab — grouped by company with collapsible accordions ──────────

function ExperienceTab({
  items,
  coreSet,
  collapsedCompanies,
  onToggleCompany,
  onArchived,
  memoryFilter,
}: {
  items: EvidenceRecord[]
  coreSet: Set<string>
  collapsedCompanies: Set<string>
  onToggleCompany: (company: string) => void
  onArchived: (id: string) => void
  memoryFilter: MemoryFilter
}) {
  if (items.length === 0) return <EmptyState filter={memoryFilter} />

  // Group by company_name, fallback label for blanks
  const grouped: Record<string, EvidenceRecord[]> = {}
  for (const item of items) {
    const key = item.company_name?.trim() || 'Independent / Other'
    if (!grouped[key]) grouped[key] = []
    grouped[key].push(item)
  }

  // Most items first
  const sorted = Object.entries(grouped).sort((a, b) => b[1].length - a[1].length)

  return (
    <div className="space-y-3">
      {sorted.map(([company, companyItems]) => {
        const collapsed = collapsedCompanies.has(company)
        const coreCount = companyItems.filter(i => isCore(i, coreSet)).length

        return (
          <div key={company} className="rounded-xl border border-border bg-card overflow-hidden">
            <button
              onClick={() => onToggleCompany(company)}
              className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-muted/40 transition-colors text-left"
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className="font-medium text-sm truncate">{company}</span>
                <span className="shrink-0 text-xs text-muted-foreground">
                  {companyItems.length} item{companyItems.length !== 1 ? 's' : ''}
                </span>
                {coreCount > 0 && (
                  <span className="shrink-0 inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                    ⚡ {coreCount} core
                  </span>
                )}
              </div>
              <span className="shrink-0 text-muted-foreground text-sm ml-3">
                {collapsed ? '›' : '⌄'}
              </span>
            </button>

            {!collapsed && (
              <div className="border-t border-border px-4 pt-3 pb-4 space-y-2.5">
                {companyItems.map(item => (
                  <div key={item.id} className="relative">
                    {isCore(item, coreSet) && (
                      <span className="absolute top-3 right-3 z-10 inline-flex items-center rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold text-primary">
                        ⚡ Core
                      </span>
                    )}
                    <EvidenceCard item={item} onArchived={onArchived} />
                  </div>
                ))}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

// ─── Flat tab — for skills, projects, education, etc. ────────────────────────

function FlatTab({
  items,
  coreSet,
  onArchived,
  memoryFilter,
}: {
  items: EvidenceRecord[]
  coreSet: Set<string>
  onArchived: (id: string) => void
  memoryFilter: MemoryFilter
}) {
  if (items.length === 0) return <EmptyState filter={memoryFilter} />

  return (
    <div className="space-y-2.5">
      {items.map(item => (
        <div key={item.id} className="relative">
          {isCore(item, coreSet) && (
            <span className="absolute top-3 right-3 z-10 inline-flex items-center rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold text-primary">
              ⚡ Core
            </span>
          )}
          <EvidenceCard item={item} onArchived={onArchived} />
        </div>
      ))}
    </div>
  )
}

// ─── Documents tab ────────────────────────────────────────────────────────────

function DocumentsTab({ sourceResumes }: { sourceResumes: SourceResume[] }) {
  if (sourceResumes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <p className="text-sm text-muted-foreground">No documents uploaded yet.</p>
        <a href="/onboarding" className="mt-2 text-sm text-primary underline">
          Upload a resume →
        </a>
      </div>
    )
  }

  return (
    <div className="space-y-2.5">
      {sourceResumes.map(doc => (
        <div key={doc.id} className="rounded-lg border border-border bg-card px-4 py-3 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">{doc.file_name}</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {doc.file_type?.toUpperCase() ?? 'FILE'} · Uploaded{' '}
              {new Date(doc.created_at).toLocaleDateString('en-US', {
                month: 'short', day: 'numeric', year: 'numeric',
              })}
            </p>
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyState({ filter }: { filter: MemoryFilter }) {
  if (filter !== 'all') {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <p className="text-sm text-muted-foreground">
          No {filter} memory items in this category.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="mt-2 text-sm text-primary underline"
        >
          Show all
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <p className="text-sm text-muted-foreground">Nothing here yet.</p>
      <a href="/onboarding" className="mt-2 text-sm text-primary underline">
        Upload a resume to get started →
      </a>
    </div>
  )
}
