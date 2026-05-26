#!/usr/bin/env node
import {
  findProtectedChanges,
  getChangedFiles,
  isAllowedProtectedChange,
  printList,
  readJson
} from "./lib.mjs";

const policy = readJson(".agent/policy.json");
const task = readJson(".agent/task.json");
const changedFiles = getChangedFiles();
const protectedChanges = findProtectedChanges(changedFiles, policy);
const unauthorized = protectedChanges.filter((change) => !isAllowedProtectedChange(change, task));

console.log("Agent protected-file check");
console.log(`Task: ${task.id} - ${task.title}`);
console.log("");

printList("Changed files:", changedFiles);
console.log("");

if (protectedChanges.length === 0) {
  console.log("Protected changes: none");
  process.exit(0);
}

console.log("Protected changes:");
for (const change of protectedChanges) {
  const allowed = isAllowedProtectedChange(change, task) ? "allowed by task" : "not allowed by task";
  console.log(`  - ${change.filePath} [${change.risk}] ${allowed}`);
  console.log(`    ${change.reason}`);
}

if (unauthorized.length > 0) {
  console.error("");
  console.error("FAIL: protected files changed without explicit task permission.");
  process.exit(1);
}

console.log("");
console.log("PASS: protected changes are explicitly allowed by the current task.");
