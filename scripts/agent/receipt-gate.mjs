#!/usr/bin/env node
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const migrationPath = "supabase/migrations/20260527090000_create_hirewire_receipts.sql";
const writerPath = "lib/receipts/writer.ts";
const workflowPath = ".github/workflows/agent-gates.yml";
const artifactDir = path.join(root, ".agent/receipts");

const requiredMigrationTokens = [
  "create table if not exists public.hirewire_receipts",
  "receipt_id text",
  "user_id uuid",
  "job_id uuid",
  "domain_event_id text",
  "receipt_type text",
  "action text",
  "details jsonb",
  "verification_hash text",
  "parent_receipt_id uuid",
  "signer_key_id text",
  "signature text",
  "algo text",
  "nonce text",
  "submitted_by uuid",
  "delegation_level text",
  "prevent_hirewire_receipt_mutation",
];

const requiredWriterTokens = [
  "writeHireWireReceipt",
  "buildDomainEventReceiptInput",
  "writeDomainEventReceipt",
  "createVerificationHash",
  "payload_keys",
];

const requiredWorkflowTokens = [
  "Agent receipt gate",
  "Upload receipt artifacts",
  ".agent/receipts",
];

const findings = [
  ...checkFile(migrationPath, requiredMigrationTokens),
  ...checkFile(writerPath, requiredWriterTokens),
  ...checkFile(workflowPath, requiredWorkflowTokens),
];

const passed = findings.length === 0;
const receipt = {
  id: `agent_receipt_${Date.now()}`,
  createdAt: new Date().toISOString(),
  type: "agent.gate_verified",
  action: "receipt_gate",
  status: passed ? "pass" : "fail",
  checkedFiles: [migrationPath, writerPath, workflowPath],
  findings,
};

const hash = createHash("sha256")
  .update(JSON.stringify(sortForHash(receipt)))
  .digest("hex");
const receiptWithHash = { ...receipt, verification_hash: hash };

mkdirSync(artifactDir, { recursive: true });
writeFileSync(
  path.join(artifactDir, "receipt-gate.json"),
  `${JSON.stringify(receiptWithHash, null, 2)}\n`,
  "utf8",
);

console.log("Agent receipt gate");
console.log(`Artifact: .agent/receipts/receipt-gate.json`);

if (passed) {
  console.log("PASS: receipt schema, writer, and CI artifact wiring are present.");
  process.exit(0);
}

for (const finding of findings) {
  console.log(`  - ${finding.file}: missing ${finding.token}`);
}

console.error("");
console.error("FAIL: receipt-backed verification gate is incomplete.");
process.exit(1);

function checkFile(relativePath, tokens) {
  const fullPath = path.join(root, relativePath);
  if (!existsSync(fullPath)) {
    return [{ file: relativePath, token: "file exists" }];
  }

  const content = readFileSync(fullPath, "utf8").toLowerCase();
  return tokens
    .filter((token) => !content.includes(token.toLowerCase()))
    .map((token) => ({ file: relativePath, token }));
}

function sortForHash(value) {
  if (value === null || typeof value !== "object") return value;
  if (Array.isArray(value)) return value.map(sortForHash);
  return Object.keys(value)
    .sort()
    .reduce((next, key) => {
      next[key] = sortForHash(value[key]);
      return next;
    }, {});
}
