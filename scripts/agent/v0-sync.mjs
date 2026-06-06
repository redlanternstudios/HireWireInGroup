#!/usr/bin/env node
import { execFileSync } from "node:child_process"
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs"
import path from "node:path"

const repoRoot = process.cwd()
const outputPath = getArg("--out") ?? ".agent/V0_LIVE_HANDOFF.md"
const watchMode = process.argv.includes("--watch")
const intervalMs = Number(getArg("--interval") ?? 2500)

let lastSignature = ""

if (watchMode) {
  console.log(`[v0-sync] watching repo state -> ${outputPath}`)
  await generateIfChanged()
  setInterval(generateIfChanged, Number.isFinite(intervalMs) ? intervalMs : 2500)
} else {
  generate()
}

async function generateIfChanged() {
  const signature = runGit(["status", "--porcelain=v1"]).stdout + "\n" + runGit(["diff", "--name-only", "--cached"]).stdout
  if (signature === lastSignature) return
  lastSignature = signature
  generate()
}

function generate() {
  const status = runGit(["status", "--short"]).stdout.trim()
  const conflictFiles = runGit(["diff", "--name-only", "--diff-filter=U"]).stdout
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
  const changedFiles = getChangedFiles()
  const stagedFiles = runGit(["diff", "--name-only", "--cached"]).stdout
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
  const stat = runGit(["diff", "--stat", "HEAD"]).stdout.trim()
  const branch = runGit(["rev-parse", "--abbrev-ref", "HEAD"]).stdout.trim()
  const head = runGit(["log", "--oneline", "-1"]).stdout.trim()
  const task = readJsonOptional(".agent/task.json")
  const protectedFiles = readProtectedFiles()

  const markdown = [
    "# v0 Live Handoff",
    "",
    `Generated: ${new Date().toISOString()}`,
    `Branch: ${branch || "(unknown)"}`,
    `HEAD: ${head || "(unknown)"}`,
    "",
    "## Use This In v0",
    "",
    "Build or revise only the UI that matches the current repo state below. Do not invent backend routes, props, tables, or actions. If a button is not wired in the listed files, render it disabled or omit it.",
    "",
    "## Current Task",
    "",
    task
      ? `Task: ${task.id ?? "(unknown)"} - ${task.title ?? "(untitled)"}\n\nGoal: ${task.goal ?? "(no goal recorded)"}`
      : "No `.agent/task.json` found.",
    "",
    "## Merge / Conflict State",
    "",
    conflictFiles.length
      ? [
          "Do not generate final v0 implementation against conflicted files until these are resolved:",
          ...conflictFiles.map((file) => `- ${file}`),
        ].join("\n")
      : "No unresolved merge conflicts detected.",
    "",
    "## Changed Files",
    "",
    changedFiles.length ? changedFiles.map((file) => `- ${file}`).join("\n") : "No changed files detected.",
    "",
    "## Staged Files",
    "",
    stagedFiles.length ? stagedFiles.map((file) => `- ${file}`).join("\n") : "No staged files detected.",
    "",
    "## Changed Surface Map",
    "",
    renderSurfaceMap(changedFiles),
    "",
    "## Protected / High-Risk Files In Current Diff",
    "",
    renderProtected(changedFiles, protectedFiles),
    "",
    "## Diff Stat",
    "",
    stat ? fenced(stat) : "No diff stat available.",
    "",
    "## v0 Design Rules",
    "",
    "- Build the actual product screen, not a marketing page.",
    "- Preserve existing route structure, components, and server/client boundaries.",
    "- Use HireWire language: Prove Fit, Match Interview, Career Context, Application Package, Ready to Apply.",
    "- Hide database, evidence-picker, manual-mapping, and workflow-theory language from primary user flows.",
    "- Do not show CTAs that are not backed by existing routes/actions unless explicitly disabled.",
    "- Keep readiness and apply gates honest. Do not imply a package can be applied before the gate clears.",
    "- Respect the current design system and local component patterns.",
    "",
    "## Backend Assumptions v0 Must Not Make",
    "",
    "- Do not assume new Supabase tables or columns unless a migration is listed above.",
    "- Do not assume a new API route exists unless it is listed in Changed Surface Map or already exists in `app/api`.",
    "- Do not assume Career Context is a first-class screen unless `/career-context` stops redirecting.",
    "- Do not create fake success states for document generation, package review, outcome logging, billing, or apply.",
    "",
    "## Prompt To Paste",
    "",
    fenced([
      "You are updating HireWire UI from the live repo handoff.",
      "Use the Changed Surface Map and Changed Files above as the source of truth.",
      "Design only the affected screen/component. Do not invent backend behavior.",
      "If the handoff lists unresolved conflicts, produce a design recommendation only, not code.",
      "Return file-scoped changes and acceptance criteria.",
    ].join("\n")),
    "",
    "## Raw Git Status",
    "",
    status ? fenced(status) : "Clean working tree.",
    "",
  ].join("\n")

  writeFile(outputPath, markdown)
  console.log(`[v0-sync] wrote ${outputPath}`)
}

function renderSurfaceMap(files) {
  const groups = {
    "Pages / routes": files.filter((file) => file.startsWith("app/") && (file.endsWith("/page.tsx") || file.includes("/page."))),
    "API routes": files.filter((file) => file.startsWith("app/api/")),
    Components: files.filter((file) => file.startsWith("components/")),
    "Server actions / domain logic": files.filter((file) => file.startsWith("lib/")),
    Migrations: files.filter((file) => file.startsWith("supabase/migrations/")),
    Tests: files.filter((file) => file.startsWith("tests/") || file.endsWith(".test.ts") || file.endsWith(".test.tsx")),
    "Docs / operating layer": files.filter((file) =>
      file.startsWith("docs/") ||
      file.startsWith(".agent/") ||
      file.startsWith(".claude/") ||
      file.startsWith(".github/") ||
      file.startsWith(".vscode/") ||
      file.endsWith(".md"),
    ),
  }

  return Object.entries(groups)
    .map(([label, group]) => {
      if (!group.length) return `### ${label}\n\n- none`
      return [`### ${label}`, "", ...group.map((file) => `- ${file}`)].join("\n")
    })
    .join("\n\n")
}

function renderProtected(files, protectedFiles) {
  const matches = files.filter((file) => protectedFiles.some((entry) => matchesPattern(file, entry)))
  return matches.length ? matches.map((file) => `- ${file}`).join("\n") : "No protected files detected by v0-sync."
}

function readProtectedFiles() {
  const text = readOptional(".claude/context/protected-files.md")
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.startsWith("- `") && line.includes("`"))
    .map((line) => line.slice(3, line.indexOf("`", 3)))
}

function getChangedFiles() {
  const status = runGit(["status", "--porcelain=v1"]).stdout
  return Array.from(new Set(status.split("\n").flatMap(parseStatusLine).filter(Boolean))).sort()
}

function parseStatusLine(line) {
  if (!line.trim()) return []
  const rawPath = line.slice(3).trim()
  if (!rawPath) return []
  if (rawPath.includes(" -> ")) return rawPath.split(" -> ").map(normalizePath)
  return [normalizePath(rawPath)]
}

function matchesPattern(filePath, pattern) {
  const file = normalizePath(filePath)
  const normalizedPattern = normalizePath(pattern)
  if (normalizedPattern.endsWith("/**")) {
    const prefix = normalizedPattern.slice(0, -3)
    return file === prefix || file.startsWith(`${prefix}/`)
  }
  return file === normalizedPattern || file.startsWith(`${normalizedPattern}/`)
}

function normalizePath(value) {
  return value.replaceAll("\\", "/").replace(/^"|"$/g, "")
}

function readJsonOptional(relativePath) {
  try {
    return JSON.parse(readFileSync(path.join(repoRoot, relativePath), "utf8"))
  } catch {
    return null
  }
}

function readOptional(relativePath) {
  try {
    return readFileSync(path.join(repoRoot, relativePath), "utf8")
  } catch {
    return ""
  }
}

function writeFile(relativePath, contents) {
  const fullPath = path.join(repoRoot, relativePath)
  mkdirSync(path.dirname(fullPath), { recursive: true })
  writeFileSync(fullPath, contents)
}

function runGit(args) {
  try {
    return {
      ok: true,
      stdout: execFileSync("git", args, { cwd: repoRoot, encoding: "utf8" }),
    }
  } catch (error) {
    return {
      ok: false,
      stdout: error.stdout?.toString?.() ?? "",
    }
  }
}

function getArg(name) {
  const arg = process.argv.find((value) => value.startsWith(`${name}=`))
  return arg ? arg.slice(name.length + 1) : null
}

function fenced(value) {
  return ["```txt", value, "```"].join("\n")
}
