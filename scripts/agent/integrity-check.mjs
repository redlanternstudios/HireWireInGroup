#!/usr/bin/env node
/**
 * HireWire build-integrity gate.
 *
 * Fast, dependency-free structural scan that catches the specific ways v0
 * syncs corrupt files — the class of breakage that slipped past every other
 * agent gate (preflight, dead-ui, receipts) because none of them parse code:
 *
 *   1. MID-FILE IMPORTS  — `import ... from` appearing after real code has
 *      started. This is the signature of v0 concatenating two versions of a
 *      file into one (e.g. app/api/coach/route.ts had a full second module —
 *      imports and all — pasted into the middle of the first handler).
 *
 *   2. DUPLICATE TOP-LEVEL EXPORTS — the same exported name declared twice
 *      (e.g. two `export async function POST`). Illegal, and the other tell
 *      of a concat merge.
 *
 * This runs in milliseconds so it is safe as a pre-commit hook. It does NOT
 * replace `tsc` — `npm run agent:verify` still runs the full typecheck / lint
 * / build. This just fails FIRST, with a message a human can act on, instead
 * of tsc's cryptic "'}' expected" (which also hides every other error behind
 * the first parse failure).
 */
import { execFileSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const scanRoots = ["app", "lib", "components", "hooks"];
const ignoredDirs = new Set(["node_modules", ".next", ".git", ".agent"]);
const extensions = new Set([".ts", ".tsx", ".js", ".jsx", ".mjs"]);

// --changed  → only scan files staged in the current commit (pre-commit hook).
//              Ideal so the gate stops NEW corruption without being blocked by
//              pre-existing mid-file imports elsewhere in the repo.
// (default)  → full scan of scanRoots (CI / manual audit).
const changedOnly = process.argv.includes("--changed");

const findings = [];

if (changedOnly) {
  for (const file of stagedSourceFiles()) checkFile(path.join(root, file));
} else {
  for (const scanRoot of scanRoots) {
    const full = path.join(root, scanRoot);
    try {
      if (statSync(full).isDirectory()) walk(full);
    } catch {
      // scan root does not exist in this repo — skip
    }
  }
}

function stagedSourceFiles() {
  let out = "";
  try {
    out = execFileSync(
      "git",
      ["diff", "--cached", "--name-only", "--diff-filter=ACMR"],
      { cwd: root, encoding: "utf8" },
    );
  } catch {
    return [];
  }
  return out
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .filter((f) => scanRoots.some((r) => f === r || f.startsWith(`${r}/`)))
    .filter((f) => extensions.has(path.extname(f)))
    .filter((f) => existsSync(path.join(root, f)));
}

function walk(currentPath) {
  const stats = statSync(currentPath);
  if (stats.isDirectory()) {
    if (ignoredDirs.has(path.basename(currentPath))) return;
    for (const child of readdirSync(currentPath)) {
      walk(path.join(currentPath, child));
    }
    return;
  }
  if (!extensions.has(path.extname(currentPath))) return;
  checkFile(currentPath);
}

function checkFile(filePath) {
  const rel = path.relative(root, filePath).replaceAll("\\", "/");
  const lines = readFileSync(filePath, "utf8").split("\n");

  let codeStarted = false;
  let inBlockComment = false;
  let inTemplate = false;
  let inImport = false; // spanning a multi-line import statement
  const exportedNames = new Map(); // name -> first line seen

  // A single-line import is "complete" if it has a `from '...'` clause or is a
  // bare side-effect import (`import './x'`). Otherwise it spans multiple lines
  // (e.g. `import {\n  A,\n  B,\n} from '...'`).
  const importIsComplete = (raw) =>
    /\bfrom\s*["'][^"']+["']/.test(raw) || /^import\s*["'][^"']+["']/.test(raw);

  lines.forEach((raw, index) => {
    const lineNo = index + 1;
    const line = raw.trim();

    // Consume the continuation lines of a multi-line import first, so the
    // closing `} from "..."` line never looks like "code has started".
    if (inImport) {
      if (importIsComplete(raw) || line.endsWith(";")) inImport = false;
      return;
    }

    // Track template-literal spans (crude: toggle on unescaped backticks).
    // Skips lines inside multi-line template strings (e.g. system prompts).
    const backticks = (raw.match(/(?<!\\)`/g) || []).length;
    const wasInTemplate = inTemplate;
    if (backticks % 2 === 1) inTemplate = !inTemplate;
    if (wasInTemplate || inTemplate) return;

    // Track block comments.
    if (inBlockComment) {
      if (line.includes("*/")) inBlockComment = false;
      return;
    }
    if (line.startsWith("/*")) {
      if (!line.includes("*/")) inBlockComment = true;
      return;
    }

    if (line === "" || line.startsWith("//")) return;
    // Directives ("use client" / "use server") are allowed before imports.
    if (/^["']use (client|server)["'];?$/.test(line)) return;

    const isTopLevelImport =
      /^import[\s{*]/.test(raw) || /^import\s*["']/.test(raw);

    if (isTopLevelImport) {
      // If this import spans multiple lines, consume the rest of it.
      if (!importIsComplete(raw)) inImport = true;
      // FINDING 1: an import after code has already begun = concat corruption.
      if (codeStarted) {
        findings.push({
          file: rel,
          line: lineNo,
          check: "mid-file import",
          text: line.slice(0, 140),
          hint: "imports must be at the top of the file — this is the signature of a v0 concat merge (two file versions fused).",
        });
      }
      return;
    }

    // Any other non-trivial top-level line means code has started.
    if (!raw.startsWith(" ") && !raw.startsWith("\t")) {
      codeStarted = true;

      // FINDING 2: duplicate top-level export declarations.
      const m =
        raw.match(/^export\s+(?:default\s+)?(?:async\s+)?function\s*\*?\s*([A-Za-z0-9_$]+)/) ||
        raw.match(/^export\s+(?:const|let|var|class)\s+([A-Za-z0-9_$]+)/);
      if (m) {
        const name = m[1];
        if (exportedNames.has(name)) {
          findings.push({
            file: rel,
            line: lineNo,
            check: "duplicate export",
            text: `export "${name}" (first declared at line ${exportedNames.get(name)})`,
            hint: "two exports with the same name is illegal and is the other tell of a v0 concat merge — keep one, delete the stale copy.",
          });
        } else {
          exportedNames.set(name, lineNo);
        }
      }
    }
  });
}

console.log(
  `HireWire build-integrity check (structural)${changedOnly ? " — staged files" : ""}`,
);

// Ratchet severity:
//  - duplicate exports are ALWAYS errors (unambiguous corruption).
//  - mid-file imports are errors on files being committed (--changed) so new
//    disorder can't land, but only warnings in a full-repo scan so CI is not
//    held red by pre-existing legacy cases.
const errors = findings.filter(
  (f) => f.check === "duplicate export" || changedOnly,
);
const warnings = findings.filter((f) => !errors.includes(f));

if (findings.length === 0) {
  console.log("PASS: no mid-file imports or duplicate exports found.");
  process.exit(0);
}

if (warnings.length > 0) {
  console.log(`\nWARN: ${warnings.length} pre-existing mid-file import(s) (legacy debt, not blocking):`);
  for (const f of warnings) {
    console.log(`  - ${f.file}:${f.line} [${f.check}] ${f.text}`);
  }
}

if (errors.length === 0) {
  console.log("\nPASS: no blocking integrity issues.");
  process.exit(0);
}

console.error(`\nFAIL: ${errors.length} blocking integrity issue(s) found:\n`);
for (const f of errors) {
  console.error(`  - ${f.file}:${f.line} [${f.check}] ${f.text}`);
  console.error(`      ↳ ${f.hint}`);
}
console.error("\nThis usually means a v0 sync fused two versions of a file.");
console.error("Fix: keep the intended version, delete the duplicated half, then re-run.");
process.exit(1);
