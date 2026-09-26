import assert from "node:assert/strict";
import { spawn, spawnSync } from "node:child_process";
import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { setTimeout as delay } from "node:timers/promises";

// Isolated local PostgreSQL only; no host connection or private environment.
const root = fileURLToPath(new URL("../", import.meta.url));
const container = `firstdose-message-test-${process.pid}-${Date.now()}`;
const docker = (args, input) => spawnSync("docker", args, { input, encoding: "utf8", timeout: 60_000 });
const args = ["exec", "-i", container, "psql", "-X", "-qAt", "-v", "ON_ERROR_STOP=1", "-U", "postgres"];
function sql(query, role = "service_role") {
  const result = docker(args, `SET ROLE ${role};\n${query}`);
  assert.equal(result.status, 0, result.stderr);
  return result.stdout.trim();
}
function fails(query, pattern, role = "service_role") {
  const result = docker(args, `SET ROLE ${role};\n${query}`);
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, pattern);
}
function parallel(query) {
  return new Promise((resolve, reject) => {
    const child = spawn("docker", args, { stdio: "pipe" });
    let stderr = "";
    child.stderr.on("data", chunk => { stderr += chunk; });
    child.on("error", reject);
    child.on("close", status => resolve({ status, stderr }));
    child.stdin.end(`SET ROLE service_role;\n${query}`);
  });
}
const snapshot = () => JSON.parse(sql("SELECT fd_patient_message_snapshot();"));
const command = (run, action, lang = null, caseId = "rx_001") => `SELECT fd_patient_message_command('${run}', '${action}', '${caseId}', ${lang === null ? "NULL" : `'${lang}'`});`;
function fix(run, revision, fix = "RESEND_COPAY_CARD") {
  return `SELECT fd_commit('${run}', ${revision}, '${JSON.stringify([{ id: "ev_test_fix", case_id: "rx_001", at: "2026-09-26T16:00:00Z", actor: "coordinator", type: "fix_sent", status_text: null, reject_code: null, note: "", reason: null, fix, amount_usd: null, wrist: null, side: "practice" }])}'::jsonb);`;
}
let passed = 0;
const check = async (name, fn) => { await fn(); passed++; console.log(`PASS ${name}`); };
try {
  const started = docker(["run", "--detach", "--rm", "--name", container, "--network", "none", "-e", "POSTGRES_HOST_AUTH_METHOD=trust", "postgres:16-alpine"]);
  assert.equal(started.status, 0, started.stderr);
  let ready = false;
  for (let i = 0; i < 60; i++) {
    if (docker(["exec", container, "pg_isready", "-h", "127.0.0.1", "-U", "postgres"]).status === 0) { ready = true; break; }
    await delay(500);
  }
  assert.ok(ready);
  sql("CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role BYPASSRLS; GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role; ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated;", "postgres");
  for (const file of readdirSync(`${root}/supabase/migrations`).filter(name => name.endsWith(".sql")).sort()) sql(readFileSync(`${root}/supabase/migrations/${file}`, "utf8"), "postgres");
  const seed = spawnSync(process.execPath, ["--import", "tsx", "scripts/seed.ts"], { cwd: root, encoding: "utf8" });
  assert.equal(seed.status, 0, seed.stderr); sql(seed.stdout);
  await check("only a current-run copay fix permits approval", () => {
    const before = snapshot();
    assert.deepEqual(before.messages, []);
    fails(command(before.run_id, "approve", "es"), /invalid_transition/);
    fails(command(before.run_id, "acknowledge"), /invalid_transition/);
    sql(fix(before.run_id, before.revision, "ACCESS_SUPPORT"));
    fails(command(before.run_id, "approve", "es"), /invalid_transition/);
    const next = JSON.parse(sql(`SELECT fd_reset('${before.run_id}');`));
    fails(command(next.run_id, "approve", "es"), /invalid_transition/);
    sql(fix(next.run_id, next.revision));
  });
  await check("concurrent approvals persist once and cannot change language", async () => {
    const before = snapshot();
    const results = await Promise.all([parallel(command(before.run_id, "approve", "es")), parallel(command(before.run_id, "approve", "es"))]);
    for (const result of results) assert.equal(result.status, 0, result.stderr);
    const approved = snapshot();
    assert.equal(approved.revision, before.revision + 1);
    assert.equal(approved.messages[0].lang, "es");
    assert.equal(approved.messages[0].template_id, "patient_message_v1");
    assert.equal(approved.messages[0].acknowledged_at, null);
    assert.deepEqual(JSON.parse(sql(command(before.run_id, "approve", "es"))), approved);
    fails(command(before.run_id, "approve", "en"), /invalid_transition/);
    assert.deepEqual(snapshot(), approved);
  });
  await check("acknowledgment persists once without fill or notification side effects", async () => {
    const before = snapshot();
    const fills = sql("SELECT count(*) FROM fill_events;");
    const outbox = sql("SELECT count(*) FROM notification_outbox;");
    const results = await Promise.all([parallel(command(before.run_id, "acknowledge")), parallel(command(before.run_id, "acknowledge"))]);
    for (const result of results) assert.equal(result.status, 0, result.stderr);
    const after = snapshot();
    assert.equal(after.revision, before.revision + 1);
    assert.equal(after.messages[0].approved_at, before.messages[0].approved_at);
    assert.ok(Date.parse(after.messages[0].acknowledged_at) >= Date.parse(after.messages[0].approved_at));
    assert.equal(sql("SELECT count(*) FROM fill_events;"), fills);
    assert.equal(sql("SELECT count(*) FROM notification_outbox;"), outbox);
    assert.deepEqual(JSON.parse(sql(command(before.run_id, "acknowledge"))), after);
  });
  await check("SQL rejects arbitrary case, language and actions", () => {
    const before = snapshot();
    for (const query of [command(before.run_id, "approve", "fr"), command(before.run_id, "approve", "en", "rx_002"), command(before.run_id, "delete"), command(before.run_id, "acknowledge", "es"), command(before.run_id, "approve")]) fails(query, /invalid_command/);
    assert.deepEqual(snapshot(), before);
  });
  await check("reset fences concurrent old writes and retains approvals/acknowledgments", async () => {
    const before = snapshot();
    const results = await Promise.all([parallel(`BEGIN; SELECT fd_reset('${before.run_id}'); SELECT pg_sleep(0.2); COMMIT;`), parallel(command(before.run_id, "acknowledge"))]);
    assert.equal(results[0].status, 0, results[0].stderr);
    if (results[1].status !== 0) assert.match(results[1].stderr, /stale_run/);
    assert.deepEqual(snapshot().messages, []);
    fails(command(before.run_id, "approve", "es"), /stale_run/);
    fails(command(snapshot().run_id, "approve", "en"), /invalid_transition/);
    assert.equal(sql(`SELECT count(*) FROM patient_messages WHERE run_id='${before.run_id}';`), "1");
    assert.equal(sql(`SELECT count(*) FROM patient_message_acknowledgments WHERE run_id='${before.run_id}';`), "1");
  });
  await check("browser roles have no tables or RPC access", () => {
    for (const role of ["anon", "authenticated"]) {
      for (const table of ["patient_messages", "patient_message_acknowledgments"]) {
        fails(`SELECT * FROM ${table};`, /permission denied/, role);
        assert.equal(sql(`SELECT has_table_privilege('${role}', '${table}', 'SELECT,INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER');`, "postgres"), "f");
        assert.equal(sql(`SELECT relrowsecurity FROM pg_class WHERE oid='public.${table}'::regclass;`, "postgres"), "t");
      }
      fails("SELECT fd_patient_message_snapshot();", /permission denied/, role);
      fails(command(snapshot().run_id, "approve", "en"), /permission denied/, role);
    }
  });
  console.log(`${passed} patient-message PostgreSQL checks passed.`);
} finally {
  const cleanup = docker(["rm", "--force", container]);
  if (cleanup.status !== 0) { console.error(cleanup.stderr); process.exitCode = 1; }
}
