"use client"

import { useEffect, useState, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Briefcase,
  GraduationCap,
  Wrench,
  Award,
  FolderOpen,
  Plus,
  Loader2,
  Trash2,
  Search,
  ChevronDown,
  ChevronRight,
  TrendingUp,
  Zap,
} from "lucide-react"

type SourceType = "work_experience" | "education" | "skill" | "certification" | "project"

interface EvidenceItem {
  id: string
  source_type: SourceType
  source_title: string
  role_name: string | null
  company_name: string | null
  date_range: string | null
  responsibilities: string[] | null
  tools_used: string[] | null
  outcomes: string[] | null
  approved_achievement_bullets: string[] | null
  proof_snippet: string | null
  confidence_level: string | null
  confidence_score: number | null
  role_family_tags: string[] | null
  industries: string[] | null
  is_active: boolean
  created_at: string
}

const SOURCE_TYPE_CONFIG: Record<SourceType, {
  label: string
  icon: React.ElementType
  accent: string
  iconBg: string
  description: string
}> = {
  work_experience: {
    label: "Work Experience",
    icon: Briefcase,
    accent: "text-blue-700",
    iconBg: "bg-blue-50 border-blue-200",
    description: "Roles, responsibilities, and achievements from past positions",
  },
  education: {
    label: "Education",
    icon: GraduationCap,
    accent: "text-emerald-700",
    iconBg: "bg-emerald-50 border-emerald-200",
    description: "Degrees, academic achievements, and coursework",
  },
  certification: {
    label: "Certifications",
    icon: Award,
    accent: "text-amber-700",
    iconBg: "bg-amber-50 border-amber-200",
    description: "Professional credentials and completed programs",
  },
  skill: {
    label: "Skills",
    icon: Wrench,
    accent: "text-violet-700",
    iconBg: "bg-violet-50 border-violet-200",
    description: "Technical and soft skills with demonstrated proficiency",
  },
  project: {
    label: "Projects",
    icon: FolderOpen,
    accent: "text-orange-700",
    iconBg: "bg-orange-50 border-orange-200",
    description: "Side projects, open source work, and portfolio pieces",
  },
}

const CONFIDENCE_CONFIG: Record<string, { label: string; color: string; dot: string }> = {
  high:   { label: "Strong",   color: "text-emerald-700", dot: "bg-emerald-500" },
  medium: { label: "Moderate", color: "text-amber-700",   dot: "bg-amber-500" },
  low:    { label: "Thin",     color: "text-rose-700",    dot: "bg-rose-400" },
}

const EMPTY_FORM = {
  source_type: "work_experience" as SourceType,
  source_title: "",
  role_name: "",
  company_name: "",
  date_range: "",
  responsibilities: "",
  tools_used: "",
  outcomes: "",
}

const SECTION_ORDER: SourceType[] = ["work_experience", "education", "certification", "skill", "project"]

export default function CareerContextPage() {
  const [items, setItems] = useState<EvidenceItem[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [collapsed, setCollapsed] = useState<Record<SourceType, boolean>>({
    work_experience: false,
    education: false,
    certification: false,
    skill: false,
    project: false,
  })

  const fetchEvidence = useCallback(async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data } = await supabase
      .from("evidence_library")
      .select(`
        id, source_type, source_title, role_name, company_name, date_range,
        responsibilities, tools_used, outcomes, approved_achievement_bullets,
        proof_snippet, confidence_level, confidence_score,
        role_family_tags, industries, is_active, created_at
      `)
      .eq("user_id", user.id)
      .eq("is_active", true)
      .order("created_at", { ascending: false })

    setItems(data || [])
    setLoading(false)
  }, [])

  useEffect(() => { fetchEvidence() }, [fetchEvidence])

  const handleAdd = async () => {
    if (!form.source_title.trim()) { setSaveError("Title is required"); return }
    setSaving(true)
    setSaveError(null)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error("Not authenticated")

      const { error } = await supabase.from("evidence_library").insert({
        user_id: user.id,
        source_type: form.source_type,
        source_title: form.source_title.trim(),
        role_name: form.role_name.trim() || null,
        company_name: form.company_name.trim() || null,
        date_range: form.date_range.trim() || null,
        responsibilities: form.responsibilities.trim()
          ? form.responsibilities.split("\n").map(s => s.trim()).filter(Boolean)
          : null,
        tools_used: form.tools_used.trim()
          ? form.tools_used.split(",").map(s => s.trim()).filter(Boolean)
          : null,
        outcomes: form.outcomes.trim()
          ? form.outcomes.split("\n").map(s => s.trim()).filter(Boolean)
          : null,
        confidence_level: "medium",
        evidence_weight: "medium",
        is_user_approved: true,
        is_active: true,
        priority_rank: 0,
      })
      if (error) throw error
      setForm(EMPTY_FORM)
      setDialogOpen(false)
      fetchEvidence()
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Failed to save")
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    setDeletingId(id)
    const supabase = createClient()
    await supabase.from("evidence_library").update({ is_active: false }).eq("id", id)
    setItems(prev => prev.filter(i => i.id !== id))
    setDeletingId(null)
  }

  const toggleSection = (type: SourceType) => {
    setCollapsed(prev => ({ ...prev, [type]: !prev[type] }))
  }

  const searchLower = search.toLowerCase()
  const filtered = items.filter(item =>
    !search ||
    item.source_title?.toLowerCase().includes(searchLower) ||
    item.company_name?.toLowerCase().includes(searchLower) ||
    item.role_name?.toLowerCase().includes(searchLower) ||
    (item.tools_used || []).some(t => t.toLowerCase().includes(searchLower)) ||
    (item.role_family_tags || []).some(t => t.toLowerCase().includes(searchLower))
  )

  const grouped = SECTION_ORDER.reduce((acc, type) => {
    acc[type] = filtered.filter(i => i.source_type === type)
    return acc
  }, {} as Record<SourceType, EvidenceItem[]>)

  const totalActive = SECTION_ORDER.filter(t => grouped[t].length > 0).length
  const highConfidenceCount = items.filter(i => i.confidence_level === "high").length

  return (
    <div className="hw-page">

      {/* Header */}
      <div className="hw-page-header">
        <div>
          <h1 className="hw-page-title">Career Context</h1>
          <p className="hw-page-subtitle">
            {items.length} proof point{items.length !== 1 ? "s" : ""} across {totalActive} categor{totalActive !== 1 ? "ies" : "y"} — the evidence base behind every analysis and document.
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="hw-btn-primary gap-1.5 shrink-0">
              <Plus className="h-3.5 w-3.5" />
              Add entry
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Add Career Context</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-2">
              <div className="space-y-1.5">
                <Label>Category</Label>
                <Select value={form.source_type} onValueChange={v => setForm(f => ({ ...f, source_type: v as SourceType }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(SOURCE_TYPE_CONFIG).map(([key, cfg]) => (
                      <SelectItem key={key} value={key}>{cfg.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Title <span className="text-destructive">*</span></Label>
                <Input value={form.source_title} onChange={e => setForm(f => ({ ...f, source_title: e.target.value }))} placeholder="e.g. Senior PM at Acme Corp" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Role / Degree</Label>
                  <Input value={form.role_name} onChange={e => setForm(f => ({ ...f, role_name: e.target.value }))} placeholder="e.g. Senior PM" />
                </div>
                <div className="space-y-1.5">
                  <Label>Company / School</Label>
                  <Input value={form.company_name} onChange={e => setForm(f => ({ ...f, company_name: e.target.value }))} placeholder="e.g. Acme Corp" />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Date range</Label>
                <Input value={form.date_range} onChange={e => setForm(f => ({ ...f, date_range: e.target.value }))} placeholder="e.g. Jan 2020 – Dec 2022" />
              </div>
              <div className="space-y-1.5">
                <Label>Responsibilities (one per line)</Label>
                <Textarea value={form.responsibilities} onChange={e => setForm(f => ({ ...f, responsibilities: e.target.value }))} placeholder="Led cross-functional team of 8&#10;Launched 3 product features..." rows={3} className="resize-none" />
              </div>
              <div className="space-y-1.5">
                <Label>Tools / Skills (comma-separated)</Label>
                <Input value={form.tools_used} onChange={e => setForm(f => ({ ...f, tools_used: e.target.value }))} placeholder="e.g. Python, Jira, Figma, SQL" />
              </div>
              <div className="space-y-1.5">
                <Label>Outcomes / Results (one per line)</Label>
                <Textarea value={form.outcomes} onChange={e => setForm(f => ({ ...f, outcomes: e.target.value }))} placeholder="Increased revenue by 23%&#10;Reduced churn by 15%..." rows={2} className="resize-none" />
              </div>
              {saveError && <p className="text-sm text-destructive">{saveError}</p>}
              <Button className="w-full hw-btn-primary" onClick={handleAdd} disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />}
                {saving ? "Saving..." : "Add to context"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats row */}
      {items.length > 0 && (
        <div className="flex gap-3 flex-wrap">
          <div className="hw-stat">
            <span className="hw-stat-value">{items.length}</span>
            <span className="hw-stat-label">Total entries</span>
          </div>
          <div className="hw-stat">
            <span className="hw-stat-value">{highConfidenceCount}</span>
            <span className="hw-stat-label">Strong proof points</span>
          </div>
          <div className="hw-stat">
            <span className="hw-stat-value">{items.filter(i => (i.outcomes || []).length > 0 || (i.approved_achievement_bullets || []).length > 0).length}</span>
            <span className="hw-stat-label">With outcomes</span>
          </div>
          <div className="hw-stat">
            <span className="hw-stat-value">{totalActive}</span>
            <span className="hw-stat-label">Categories</span>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by title, company, skill, or role..." className="pl-9" />
      </div>

      {/* Body */}
      {loading ? (
        <div className="flex items-center justify-center h-48">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="hw-empty">
          <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
            <Briefcase className="h-5 w-5 text-muted-foreground" />
          </div>
          <p className="text-sm font-medium text-foreground">
            {search ? "No entries match your search." : "No career context yet."}
          </p>
          <p className="text-xs text-muted-foreground max-w-xs">
            {search ? "Try a different term." : "Upload your resume or add entries manually to build your evidence base."}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {SECTION_ORDER.map(type => {
            const sectionItems = grouped[type]
            if (sectionItems.length === 0) return null
            const cfg = SOURCE_TYPE_CONFIG[type]
            const Icon = cfg.icon
            const isCollapsed = collapsed[type]

            return (
              <div key={type} className="hw-card overflow-hidden">
                {/* Section header */}
                <button
                  onClick={() => toggleSection(type)}
                  className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-accent/40 transition-colors text-left"
                  aria-expanded={!isCollapsed}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-1.5 rounded border ${cfg.iconBg}`}>
                      <Icon className={`h-3.5 w-3.5 ${cfg.accent}`} />
                    </div>
                    <div>
                      <span className="text-sm font-semibold text-foreground">{cfg.label}</span>
                      <span className="text-xs text-muted-foreground ml-2">{sectionItems.length} {sectionItems.length === 1 ? "entry" : "entries"}</span>
                    </div>
                  </div>
                  {isCollapsed
                    ? <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    : <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  }
                </button>

                {/* Section items */}
                {!isCollapsed && (
                  <div className="divide-y divide-border/50">
                    {sectionItems.map(item => {
                      const confidence = item.confidence_level ? CONFIDENCE_CONFIG[item.confidence_level] : null
                      const bullets = (item.approved_achievement_bullets || []).length > 0
                        ? item.approved_achievement_bullets!
                        : (item.outcomes || [])
                      const hasOutcomes = bullets.length > 0
                      const hasProof = !!item.proof_snippet
                      const tools = item.tools_used || []

                      return (
                        <div key={item.id} className="px-5 py-4 group">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              {/* Title row */}
                              <div className="flex items-center gap-2 flex-wrap">
                                <p className="text-sm font-semibold text-foreground">{item.source_title}</p>
                                {confidence && (
                                  <span className={`inline-flex items-center gap-1 text-[10px] font-medium ${confidence.color}`}>
                                    <span className={`w-1.5 h-1.5 rounded-full ${confidence.dot}`} />
                                    {confidence.label}
                                  </span>
                                )}
                              </div>

                              {/* Sub-line */}
                              {(item.role_name || item.company_name || item.date_range) && (
                                <p className="text-xs text-muted-foreground mt-0.5">
                                  {[item.role_name, item.company_name].filter(Boolean).join(" at ")}
                                  {item.date_range && ` · ${item.date_range}`}
                                </p>
                              )}

                              {/* Proof snippet */}
                              {hasProof && (
                                <p className="text-xs text-muted-foreground mt-2 italic border-l-2 border-border pl-2.5">
                                  {item.proof_snippet}
                                </p>
                              )}

                              {/* Achievement bullets */}
                              {hasOutcomes && (
                                <ul className="mt-2 space-y-1">
                                  {bullets.slice(0, 2).map((b, i) => (
                                    <li key={i} className="text-xs text-foreground/80 flex gap-1.5 items-start">
                                      <TrendingUp className="h-3 w-3 text-emerald-500 shrink-0 mt-0.5" />
                                      {b}
                                    </li>
                                  ))}
                                  {bullets.length > 2 && (
                                    <li className="text-xs text-muted-foreground pl-4">+{bullets.length - 2} more</li>
                                  )}
                                </ul>
                              )}

                              {/* Tools */}
                              {tools.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-2.5">
                                  {tools.slice(0, 6).map(tool => (
                                    <span key={tool} className="text-[10px] bg-muted text-muted-foreground px-1.5 py-0.5 rounded font-medium">
                                      {tool}
                                    </span>
                                  ))}
                                  {tools.length > 6 && (
                                    <span className="text-[10px] text-muted-foreground">+{tools.length - 6}</span>
                                  )}
                                </div>
                              )}

                              {/* Role family tags */}
                              {(item.role_family_tags || []).length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-1.5">
                                  {(item.role_family_tags || []).map(tag => (
                                    <Badge key={tag} variant="outline" className="text-[9px] h-4 px-1.5 font-normal text-muted-foreground">
                                      {tag}
                                    </Badge>
                                  ))}
                                </div>
                              )}
                            </div>

                            {/* Delete */}
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                              onClick={() => handleDelete(item.id)}
                              disabled={deletingId === item.id}
                              aria-label="Remove entry"
                            >
                              {deletingId === item.id
                                ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                : <Trash2 className="h-3.5 w-3.5" />
                              }
                            </Button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
