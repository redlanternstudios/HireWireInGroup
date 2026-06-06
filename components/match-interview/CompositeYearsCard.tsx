"use client"

import { useState } from "react"
import { Plus, Trash2 } from "lucide-react"
import { cn } from "@/lib/utils"
import type { YearsEntry } from "./types"

function totalYears(entries: YearsEntry[]) {
  return entries.reduce((acc, entry) => {
    const end = entry.endYear === "present" ? new Date().getFullYear() : entry.endYear
    return acc + Math.max(0, end - entry.startYear)
  }, 0)
}

export function CompositeYearsCard({
  entries: initialEntries,
  targetYears,
  onUpdate,
  className,
}: {
  entries: YearsEntry[]
  targetYears?: number
  onUpdate: (entries: YearsEntry[]) => void
  className?: string
}) {
  const [entries, setEntries] = useState<YearsEntry[]>(initialEntries)
  const currentYear = new Date().getFullYear()
  const total = totalYears(entries)
  const meetsTarget = targetYears ? total >= targetYears : null

  function updateEntry(id: string, field: keyof YearsEntry, value: string) {
    const next = entries.map((e) => {
      if (e.id !== id) return e
      if (field === "startYear" || field === "endYear") {
        const parsed = value === "present" ? "present" : parseInt(value, 10)
        return { ...e, [field]: parsed }
      }
      return { ...e, [field]: value }
    })
    setEntries(next)
    onUpdate(next)
  }

  function addEntry() {
    const next = [
      ...entries,
      {
        id: crypto.randomUUID(),
        role: "",
        company: "",
        startYear: currentYear - 2,
        endYear: "present" as const,
      },
    ]
    setEntries(next)
    onUpdate(next)
  }

  function removeEntry(id: string) {
    const next = entries.filter((e) => e.id !== id)
    setEntries(next)
    onUpdate(next)
  }

  return (
    <div className={cn("ml-9 rounded-xl border border-border bg-card shadow-sm overflow-hidden", className)}>
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border/60 bg-muted/30 px-4 py-2.5">
        <p className="text-[11px] font-bold uppercase tracking-wider text-foreground">
          Years of experience
        </p>
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "rounded-full px-2.5 py-0.5 text-[11px] font-bold border",
              meetsTarget === true
                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                : meetsTarget === false
                  ? "bg-rose-50 text-rose-700 border-rose-200"
                  : "bg-muted text-muted-foreground border-border",
            )}
          >
            {total} yr{total !== 1 ? "s" : ""}
            {targetYears ? ` / ${targetYears}+ needed` : " total"}
          </span>
        </div>
      </div>

      {/* Entries */}
      <div className="divide-y divide-border/50">
        {entries.map((entry) => (
          <div key={entry.id} className="flex items-start gap-2.5 px-4 py-3">
            <div className="flex-1 grid grid-cols-2 gap-2">
              <input
                value={entry.role}
                onChange={(e) => updateEntry(entry.id, "role", e.target.value)}
                placeholder="Role title"
                className="rounded-lg border border-border bg-background px-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/20"
              />
              <input
                value={entry.company}
                onChange={(e) => updateEntry(entry.id, "company", e.target.value)}
                placeholder="Company"
                className="rounded-lg border border-border bg-background px-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/20"
              />
              <input
                type="number"
                value={entry.startYear}
                min={1980}
                max={currentYear}
                onChange={(e) => updateEntry(entry.id, "startYear", e.target.value)}
                placeholder="Start year"
                className="rounded-lg border border-border bg-background px-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/20"
              />
              <select
                value={entry.endYear}
                onChange={(e) => updateEntry(entry.id, "endYear", e.target.value)}
                className="rounded-lg border border-border bg-background px-3 py-1.5 text-xs text-foreground focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/20"
              >
                <option value="present">Present</option>
                {Array.from({ length: currentYear - 1979 }, (_, i) => currentYear - i).map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
            <button
              onClick={() => removeEntry(entry.id)}
              className="mt-1 rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              aria-label="Remove entry"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
      </div>

      {/* Add entry */}
      <div className="border-t border-border/50 px-4 py-2.5">
        <button
          onClick={addEntry}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:text-primary/80 transition-colors"
        >
          <Plus className="h-3.5 w-3.5" />
          Add another role
        </button>
      </div>
    </div>
  )
}
