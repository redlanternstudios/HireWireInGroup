#!/usr/bin/env node
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const allowlistPath = path.join(root, ".agent/dead-ui-allowlist.json");
const scanRoots = ["app", "components"];
const ignoredDirs = new Set(["node_modules", ".next", ".git"]);
const extensions = new Set([".ts", ".tsx", ".js", ".jsx"]);
const checks = [
  {
    name: "placeholder alert",
    pattern: /alert\(\s*["'`](todo|coming soon|not implemented|placeholder)/i
  },
  {
    name: "empty click handler",
    pattern: /onClick=\{\s*\(\s*\)\s*=>\s*\{\s*\}\s*\}/
  },
  {
    name: "hash href",
    pattern: /href=["']#["']/
  },
  {
    name: "coming soon copy",
    pattern: /\bcoming soon\b/i
  },
  {
    name: "not implemented copy",
    pattern: /\bnot implemented\b/i
  },
  {
    name: "todo marker",
    pattern: /\bTODO\b/
  }
];

const findings = [];
const allowlist = loadAllowlist();

for (const scanRoot of scanRoots) {
  walk(path.join(root, scanRoot));
}

function loadAllowlist() {
  if (!existsSync(allowlistPath)) {
    return [];
  }

  const parsed = JSON.parse(readFileSync(allowlistPath, "utf8"));
  return Array.isArray(parsed.entries) ? parsed.entries : [];
}

function walk(currentPath) {
  const relativePath = path.relative(root, currentPath).replaceAll("\\", "/");
  const stats = statSync(currentPath);

  if (stats.isDirectory()) {
    if (ignoredDirs.has(path.basename(currentPath))) {
      return;
    }

    for (const child of readdirSync(currentPath)) {
      walk(path.join(currentPath, child));
    }
    return;
  }

  if (!extensions.has(path.extname(currentPath))) {
    return;
  }

  const lines = readFileSync(currentPath, "utf8").split("\n");
  lines.forEach((line, index) => {
    for (const check of checks) {
      if (check.pattern.test(line)) {
        const finding = {
          file: relativePath,
          line: index + 1,
          check: check.name,
          text: line.trim().slice(0, 160)
        };

        if (!isAllowed(finding)) {
          findings.push(finding);
        }
      }
    }
  });
}

function isAllowed(finding) {
  return allowlist.some((entry) => {
    if (entry.file !== finding.file) {
      return false;
    }

    if (entry.check !== finding.check) {
      return false;
    }

    if (entry.contains && !finding.text.includes(entry.contains)) {
      return false;
    }

    return true;
  });
}

console.log("Agent dead/fake UI check");

if (findings.length === 0) {
  console.log("PASS: no obvious dead UI markers found.");
  process.exit(0);
}

console.log(`Found ${findings.length} potential dead UI marker(s):`);
for (const finding of findings) {
  console.log(`  - ${finding.file}:${finding.line} [${finding.check}] ${finding.text}`);
}

console.error("");
console.error("FAIL: review these markers and either wire the behavior or document why they are intentional.");
process.exit(1);
