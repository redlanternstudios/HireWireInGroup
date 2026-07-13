import type { SupabaseClient } from "@supabase/supabase-js"

export type CoachLinkType = "linkedin" | "github" | "portfolio" | "website" | "other"

export type CoachProfileLinkInput = {
  link_type: CoachLinkType
  url: string
  label?: string | null
  is_primary?: boolean
}

export type CoachProfileLinkUpdate = {
  url?: string
  label?: string | null
  link_type?: CoachLinkType
  is_primary?: boolean
}

type UserProfileRow = {
  linkedin_url?: string | null
  github_url?: string | null
  website_url?: string | null
  links?: unknown
  [key: string]: unknown
}

export type CareerContextInput = {
  target_role?: string | null
  open_to_other_roles?: boolean | null
  other_roles?: string[] | string | null
  notes?: string | null
}

export type CoachProfileExperience = {
  title: string
  company: string
  start_date: string
  end_date?: string
  description?: string
}

export type CoachProfileEducation = {
  degree: string
  school: string
  year: string
}

export type CoachProfileWipeScope = "context" | "context_and_links" | "full_profile"

type ProfileLinkSeed = {
  link_type: "linkedin" | "github" | "website"
  url: string
}

function normalizeUrl(url: string) {
  return url.trim()
}

function normalizeLinkType(value: CoachLinkType | string): CoachLinkType {
  const normalized = String(value || "").toLowerCase()
  if (normalized.includes("linkedin")) return "linkedin"
  if (normalized.includes("github")) return "github"
  if (normalized.includes("portfolio")) return "portfolio"
  if (normalized.includes("website") || normalized.includes("web")) return "website"
  return "other"
}

function standardFieldForLinkType(linkType: CoachLinkType) {
  if (linkType === "linkedin") return "linkedin_url"
  if (linkType === "github") return "github_url"
  if (linkType === "portfolio" || linkType === "website") return "website_url"
  return null
}

export async function syncProfileLinkField(
  supabase: SupabaseClient,
  userId: string,
  linkType: CoachLinkType,
  url: string | null,
) {
  const field = standardFieldForLinkType(linkType)
  if (!field) return

  await supabase
    .from("user_profile")
    .update({
      [field]: url,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", userId)
}

export async function syncProfileLinksFromProfile(
  supabase: SupabaseClient,
  userId: string,
  profile: UserProfileRow,
) {
  const desired = [
    profile.linkedin_url ? { link_type: "linkedin" as const, url: normalizeUrl(profile.linkedin_url) } : null,
    profile.github_url ? { link_type: "github" as const, url: normalizeUrl(profile.github_url) } : null,
    profile.website_url ? { link_type: "website" as const, url: normalizeUrl(profile.website_url) } : null,
  ].filter((item): item is ProfileLinkSeed => !!item)

  const { data: existing } = await supabase
    .from("user_profile_links")
    .select("id, link_type, url, label, is_primary")
    .eq("user_id", userId)

  const existingRows = Array.isArray(existing) ? existing : []

  for (const desiredLink of desired) {
    await supabase
      .from("user_profile_links")
      .update({ is_primary: false })
      .eq("user_id", userId)
      .eq("link_type", desiredLink.link_type)

    const match = existingRows.find(
      row =>
        normalizeLinkType(String(row.link_type)) === desiredLink.link_type &&
        normalizeUrl(String(row.url ?? "")) === desiredLink.url,
    )

    if (match) {
      await supabase
        .from("user_profile_links")
        .update({
          is_primary: true,
          updated_at: new Date().toISOString(),
        })
        .eq("id", match.id)
        .eq("user_id", userId)
      await syncProfileLinkField(supabase, userId, desiredLink.link_type, desiredLink.url)
      continue
    }

    await supabase
      .from("user_profile_links")
      .insert({
        user_id: userId,
        link_type: desiredLink.link_type,
        url: desiredLink.url,
        label: null,
        is_primary: true,
        source: "coach_update",
        parse_status: "pending",
        metadata: null,
      })
    await syncProfileLinkField(supabase, userId, desiredLink.link_type, desiredLink.url)
  }

  for (const row of existingRows) {
    const rowType = normalizeLinkType(String(row.link_type))
    const keep = desired.find(desiredLink => desiredLink.link_type === rowType && desiredLink.url === normalizeUrl(String(row.url ?? "")))
    if (!keep && rowType !== "other") {
      await supabase
        .from("user_profile_links")
        .delete()
        .eq("id", row.id)
        .eq("user_id", userId)
      await syncProfileLinkField(supabase, userId, rowType, null)
    }
  }
}

export async function upsertCoachProfileLink(
  supabase: SupabaseClient,
  userId: string,
  input: CoachProfileLinkInput,
) {
  const url = normalizeUrl(input.url)
  const linkType = normalizeLinkType(input.link_type)

  const { data: existing } = await supabase
    .from("user_profile_links")
    .select("id, link_type, url, label, is_primary")
    .eq("user_id", userId)
    .eq("link_type", linkType)
    .eq("url", url)
    .maybeSingle()

  if (existing) {
    const { data, error } = await supabase
      .from("user_profile_links")
      .update({
        label: input.label?.trim() || null,
        is_primary: input.is_primary ?? existing.is_primary,
        source: "coach_update",
        updated_at: new Date().toISOString(),
      })
      .eq("id", existing.id)
      .eq("user_id", userId)
      .select("*")
      .single()

    if (error) throw error
    await syncProfileLinkField(supabase, userId, linkType, url)
    return { link: data, merged: true }
  }

  if (input.is_primary) {
    await supabase
      .from("user_profile_links")
      .update({ is_primary: false })
      .eq("user_id", userId)
      .eq("link_type", linkType)
  }

  const { data, error } = await supabase
    .from("user_profile_links")
    .insert({
      user_id: userId,
      link_type: linkType,
      url,
      label: input.label?.trim() || null,
      is_primary: input.is_primary ?? false,
      source: "coach_update",
      parse_status: "pending",
      metadata: null,
    })
    .select("*")
    .single()

  if (error) throw error
  await syncProfileLinkField(supabase, userId, linkType, url)
  return { link: data, merged: false }
}

export async function updateCoachProfileLink(
  supabase: SupabaseClient,
  userId: string,
  id: string,
  updates: CoachProfileLinkUpdate,
) {
  const { data: existing, error: existingError } = await supabase
    .from("user_profile_links")
    .select("id, link_type, url, label, is_primary")
    .eq("id", id)
    .eq("user_id", userId)
    .maybeSingle()

  if (existingError) throw existingError
  if (!existing) return { link: null, merged: false }

  const nextType = normalizeLinkType(updates.link_type ?? existing.link_type)
  const nextUrl = updates.url !== undefined ? normalizeUrl(updates.url) : String(existing.url ?? "")

  if (updates.is_primary) {
    await supabase
      .from("user_profile_links")
      .update({ is_primary: false })
      .eq("user_id", userId)
      .eq("link_type", nextType)
      .neq("id", id)
  }

  const { data, error } = await supabase
    .from("user_profile_links")
    .update({
      ...(updates.url !== undefined ? { url: nextUrl } : {}),
      ...(updates.label !== undefined ? { label: updates.label?.trim() || null } : {}),
      ...(updates.link_type !== undefined ? { link_type: nextType } : {}),
      ...(updates.is_primary !== undefined ? { is_primary: updates.is_primary } : {}),
      source: "coach_update",
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("user_id", userId)
    .select("*")
    .single()

  if (error) throw error
  await syncProfileLinkField(supabase, userId, nextType, nextUrl)
  return { link: data, merged: true }
}

export async function removeCoachProfileLink(
  supabase: SupabaseClient,
  userId: string,
  id: string,
) {
  const { data: existing, error: existingError } = await supabase
    .from("user_profile_links")
    .select("id, link_type, url")
    .eq("id", id)
    .eq("user_id", userId)
    .maybeSingle()

  if (existingError) throw existingError
  if (!existing) return { removed: false }

  const linkType = normalizeLinkType(existing.link_type)
  const url = normalizeUrl(existing.url)

  const { error } = await supabase
    .from("user_profile_links")
    .delete()
    .eq("id", id)
    .eq("user_id", userId)

  if (error) throw error
  await syncProfileLinkField(supabase, userId, linkType, null)

  return { removed: true, link_type: linkType, url }
}

export async function setPrimaryCoachProfileLink(
  supabase: SupabaseClient,
  userId: string,
  id: string,
) {
  const { data: existing, error: existingError } = await supabase
    .from("user_profile_links")
    .select("id, link_type, url")
    .eq("id", id)
    .eq("user_id", userId)
    .maybeSingle()

  if (existingError) throw existingError
  if (!existing) return { updated: false }

  const linkType = normalizeLinkType(existing.link_type)
  const url = normalizeUrl(existing.url)

  await supabase
    .from("user_profile_links")
    .update({ is_primary: false })
    .eq("user_id", userId)
    .eq("link_type", linkType)

  const { data, error } = await supabase
    .from("user_profile_links")
    .update({
      is_primary: true,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("user_id", userId)
    .select("*")
    .single()

  if (error) throw error
  await syncProfileLinkField(supabase, userId, linkType, url)
  return { updated: true, link: data }
}

export async function updateCareerContextRecord(
  supabase: SupabaseClient,
  userId: string,
  updates: CareerContextInput,
) {
  const { data: profile } = await supabase
    .from("user_profile")
    .select("career_context")
    .eq("user_id", userId)
    .maybeSingle()

  const existing = profile && typeof profile.career_context === "object" && !Array.isArray(profile.career_context)
    ? profile.career_context as Record<string, unknown>
    : {}

  const merged = {
    ...existing,
    ...(updates.target_role !== undefined ? { target_role: updates.target_role } : {}),
    ...(updates.open_to_other_roles !== undefined ? { open_to_other_roles: updates.open_to_other_roles } : {}),
    ...(updates.other_roles !== undefined ? { other_roles: updates.other_roles } : {}),
    ...(updates.notes !== undefined ? { notes: updates.notes } : {}),
  }

  const { data, error } = await supabase
    .from("user_profile")
    .update({
      career_context: merged,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", userId)
    .select("*")
    .single()

  if (error) throw error
  return data
}

export async function upsertCoachExperience(
  supabase: SupabaseClient,
  userId: string,
  input: CoachProfileExperience,
) {
  const { data: profile, error: loadError } = await supabase
    .from("user_profile")
    .select("experience")
    .eq("user_id", userId)
    .maybeSingle()

  if (loadError) throw loadError
  if (!profile) return { experience: null, merged: false }

  const currentExperience = Array.isArray(profile.experience) ? profile.experience : []
  const nextEntry = {
    title: input.title.trim(),
    company: input.company.trim(),
    start_date: input.start_date.trim(),
    end_date: input.end_date?.trim() || "Present",
    description: input.description?.trim() || "",
  }

  const key = `${nextEntry.title} ${nextEntry.company} ${nextEntry.start_date} ${nextEntry.end_date}`.toLowerCase()
  const existingIndex = currentExperience.findIndex((entry: Record<string, unknown>) =>
    `${String(entry.title ?? "")} ${String(entry.company ?? "")} ${String(entry.start_date ?? "")} ${String(entry.end_date ?? "Present")}`.toLowerCase() === key
  )

  const nextExperience = existingIndex >= 0
    ? currentExperience.map((entry: Record<string, unknown>, index: number) =>
        index === existingIndex
          ? {
              ...entry,
              description: [String(entry.description ?? ""), nextEntry.description].filter(Boolean).join("\n").trim(),
            }
          : entry
      )
    : [...currentExperience, nextEntry]

  const { data, error } = await supabase
    .from("user_profile")
    .update({
      experience: nextExperience,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", userId)
    .select("*")
    .single()

  if (error) throw error
  return {
    experience: existingIndex >= 0 ? nextExperience[existingIndex] : nextEntry,
    merged: existingIndex >= 0,
    profile: data,
  }
}

export async function updateCoachExperience(
  supabase: SupabaseClient,
  userId: string,
  index: number,
  updates: Partial<CoachProfileExperience>,
) {
  const { data: profile, error: loadError } = await supabase
    .from("user_profile")
    .select("experience")
    .eq("user_id", userId)
    .maybeSingle()

  if (loadError) throw loadError
  if (!profile) return { experience: null }

  const currentExperience = Array.isArray(profile.experience) ? profile.experience : []
  if (index < 0 || index >= currentExperience.length) return { experience: null }

  const nextExperience = currentExperience.map((entry: Record<string, unknown>, entryIndex: number) =>
    entryIndex === index
      ? {
          ...entry,
          ...(updates.title !== undefined ? { title: updates.title.trim() } : {}),
          ...(updates.company !== undefined ? { company: updates.company.trim() } : {}),
          ...(updates.start_date !== undefined ? { start_date: updates.start_date.trim() } : {}),
          ...(updates.end_date !== undefined ? { end_date: updates.end_date.trim() || "Present" } : {}),
          ...(updates.description !== undefined ? { description: updates.description.trim() } : {}),
        }
      : entry
  )

  const { data, error } = await supabase
    .from("user_profile")
    .update({
      experience: nextExperience,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", userId)
    .select("*")
    .single()

  if (error) throw error
  return { experience: nextExperience[index], profile: data }
}

export async function removeCoachExperience(
  supabase: SupabaseClient,
  userId: string,
  index: number,
) {
  const { data: profile, error: loadError } = await supabase
    .from("user_profile")
    .select("experience")
    .eq("user_id", userId)
    .maybeSingle()

  if (loadError) throw loadError
  if (!profile) return { removed: false }

  const currentExperience = Array.isArray(profile.experience) ? profile.experience : []
  if (index < 0 || index >= currentExperience.length) return { removed: false }

  const removed = currentExperience[index]
  const nextExperience = currentExperience.filter((_: unknown, entryIndex: number) => entryIndex !== index)

  const { error } = await supabase
    .from("user_profile")
    .update({
      experience: nextExperience,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", userId)

  if (error) throw error
  return { removed: true, experience: removed, profile: nextExperience }
}

export async function upsertCoachEducation(
  supabase: SupabaseClient,
  userId: string,
  input: CoachProfileEducation,
) {
  const { data: profile, error: loadError } = await supabase
    .from("user_profile")
    .select("education")
    .eq("user_id", userId)
    .maybeSingle()

  if (loadError) throw loadError
  if (!profile) return { education: null, merged: false }

  const currentEducation = Array.isArray(profile.education) ? profile.education : []
  const nextEntry = {
    degree: input.degree.trim(),
    school: input.school.trim(),
    year: input.year.trim(),
  }

  const key = `${nextEntry.degree} ${nextEntry.school} ${nextEntry.year}`.toLowerCase()
  const existingIndex = currentEducation.findIndex((entry: Record<string, unknown>) =>
    `${String(entry.degree ?? "")} ${String(entry.school ?? "")} ${String(entry.year ?? "")}`.toLowerCase() === key
  )

  const nextEducation = existingIndex >= 0
    ? currentEducation.map((entry: Record<string, unknown>, index: number) =>
        index === existingIndex ? { ...entry, ...nextEntry } : entry
      )
    : [...currentEducation, nextEntry]

  const { data, error } = await supabase
    .from("user_profile")
    .update({
      education: nextEducation,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", userId)
    .select("*")
    .single()

  if (error) throw error
  return {
    education: existingIndex >= 0 ? nextEducation[existingIndex] : nextEntry,
    merged: existingIndex >= 0,
    profile: data,
  }
}

export async function updateCoachEducation(
  supabase: SupabaseClient,
  userId: string,
  index: number,
  updates: Partial<CoachProfileEducation>,
) {
  const { data: profile, error: loadError } = await supabase
    .from("user_profile")
    .select("education")
    .eq("user_id", userId)
    .maybeSingle()

  if (loadError) throw loadError
  if (!profile) return { education: null }

  const currentEducation = Array.isArray(profile.education) ? profile.education : []
  if (index < 0 || index >= currentEducation.length) return { education: null }

  const nextEducation = currentEducation.map((entry: Record<string, unknown>, entryIndex: number) =>
    entryIndex === index
      ? {
          ...entry,
          ...(updates.degree !== undefined ? { degree: updates.degree.trim() } : {}),
          ...(updates.school !== undefined ? { school: updates.school.trim() } : {}),
          ...(updates.year !== undefined ? { year: updates.year.trim() } : {}),
        }
      : entry
  )

  const { data, error } = await supabase
    .from("user_profile")
    .update({
      education: nextEducation,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", userId)
    .select("*")
    .single()

  if (error) throw error
  return { education: nextEducation[index], profile: data }
}

export async function removeCoachEducation(
  supabase: SupabaseClient,
  userId: string,
  index: number,
) {
  const { data: profile, error: loadError } = await supabase
    .from("user_profile")
    .select("education")
    .eq("user_id", userId)
    .maybeSingle()

  if (loadError) throw loadError
  if (!profile) return { removed: false }

  const currentEducation = Array.isArray(profile.education) ? profile.education : []
  if (index < 0 || index >= currentEducation.length) return { removed: false }

  const removed = currentEducation[index]
  const nextEducation = currentEducation.filter((_: unknown, entryIndex: number) => entryIndex !== index)

  const { error } = await supabase
    .from("user_profile")
    .update({
      education: nextEducation,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", userId)

  if (error) throw error
  return { removed: true, education: removed, profile: nextEducation }
}

export async function wipeCoachProfile(
  supabase: SupabaseClient,
  userId: string,
  scope: CoachProfileWipeScope,
) {
  const updates: Record<string, unknown> = {
    headline: null,
    summary: null,
    career_context: null,
    updated_at: new Date().toISOString(),
  }

  if (scope === "full_profile") {
    updates.skills = []
    updates.experience = []
    updates.education = []
    updates.linkedin_url = null
    updates.github_url = null
    updates.website_url = null
    updates.phone = null
    updates.location = null
  }

  const { data, error } = await supabase
    .from("user_profile")
    .update(updates)
    .eq("user_id", userId)
    .select("*")
    .single()

  if (error) throw error

  if (scope !== "context") {
    await supabase
      .from("user_profile_links")
      .delete()
      .eq("user_id", userId)

    await syncProfileLinksFromProfile(supabase, userId, {
      linkedin_url: "",
      github_url: "",
      website_url: "",
      links: [],
    })
  }

  return { profile: data, scope }
}
