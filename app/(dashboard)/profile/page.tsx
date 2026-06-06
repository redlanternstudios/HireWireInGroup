"use client"

import { useEffect, useState, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  Loader2, Save, X, Plus, Upload,
  User, MapPin, Mail, Phone, Globe, Github,
  FileText, CheckCircle, AlertCircle, ShieldCheck,
} from "lucide-react"
import { useRouter } from "next/navigation"
import { LinkedInImportWidget } from "@/components/dashboard/LinkedInImportWidget"
import { ParseGithubUrlButton } from "@/components/ParseGithubButton"

interface ProfileData {
  full_name: string | null
  email: string | null
  phone: string | null
  location: string | null
  summary: string | null
  skills: string[] | null
  website_url: string | null
  github_url: string | null
}

function strengthItem(label: string, filled: boolean) {
  return { label, filled }
}

export default function ProfilePage() {
  const router = useRouter()
  const [profile, setProfile] = useState<ProfileData>({
    full_name: "", email: "", phone: "", location: "",
    summary: "", skills: [], website_url: "", github_url: "",
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [skillInput, setSkillInput] = useState("")

  const fetchProfile = useCallback(async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push("/login"); return }

    const { data, error: profileError } = await supabase
      .from("user_profile")
      .select("full_name, email, phone, location, summary, skills, website_url, github_url")
      .eq("user_id", user.id)
      .maybeSingle()

    if (profileError) {
      setError(profileError.message)
      setLoading(false)
      return
    }

    if (data) {
      setProfile({
        full_name: data.full_name || "",
        email: data.email || "",
        phone: data.phone || "",
        location: data.location || "",
        summary: data.summary || "",
        skills: Array.isArray(data.skills) ? data.skills : [],
        website_url: data.website_url || "",
        github_url: data.github_url || "",
      })
    }
    setLoading(false)
  }, [router])

  useEffect(() => { fetchProfile() }, [fetchProfile])

  const handleSave = async () => {
    setSaving(true)
    setError(null)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error("Not authenticated")

      const { error: upsertError } = await supabase
        .from("user_profile")
        .upsert({
          user_id: user.id,
          full_name: profile.full_name,
          email: profile.email,
          phone: profile.phone,
          location: profile.location,
          summary: profile.summary,
          skills: profile.skills,
          website_url: profile.website_url,
          github_url: profile.github_url,
          updated_at: new Date().toISOString(),
        }, { onConflict: "user_id" })

      if (upsertError) throw upsertError
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save")
    } finally {
      setSaving(false)
    }
  }

  const addSkill = () => {
    const trimmed = skillInput.trim()
    if (!trimmed) return
    if (profile.skills?.includes(trimmed)) { setSkillInput(""); return }
    setProfile(p => ({ ...p, skills: [...(Array.isArray(p.skills) ? p.skills : []), trimmed] }))
    setSkillInput("")
  }

  const removeSkill = (skill: string) => {
    setProfile(p => ({ ...p, skills: (Array.isArray(p.skills) ? p.skills : []).filter(s => s !== skill) }))
  }

  // Profile strength calc
  const strengthItems = [
    strengthItem("Full name",    !!profile.full_name?.trim()),
    strengthItem("Email",        !!profile.email?.trim()),
    strengthItem("Location",     !!profile.location?.trim()),
    strengthItem("Phone",        !!profile.phone?.trim()),
    strengthItem("Summary",      (profile.summary?.trim() || "").length > 40),
    strengthItem("Skills",       (profile.skills?.length ?? 0) >= 3),
    strengthItem("Website / portfolio", !!profile.website_url?.trim()),
    strengthItem("GitHub",       !!profile.github_url?.trim()),
  ]
  const filledCount = strengthItems.filter(i => i.filled).length
  const strengthPct = Math.round((filledCount / strengthItems.length) * 100)
  const strengthLabel = strengthPct >= 80 ? "Strong" : strengthPct >= 50 ? "Good" : "Needs work"
  const strengthColor = strengthPct >= 80 ? "text-emerald-600" : strengthPct >= 50 ? "text-amber-600" : "text-rose-500"
  const barColor = strengthPct >= 80 ? "bg-emerald-500" : strengthPct >= 50 ? "bg-amber-500" : "bg-rose-500"

  if (loading) {
    return (
      <div className="hw-page">
        <div className="hw-empty min-h-64">
          <div className="hw-empty-icon">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
          <div>
            <p className="text-sm font-semibold">Loading profile</p>
            <p className="text-xs text-muted-foreground mt-1">
              Pulling your saved career identity and profile settings.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="hw-page">
      {/* ─── Header ─── */}
      <div className="hw-page-header">
        <div>
          <p className="hw-section-label mb-1">Career Identity</p>
          <h1 className="hw-page-title">Profile</h1>
          <p className="hw-page-subtitle">Your professional identity — used across all analyses and document generation.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push("/onboarding")}
            className="gap-1.5 shrink-0"
          >
            <Upload className="h-3.5 w-3.5" /> Upload resume
          </Button>
          {saved && (
            <span className="text-sm text-emerald-600 font-medium flex items-center gap-1">
              <CheckCircle className="h-4 w-4" /> Saved
            </span>
          )}
          <Button
            onClick={handleSave}
            disabled={saving}
            size="sm"
            className="hw-btn-primary gap-1.5 shrink-0"
          >
            {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
            {saving ? "Saving..." : "Save profile"}
          </Button>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {saved && (
        <div className="hw-panel p-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold">Profile saved</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Next, add a job so HireWire can match this career identity against a real role.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={() => router.push("/evidence")}>
              Career Context
            </Button>
            <Button size="sm" className="hw-btn-primary gap-1.5" onClick={() => router.push("/jobs?add=true")}>
              <Plus className="h-3.5 w-3.5" /> Add Job
            </Button>
          </div>
        </div>
      )}

      {/* ─── Workspace ─── */}
      <div className="hw-workspace">
        {/* Main — Profile Form */}
        <div className="hw-workspace-main">
          {/* Basic Info */}
          <div className="hw-card p-6 space-y-5">
            <div>
              <p className="hw-section-label mb-4">Basic Info</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="full_name" className="flex items-center gap-1.5 text-xs">
                    <User className="h-3.5 w-3.5 text-muted-foreground" /> Full name
                  </Label>
                  <Input
                    id="full_name"
                    value={profile.full_name || ""}
                    onChange={e => setProfile(p => ({ ...p, full_name: e.target.value }))}
                    placeholder="Your full name"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="location" className="flex items-center gap-1.5 text-xs">
                    <MapPin className="h-3.5 w-3.5 text-muted-foreground" /> Location
                  </Label>
                  <Input
                    id="location"
                    value={profile.location || ""}
                    onChange={e => setProfile(p => ({ ...p, location: e.target.value }))}
                    placeholder="City, State"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="email" className="flex items-center gap-1.5 text-xs">
                    <Mail className="h-3.5 w-3.5 text-muted-foreground" /> Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={profile.email || ""}
                    onChange={e => setProfile(p => ({ ...p, email: e.target.value }))}
                    placeholder="you@example.com"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="phone" className="flex items-center gap-1.5 text-xs">
                    <Phone className="h-3.5 w-3.5 text-muted-foreground" /> Phone
                  </Label>
                  <Input
                    id="phone"
                    value={profile.phone || ""}
                    onChange={e => setProfile(p => ({ ...p, phone: e.target.value }))}
                    placeholder="+1 (555) 000-0000"
                  />
                </div>
              </div>
            </div>

            <Separator />

            {/* Summary */}
            <div className="space-y-1.5">
              <Label htmlFor="summary" className="flex items-center gap-1.5 text-xs">
                <FileText className="h-3.5 w-3.5 text-muted-foreground" /> Professional summary
              </Label>
              <Textarea
                id="summary"
                value={profile.summary || ""}
                onChange={e => setProfile(p => ({ ...p, summary: e.target.value }))}
                placeholder="2-3 sentences describing your professional background and key strengths..."
                rows={4}
                className="resize-none"
              />
              <p className="text-[11px] text-muted-foreground">Used in cover letters and AI analysis context.</p>
            </div>
          </div>

          {/* Skills */}
          <div className="hw-card p-6 space-y-4">
            <p className="hw-section-label">Skills</p>
            <div className="flex flex-wrap gap-2 min-h-9">
              {(Array.isArray(profile.skills) ? profile.skills : []).map(skill => (
                <Badge key={skill} variant="secondary" className="gap-1 pr-1.5">
                  {skill}
                  <button
                    onClick={() => removeSkill(skill)}
                    className="hover:text-foreground text-muted-foreground ml-0.5"
                    aria-label={`Remove ${skill}`}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
              {(Array.isArray(profile.skills) ? profile.skills : []).length === 0 && (
                <p className="text-sm text-muted-foreground">No skills added yet.</p>
              )}
            </div>
            <div className="flex gap-2">
              <Input
                value={skillInput}
                onChange={e => setSkillInput(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addSkill() } }}
                placeholder="Type a skill and press Enter"
                className="max-w-xs"
              />
              <Button variant="outline" size="sm" onClick={addSkill} disabled={!skillInput.trim()}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Links */}
          <div className="hw-card p-6 space-y-4">
            <p className="hw-section-label">Links</p>
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="website_url" className="flex items-center gap-1.5 text-xs">
                  <Globe className="h-3.5 w-3.5 text-muted-foreground" /> Portfolio / Website
                </Label>
                <Input
                  id="website_url"
                  value={profile.website_url || ""}
                  onChange={e => setProfile(p => ({ ...p, website_url: e.target.value }))}
                  placeholder="https://yoursite.com"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="github_url" className="flex items-center gap-1.5 text-xs">
                  <Github className="h-3.5 w-3.5 text-muted-foreground" /> GitHub
                </Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="github_url"
                    value={profile.github_url || ""}
                    onChange={e => setProfile(p => ({ ...p, github_url: e.target.value }))}
                    placeholder="https://github.com/yourusername"
                    className="flex-1"
                  />
                  {profile.github_url?.trim() && (
                    <ParseGithubUrlButton githubUrl={profile.github_url.trim()} />
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* LinkedIn Import */}
          <LinkedInImportWidget />
        </div>

        {/* Right Rail — Profile Strength */}
        <div className="hw-workspace-rail">
          <h2 className="hw-section-label mb-3">Profile Strength</h2>
          <div className="hw-panel p-4">
            {/* Score */}
            <div className="flex items-end justify-between mb-3">
              <div>
                <p className={`text-2xl font-bold tabular-nums ${strengthColor}`}>{strengthPct}%</p>
                <p className={`text-xs font-semibold ${strengthColor}`}>{strengthLabel}</p>
              </div>
              <p className="text-[11px] text-muted-foreground text-right">
                {filledCount} of {strengthItems.length} fields
              </p>
            </div>
            <div className="quality-bar mb-4 h-2">
              <div className={`h-full rounded-full transition-all ${barColor}`} style={{ width: `${strengthPct}%` }} />
            </div>

            {/* Field checklist */}
            <div className="space-y-2.5">
              {strengthItems.map(item => (
                <div key={item.label} className="flex items-center gap-2">
                  {item.filled
                    ? <ShieldCheck className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                    : <AlertCircle className="h-3.5 w-3.5 text-muted-foreground/50 shrink-0" />
                  }
                  <p className={`text-xs ${item.filled ? "text-foreground font-medium" : "text-muted-foreground"}`}>
                    {item.label}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* How it's used */}
          <div className="mt-4">
            <h2 className="hw-section-label mb-2">How HireWire Uses This</h2>
            <div className="hw-panel p-4 space-y-3">
              {[
                { label: "Job analysis",   desc: "Matches your skills to requirements" },
                { label: "Resume gen",     desc: "Populates contact and summary sections" },
                { label: "Cover letters",  desc: "Personalizes tone and positioning" },
                { label: "Fit scoring",    desc: "Baseline for gap identification" },
              ].map(item => (
                <div key={item.label} className="flex items-start gap-2">
                  <CheckCircle className="h-3.5 w-3.5 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-semibold text-foreground">{item.label}</p>
                    <p className="text-[11px] text-muted-foreground">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
