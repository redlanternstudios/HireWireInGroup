import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

export const repoRoot = process.cwd();

export function readJson(relativePath) {
  const fullPath = path.join(repoRoot, relativePath);
  if (!existsSync(fullPath)) {
    throw new Error(`Missing required file: ${relativePath}`);
  }

  return JSON.parse(readFileSync(fullPath, "utf8"));
}

export function fileExists(relativePath) {
  return existsSync(path.join(repoRoot, relativePath));
}

export function getChangedFiles() {
  const output = execFileSync("git", ["status", "--porcelain"], {
    cwd: repoRoot,
    encoding: "utf8"
  });

  return output
    .split("\n")
    .map((line) => line.trimEnd())
    .filter(Boolean)
    .flatMap(parseStatusLine)
    .filter(Boolean)
    .sort();
}

function parseStatusLine(line) {
  const rawPath = line.slice(3).trim();
  if (!rawPath) {
    return [];
  }

  if (rawPath.includes(" -> ")) {
    return rawPath.split(" -> ").map(normalizePath);
  }

  return [normalizePath(rawPath)];
}

export function normalizePath(value) {
  return value.replaceAll("\\", "/").replace(/^"|"$/g, "");
}

export function matchesPattern(filePath, pattern) {
  const normalizedFile = normalizePath(filePath);
  const normalizedPattern = normalizePath(pattern);

  if (normalizedPattern.endsWith("/**")) {
    const prefix = normalizedPattern.slice(0, -3);
    return normalizedFile === prefix || normalizedFile.startsWith(`${prefix}/`);
  }

  if (normalizedPattern.endsWith("/")) {
    return normalizedFile.startsWith(normalizedPattern);
  }

  return normalizedFile === normalizedPattern;
}

export function findProtectedChanges(changedFiles, policy) {
  const protectedPaths = Array.isArray(policy.protectedPaths) ? policy.protectedPaths : [];

  return changedFiles.flatMap((filePath) => {
    return protectedPaths
      .filter((entry) => matchesPattern(filePath, entry.path))
      .map((entry) => ({
        filePath,
        pattern: entry.path,
        risk: entry.risk,
        reason: entry.reason
      }));
  });
}

export function isAllowedProtectedChange(change, task) {
  const protectedTouch = task.protectedTouch ?? {};
  const allowedPaths = Array.isArray(protectedTouch.paths) ? protectedTouch.paths : [];

  if (!protectedTouch.allowed) {
    return false;
  }

  return allowedPaths.some((pattern) => matchesPattern(change.filePath, pattern));
}

export function isInAllowedScope(filePath, task) {
  const allowedScope = Array.isArray(task.allowedScope) ? task.allowedScope : [];
  if (allowedScope.length === 0) {
    return true;
  }

  return allowedScope.some((pattern) => matchesPattern(filePath, pattern));
}

export function printList(label, items) {
  console.log(label);
  if (items.length === 0) {
    console.log("  none");
    return;
  }

  for (const item of items) {
    console.log(`  - ${item}`);
  }
}
