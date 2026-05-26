#!/usr/bin/env node
import {
  fileExists,
  findProtectedChanges,
  getChangedFiles,
  isAllowedProtectedChange,
  isInAllowedScope,
  printList,
  readJson
} from "./lib.mjs";

const requiredFiles = [
  "CLAUDE.md",
  "MEMORY.md",
  ".agent/task.json",
  ".agent/policy.json",
  ".agent/ACCEPTANCE_CRITERIA.md"
];

const task = readJson(".agent/task.json");
const policy = readJson(".agent/policy.json");
const changedFiles = getChangedFiles();
const protectedChanges = findProtectedChanges(changedFiles, policy);
const unauthorizedProtected = protectedChanges.filter((change) => !isAllowedProtectedChange(change, task));
const outOfScope = changedFiles.filter((filePath) => !isInAllowedScope(filePath, task));
const missingFiles = requiredFiles.filter((filePath) => !fileExists(filePath));
const verification = Array.isArray(task.verification) && task.verification.length > 0
  ? task.verification
  : policy.requiredVerification ?? [];

console.log("HireWire agent preflight");
console.log(`Task: ${task.id} - ${task.title}`);
console.log(`Status: ${task.status}`);
console.log("");

printList("Required files missing:", missingFiles);
console.log("");
printList("Changed files:", changedFiles);
console.log("");

if (protectedChanges.length > 0) {
  console.log("Protected changes:");
  for (const change of protectedChanges) {
    const allowed = isAllowedProtectedChange(change, task) ? "allowed by task" : "not allowed by task";
    console.log(`  - ${change.filePath} [${change.risk}] ${allowed}`);
    console.log(`    ${change.reason}`);
  }
} else {
  console.log("Protected changes: none");
}

console.log("");
printList("Changed files outside task allowedScope:", outOfScope);
console.log("");
printList("Verification commands:", verification);

const failures = [];
if (missingFiles.length > 0) {
  failures.push("missing required files");
}
if (unauthorizedProtected.length > 0) {
  failures.push("unauthorized protected-file changes");
}
if (outOfScope.length > 0) {
  failures.push("changed files outside task scope");
}
if (verification.length === 0) {
  failures.push("no verification commands declared");
}

if (failures.length > 0) {
  console.error("");
  console.error("Preflight verdict: FAIL");
  for (const failure of failures) {
    console.error(`  - ${failure}`);
  }
  process.exit(1);
}

console.log("");
console.log("Preflight verdict: PASS");
