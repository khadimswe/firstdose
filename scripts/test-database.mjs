import assert from "node:assert/strict";
import { spawn, spawnSync } from "node:child_process";
import { readFileSync, readdirSync, existsSync, unlinkSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { setTimeout as delay } from "node:timers/promises";

// Disposable local database only: no host port, credentials, or hosted connection.
const root = fileURLToPath(new URL("../", import.meta.url));
const container = `firstdose-db-test-${process.pid}-${Date.now()}`;
const image = process.env.FIRSTDOSE_TEST_POSTGRES_IMAGE || "postgres:16-alpine";
function docker(args, input) {
  return spawnSync("docker", args, { input, encoding: "utf8", timeout: 60_000 });
}
const psqlArgs = ["exec", "-i", container, "psql", "-X", "-qAt", "-v", "ON_ERROR_STOP=1", "-U", "postgres"];
function sql(query, role = "service_role") {
  const result = docker(psqlArgs, `SET ROLE ${role};\n${query}`);
  assert.equal(result.status, 0, result.stderr || String(result.error));
  return result.stdout.trim();
}
function fails(query, pattern, role = "service_role") {
  const result = docker(psqlArgs, `\\set VERBOSITY verbose\nSET ROLE ${role};\n${query}`);
  assert.notEqual(result.status, 0, "query unexpectedly succeeded");
  assert.match(result.stderr, pattern);
}
function parallelSql(query) {
  return new Promise((resolve, reject) => {
    const child = spawn("docker", psqlArgs, { stdio: "pipe" });
    let stdout = "", stderr = "";
    child.stdout.on("data", (chunk) => { stdout += chunk; });
    child.stderr.on("data", (chunk) => { stderr += chunk; });
    child.on("error", reject);
    child.on("close", (status) => resolve({ status, stdout, stderr }));
    child.stdin.end(`SET ROLE service_role;\n${query}`);
  });
}
const literal = (value) => `'${JSON.stringify(value).replaceAll("'", "''")}'::jsonb`;
const event = (id, extra = {}) => ({
  id, case_id: "rx_001", at: "2026-09-26T14:00:00.000Z", actor: "doctor", type: "prescribed",
  status_text: null, reject_code: null, note: "", reason: null, fix: null, amount_usd: null,
  wrist: null, side: "practice", ...extra,
});
const snapshot = () => JSON.parse(sql("SELECT public.fd_snapshot();"));
const commit = (state, events) => `SELECT public.fd_commit('${state.run_id}', ${state.revision}, ${literal(events)});`;
let passed = 0;
async function check(name, fn) { await fn(); passed++; console.log(`PASS ${name}`); }

try {
  const started = docker(["run", "--detach", "--rm", "--name", container, "--network", "none", "-e", "POSTGRES_HOST_AUTH_METHOD=trust", image]);
  assert.equal(started.status, 0, started.stderr);
  let ready = false;
  for (let i = 0; i < 60; i++) {
    // The image's initialization server is socket-only; wait for the final server.
    if (docker(["exec", container, "pg_isready", "-h", "127.0.0.1", "-U", "postgres"]).status === 0) { ready = true; break; }
    await delay(500);
  }
  assert.ok(ready, "local PostgreSQL did not become ready");
  sql("CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role BYPASSRLS; GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role; ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated;", "postgres");
  const migrations = `${root}/supabase/migrations`;
  if (existsSync(migrations)) for (const file of readdirSync(migrations).filter((name) => name.endsWith(".sql")).sort()) sql(readFileSync(`${migrations}/${file}`, "utf8"), "postgres");

  await check("migration creates an empty active snapshot", () => {
    const state = snapshot();
    assert.match(state.run_id, /^[0-9a-f-]{36}$/);
    assert.equal(state.revision, 0);
    assert.deepEqual(state.events, []);
  });
  const seed = spawnSync(process.execPath, ["--import", "tsx", "scripts/seed.ts"], { cwd: root, encoding: "utf8" });
  assert.equal(seed.status, 0, seed.stderr);
  await check("seed stdout and --output emit identical SQL", () => {
    const output = join(tmpdir(), `${container}-seed.sql`);
    try {
      const saved = spawnSync(process.execPath, ["--import", "tsx", "scripts/seed.ts", "--output", output], { cwd: root, encoding: "utf8" });
      assert.equal(saved.status, 0, saved.stderr);
      assert.equal(saved.stdout, "");
      assert.equal(readFileSync(output, "utf8"), seed.stdout);
    } finally { if (existsSync(output)) unlinkSync(output); }
  });
  await check("seed is repeatable and retains placeholder labels", () => {
    sql(seed.stdout); sql(seed.stdout);
    assert.equal(sql("SELECT count(*) FROM patients;"), "2");
    assert.equal(sql("SELECT count(*) FROM drugs;"), "2");
    assert.equal(sql("SELECT count(*) FROM rx_cases;"), "2");
    const expected = JSON.parse(readFileSync(`${root}/mock/labels.json`, "utf8")).labels;
    const actual = JSON.parse(sql("SELECT jsonb_agg(to_jsonb(l) ORDER BY drug_id) FROM labels l;"));
    assert.deepEqual(actual, expected.sort((a,b) => a.drug_id.localeCompare(b.drug_id)));
    sql("UPDATE labels SET fetched_at='2026-09-26T14:00:00Z', byte_exact=true WHERE drug_id='drug_otezla';");
    sql(seed.stdout);
    assert.equal(sql("SELECT byte_exact FROM labels WHERE drug_id='drug_otezla';"), "t");
  });
  await check("browser roles cannot read tables or invoke RPCs", () => {
    for (const role of ["anon", "authenticated"]) {
      for (const table of ["patients", "drugs", "rx_cases", "labels", "demo_runs", "active_run", "fill_events", "notification_outbox"]) {
        fails(`SELECT * FROM public.${table};`, /42501.*permission denied/s, role);
        assert.equal(sql(`SELECT has_table_privilege('${role}', 'public.${table}', 'SELECT,INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER');`, "postgres"), "f");
        assert.equal(sql(`SELECT relrowsecurity FROM pg_class WHERE oid='public.${table}'::regclass;`, "postgres"), "t");
      }
      fails("SELECT public.fd_snapshot();", /42501.*permission denied/s, role);
      const state = snapshot();
      fails(commit(state, []), /42501.*permission denied/s, role);
      fails(`SELECT public.fd_reset('${state.run_id}');`, /42501.*permission denied/s, role);
    }
  });
  await check("commit preserves event shape/order and queues only wrist events", () => {
    const state = snapshot();
    const events = [event("ev_01"), event("ev_06", { actor: "system", type: "alert_sent", wrist: "Prepared demo alert." })];
    const after = JSON.parse(sql(commit(state, events)));
    assert.equal(after.revision, 1);
    assert.deepEqual(after.events, events);
    assert.deepEqual(snapshot(), after);
    assert.equal(sql("SELECT string_agg(sequence::text, ',' ORDER BY sequence) FROM fill_events;"), "1,2");
    assert.equal(sql("SELECT script_id || ':' || status || ':' || wrist FROM notification_outbox;"), "ev_06:pending:Prepared demo alert.");
  });
  await check("empty retry checks identity/revision without advancing revision", () => {
    const state = snapshot();
    assert.deepEqual(JSON.parse(sql(commit(state, []))), state);
    fails(commit({ ...state, revision: 0 }, []), /P0001:.*revision_conflict/s);
  });
  await check("duplicate and malformed batches roll back events and outbox", () => {
    const before = snapshot();
    for (const batch of [
      [event("ev_09", { wrist: "Queue must roll back." }), event("ev_01")],
      [event("ev_09"), event("ev_09")],
      [event("ev_09", { wrist: "Queue must roll back." }), event("ev_bad", { case_id: "missing" })],
      [event("ev_bad", { at: 1 })], [event("ev_bad", { at: "2026-02-30T00:00:00Z" })],
      [event("ev_bad", { actor: "invalid" })], [event("ev_bad", { wrist: 12 })],
      [event("ev_bad", { surprise: true })], [event("ev_bad", { note: null })],
      [event("ev_bad", { reason: "made_up" })], [event("ev_bad", { fix: "made_up" })],
      [event("ev_bad", { side: "ascend" })], [event("ev_bad", { wrist: "x".repeat(201) })],
      [event("ev_bad", { status_text: 7 })], [event("ev_bad", { amount_usd: "410" })],
      [event("ev_bad", { case_id: undefined })],
    ]) {
      fails(commit(before, batch), /ERROR/);
      assert.deepEqual(snapshot(), before);
      assert.equal(sql("SELECT count(*) FROM notification_outbox;"), "1");
    }
    fails(`SELECT fd_commit('${before.run_id}', ${before.revision}, NULL);`, /22023/);
    fails(`SELECT fd_commit('${before.run_id}', ${before.revision}, '{}');`, /22023/);
  });
  await check("reset retains history, rejects stale writes, and permits new-run IDs", () => {
    const before = snapshot();
    const after = JSON.parse(sql(`SELECT fd_reset('${before.run_id}');`));
    assert.notEqual(after.run_id, before.run_id);
    assert.equal(after.revision, 0); assert.deepEqual(after.events, []);
    fails(commit(before, []), /P0001:.*stale_run/s);
    fails(commit(before, [event("ev_09")]), /P0001:.*stale_run/s);
    fails(`SELECT fd_reset('${before.run_id}');`, /P0001:.*stale_run/s);
    assert.equal(sql("SELECT count(*) FROM demo_runs;"), "2");
    assert.equal(sql("SELECT count(*) FROM fill_events;"), "2");
    const next = JSON.parse(sql(commit(after, [event("ev_01")])));
    assert.equal(next.events.length, 1);
    assert.equal(sql(`SELECT sequence FROM fill_events WHERE run_id='${after.run_id}';`), "1");
  });
  await check("concurrent commits admit one revision winner", async () => {
    const before = snapshot();
    const results = await Promise.all([
      parallelSql(`BEGIN; ${commit(before, [event("ev_05", { wrist: "Alert A" })])} SELECT pg_sleep(0.3); COMMIT;`),
      parallelSql(`BEGIN; ${commit(before, [event("ev_06", { wrist: "Alert B" })])} SELECT pg_sleep(0.3); COMMIT;`),
    ]);
    assert.equal(results.filter((r) => r.status === 0).length, 1);
    assert.match(results.find((r) => r.status !== 0).stderr, /revision_conflict/);
    const after = snapshot();
    assert.equal(after.revision, before.revision + 1);
    assert.equal(after.events.length, before.events.length + 1);
    assert.equal(sql(`SELECT count(*) FROM notification_outbox WHERE run_id='${before.run_id}';`), "1");
  });
  await check("concurrent reset/commit never repopulates the new run", async () => {
    const before = snapshot();
    const results = await Promise.all([
      parallelSql(`BEGIN; ${commit(before, [event("ev_09", { wrist: "Old run alert" })])} SELECT pg_sleep(0.3); COMMIT;`),
      parallelSql(`BEGIN; SELECT fd_reset('${before.run_id}'); SELECT pg_sleep(0.3); COMMIT;`),
    ]);
    assert.equal(results[1].status, 0, results[1].stderr);
    if (results[0].status !== 0) assert.match(results[0].stderr, /stale_run/);
    const after = snapshot();
    assert.notEqual(after.run_id, before.run_id);
    assert.equal(after.revision, 0);
    assert.deepEqual(after.events, []);
    assert.equal(sql(`SELECT count(*) FROM notification_outbox WHERE run_id='${after.run_id}';`), "0");
  });
  await check("concurrent resets create exactly one successor", async () => {
    const before = snapshot();
    const count = Number(sql("SELECT count(*) FROM demo_runs;"));
    const results = await Promise.all([1, 2].map(() => parallelSql(`BEGIN; SELECT fd_reset('${before.run_id}'); SELECT pg_sleep(0.3); COMMIT;`)));
    assert.equal(results.filter((r) => r.status === 0).length, 1);
    assert.match(results.find((r) => r.status !== 0).stderr, /stale_run/);
    assert.equal(Number(sql("SELECT count(*) FROM demo_runs;")), count + 1);
  });
  await check("Maria command planner persists through the real database", () => {
    const smoke = spawnSync(process.execPath, ["--import", "tsx", "scripts/persistence-smoke.ts", container], {
      cwd: root, encoding: "utf8", timeout: 60_000,
    });
    assert.equal(smoke.status, 0, smoke.stderr || String(smoke.error));
    process.stdout.write(smoke.stdout);
  });
  console.log(`${passed} database checks passed (${image}).`);
} finally {
  const stopped = docker(["rm", "--force", container]);
  if (stopped.status !== 0) {
    console.error(`Local test container cleanup failed: ${stopped.stderr}`);
    process.exitCode = 1;
  }
}
