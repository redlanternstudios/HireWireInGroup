#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;
const baseUrl = `${supabaseUrl ?? ""}/rest/v1`;
const outDir = ".agent/receipts";

function hash(value) {
  return crypto.createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

async function restGet(table, query) {
  if (!supabaseUrl || !serviceKey) {
    return { ok: false, status: 0, data: [], error: "missing Supabase service env" };
  }

  const res = await fetch(`${baseUrl}/${table}?${query}`, {
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      Accept: "application/json",
    },
  });

  if (!res.ok) {
    return { ok: false, status: res.status, data: [], error: await res.text() };
  }

  return { ok: true, status: res.status, data: await res.json(), error: null };
}

async function countRows(table, extra = "") {
  const query = `select=id&limit=1${extra ? `&${extra}` : ""}`;
  const result = await restGet(table, query);
  return {
    table,
    reachable: result.ok,
    hasRows: Array.isArray(result.data) && result.data.length > 0,
    sampleId: Array.isArray(result.data) ? result.data[0]?.id ?? null : null,
    error: result.ok ? null : result.error,
  };
}

const checks = [
  await countRows("evidence_library"),
  await countRows("job_scores"),
  await countRows("domain_events"),
  await countRows("hirewire_receipts"),
  await countRows("ai_routing_decisions"),
  await countRows("ai_generation_audit_logs"),
  await countRows("usage_records", "resource_type=eq.document_generation"),
  await countRows("generation_governance_runs"),
  await countRows("generation_quality_checks"),
];

const blocker = !supabaseUrl || !serviceKey;
const missing = checks.filter((check) => !check.reachable || !check.hasRows);
const status = blocker ? "blocked" : missing.length === 0 ? "passed" : "needs_live_e2e";
const receipt = {
  id: `proof_pass_${Date.now()}`,
  createdAt: new Date().toISOString(),
  type: "agent.proof_pass",
  status,
  checks,
  notes: blocker
    ? ["Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to query live proof artifacts."]
    : missing.length
      ? ["Run one live generation flow, then rerun this proof pass to confirm all artifact tables populated."]
      : ["All audited artifact tables are reachable and populated."],
};

const withHash = { ...receipt, verification_hash: hash(receipt) };
fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, "proof-pass.json"), `${JSON.stringify(withHash, null, 2)}\n`);

console.log("HireWire proof pass");
console.log(`Status: ${status}`);
for (const check of checks) {
  const verdict = check.reachable && check.hasRows ? "ok" : check.reachable ? "empty" : "unreachable";
  console.log(`  - ${check.table}: ${verdict}`);
}
console.log("Artifact: .agent/receipts/proof-pass.json");

if (status === "blocked") process.exit(2);
if (status === "needs_live_e2e") process.exit(1);
