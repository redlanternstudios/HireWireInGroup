#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { readJson } from "./lib.mjs";

const target = getArg("--target") ?? "codex";
const task = readJson(".agent/task.json");
const policy = readJson(".agent/policy.json");
const taskBody = isMarkdownPath(task.source) ? readOptional(task.source) : "";
const criteriaBody = isMarkdownPath(task.acceptanceSource) ? readOptional(task.acceptanceSource) : "";

const common = [
  `Task: ${task.id} - ${task.title}`,
  "",
  `Goal: ${task.goal}`,
  "",
  "Allowed scope:",
  ...asBullets(task.allowedScope),
  "",
  "Forbidden scope:",
  ...asBullets(task.forbiddenScope),
  "",
  `Protected touch allowed: ${Boolean(task.protectedTouch?.allowed)}`,
  task.protectedTouch?.reason ? `Reason: ${task.protectedTouch.reason}` : "",
  "",
  "Verification:",
  ...asBullets(task.verification?.length ? task.verification : policy.requiredVerification),
  ""
].filter((line) => line !== "");

if (target === "claude-review") {
  print([
    "Review this HireWire diff against the current task and acceptance criteria.",
    "",
    ...common,
    "Review stance:",
    "- Findings first, ordered by severity.",
    "- Verify protected-file and scope compliance.",
    "- Do not rewrite the work unless explicitly asked.",
    "",
    "Acceptance criteria:",
    criteriaBody || "(No acceptance criteria markdown found.)"
  ]);
} else if (target === "v0") {
  print([
    "Build only the UI requested below for HireWire, an Application Readiness Engine.",
    "",
    ...common,
    "UI constraints:",
    "- Do not invent backend contracts.",
    "- Do not add fake buttons or placeholder behavior.",
    "- Preserve the existing design system and route structure.",
    "",
    "Task details:",
    taskBody || "(No task markdown found.)"
  ]);
} else {
  print([
    "You are implementing the current HireWire task.",
    "",
    "Read first:",
    "- CLAUDE.md",
    "- .agent/START_HERE.md",
    "- .agent/task.json",
    "",
    ...common,
    "Task details:",
    taskBody || "(No task markdown found.)"
  ]);
}

function getArg(name) {
  const arg = process.argv.find((value) => value.startsWith(`${name}=`));
  return arg ? arg.slice(name.length + 1) : null;
}

function readOptional(relativePath) {
  try {
    return readFileSync(relativePath, "utf8").trim();
  } catch {
    return "";
  }
}

function isMarkdownPath(value) {
  return typeof value === "string" && value.endsWith(".md");
}

function asBullets(items) {
  if (!Array.isArray(items) || items.length === 0) {
    return ["- none"];
  }

  return items.map((item) => `- ${item}`);
}

function print(lines) {
  console.log(lines.join("\n"));
}
