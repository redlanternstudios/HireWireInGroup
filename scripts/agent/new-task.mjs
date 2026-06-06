#!/usr/bin/env node
import { writeFileSync } from "node:fs";
import { readJson } from "./lib.mjs";

const id = getArg("--id");
const title = getArg("--title");
const goal = getArg("--goal");

if (!id || !title || !goal) {
  console.error("Usage: npm run agent:new-task -- --id=my-task --title=\"My Task\" --goal=\"What this changes\"");
  process.exit(1);
}

const current = readJson(".agent/task.json");
const next = {
  version: 1,
  id,
  title,
  status: "active",
  source: "agent:new-task",
  goal,
  allowedScope: [],
  forbiddenScope: current.forbiddenScope ?? [],
  protectedTouch: {
    allowed: false,
    paths: [],
    reason: "Protected files require explicit human approval before editing."
  },
  acceptanceSource: ".agent/ACCEPTANCE_CRITERIA.md",
  verification: current.verification ?? [
    "npx tsc --noEmit",
    "npm run lint",
    "npm run build"
  ],
  requiresHumanApprovalFor: current.requiresHumanApprovalFor ?? [
    "auth",
    "rls",
    "billing",
    "readiness",
    "apply"
  ],
  rollbackNotesRequired: true
};

writeFileSync(".agent/task.json", `${JSON.stringify(next, null, 2)}\n`);
console.log(`Created .agent/task.json for ${id}. Fill allowedScope before editing files.`);

function getArg(name) {
  const arg = process.argv.find((value) => value.startsWith(`${name}=`));
  return arg ? arg.slice(name.length + 1) : null;
}
