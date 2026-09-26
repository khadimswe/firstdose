import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { setTimeout as delay } from "node:timers/promises";

// Isolated PostgreSQL only: no published port, hosted URL or provider credentials.
const root = fileURLToPath(new URL("../", import.meta.url));
const container = `firstdose-coordinator-identity-${process.pid}-${Date.now()}`;
const docker = (args, input) => spawnSync("docker", args, { input, encoding: "utf8", timeout: 60_000 });
const psql = ["exec", "-i", container, "psql", "-X", "-qAt", "-v", "ON_ERROR_STOP=1", "-U", "postgres"];
function sql(query, role = "service_role") {
  const result = docker(psql, `SET ROLE ${role};\n${query}`);
  assert.equal(result.status, 0, result.stderr || String(result.error));
  return result.stdout.trim();
}
function fails(query, pattern, role = "service_role") {
  const result = docker(psql, `\\set VERBOSITY verbose\nSET ROLE ${role};\n${query}`);
  assert.notEqual(result.status, 0, "query unexpectedly succeeded");
  assert.match(result.stderr, pattern);
}
const snapshot = () => JSON.parse(sql("SELECT fd_snapshot();"));
const links = () => JSON.parse(sql("SELECT fd_coordinator_snapshot();"));
const command = (run, action, caseId = null) => `SELECT fd_coordinator_command('${run}', '${action}', 'coord_demo', 'prescriber_demo', ${caseId ? `'${caseId}'` : "NULL"});`;
function prescribe(caseId) {
  const state = snapshot();
  const event = { id: `ev_identity_${caseId}`, case_id: caseId, at: "2026-09-26T14:00:00.000Z", actor: "doctor", type: "prescribed", status_text: null, reject_code: null, note: "", reason: null, fix: null, amount_usd: null, wrist: null, side: "practice" };
  sql(`SELECT fd_commit('${state.run_id}', ${state.revision}, '${JSON.stringify([event])}'::jsonb);`);
}
try {
  const started = docker(["run", "--detach", "--rm", "--name", container, "--network", "none", "-e", "POSTGRES_HOST_AUTH_METHOD=trust", "postgres:16-alpine"]);
  assert.equal(started.status, 0, started.stderr);
  let ready = false;
  for (let i = 0; i < 60; i++) {
    if (docker(["exec", container, "pg_isready", "-h", "127.0.0.1", "-U", "postgres"]).status === 0) { ready = true; break; }
    await delay(500);
  }
  assert.ok(ready, "local PostgreSQL did not become ready");
  sql("CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role BYPASSRLS; GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;", "postgres");
  for (const file of readdirSync(`${root}/supabase/migrations`).filter(name => name.endsWith(".sql")).sort()) {
    sql(readFileSync(`${root}/supabase/migrations/${file}`, "utf8"), "postgres");
  }
  const seed = spawnSync(process.execPath, ["--import", "tsx", "scripts/seed.ts"], { cwd: root, encoding: "utf8", timeout: 30_000 });
  assert.equal(seed.status, 0, seed.stderr);
  sql(seed.stdout);
  const run = snapshot().run_id;

  // First test runs against the current catalog names, not the old display label.
  for (const id of ["rx_001", "rx_002"]) {
    fails(command(run, "assign", id), /P0001:.*invalid_transition/s);
  }
  prescribe("rx_001");
  fails(command(run, "assign", "rx_001"), /P0001:.*invalid_transition/s);
  sql(command(run, "request")); sql(command(run, "approve"));
  fails(command(run, "assign", "rx_002"), /P0001:.*invalid_transition/s);
  prescribe("rx_002");
  for (const id of ["rx_001", "rx_002"]) {
    const before = links();
    const assigned = JSON.parse(sql(command(run, "assign", id)));
    assert.equal(assigned.revision, before.revision + 1);
    assert.equal(assigned.cases.find(row => row.case_id === id).coordinator_id, "coord_demo");
    assert.deepEqual(JSON.parse(sql(command(run, "assign", id))), assigned);
  }
  console.log("PASS current catalog: both interactive cases require approval and prescription; retries preserve revision");
  const savedLinks = links();
  const identityMigration = readFileSync(`${root}/supabase/migrations/202609260006_coordinator_identity.sql`, "utf8");
  sql(identityMigration, "postgres"); sql(identityMigration, "postgres");
  assert.deepEqual(links(), savedLinks);
  console.log("PASS repeated identity migration preserves existing assignments and event history");

  // A new case must not acquire access by copying an interactive display name.
  sql(`INSERT INTO patients SELECT (jsonb_populate_record(NULL::patients,
    (SELECT to_jsonb(p) FROM patients p WHERE id='pt_maria') || '{"id":"pt_identity_other"}'::jsonb)).*;
    INSERT INTO rx_cases SELECT (jsonb_populate_record(NULL::rx_cases,
    (SELECT to_jsonb(c) FROM rx_cases c WHERE id='rx_001') || '{"id":"rx_identity_other","patient_id":"pt_identity_other"}'::jsonb)).*;`);
  const weekCase = JSON.parse(readFileSync(`${root}/data/demo-week.json`, "utf8")).cases[0].id;
  for (const id of ["rx_identity_other", weekCase]) {
    prescribe(id);
    const before = links();
    fails(command(run, "assign", id), /22023:.*invalid_command/s);
    assert.deepEqual(links(), before);
  }
  // Even the previous hard-coded label cannot grant a new case access.
  sql("UPDATE rx_cases SET prescriber_label='Dr. Demo (judge 1)' WHERE id='rx_identity_other';");
  fails(command(run, "assign", "rx_identity_other"), /22023:.*invalid_command/s);
  console.log("PASS background and arbitrary cases stay excluded despite matching display names");

  // Renaming interactive labels again must preserve the same stable identity mapping.
  sql("UPDATE rx_cases SET prescriber_label='Fictional renamed prescriber' WHERE id IN ('rx_001','rx_002');");
  const next = JSON.parse(sql(`SELECT fd_reset('${run}');`)).run_id;
  assert.ok(links().cases.every(row => row.coordinator_id === null));
  fails(command(run, "assign", "rx_001"), /P0001:.*stale_run/s);
  sql(command(next, "invite")); sql(command(next, "approve"));
  for (const id of ["rx_001", "rx_002"]) {
    prescribe(id);
    assert.equal(JSON.parse(sql(command(next, "assign", id))).cases.find(row => row.case_id === id).coordinator_id, "coord_demo");
  }
  assert.equal(sql("SELECT count(*) FROM notification_outbox;"), "0");
  for (const role of ["anon", "authenticated"]) {
    fails(command(next, "assign", "rx_001"), /42501:.*permission denied/s, role);
  }
  console.log("PASS relabel/reset keeps identity, stale-run rejection, browser-role denial and no watch side effects");
} finally {
  docker(["stop", "--time", "0", container]);
}
