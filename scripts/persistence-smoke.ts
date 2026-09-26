import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { executeCommand, PersistenceError, type Snapshot, type WorkflowStore } from "../lib/server/commands";

// Invoked by test-database.mjs against its disposable container, never hosted state.
const container = process.argv[2];
if (!/^firstdose-db-test-\d+-\d+$/.test(container ?? "")) throw new Error("Expected the disposable test container name.");
const literal = (value: unknown) => `'${JSON.stringify(value).replaceAll("'", "''")}'::jsonb`;
async function query<T = Snapshot>(sql: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const child = spawn("docker", ["exec", "-i", container, "psql", "-X", "-qAt", "-v", "ON_ERROR_STOP=1", "-U", "postgres"], { stdio: "pipe" });
    let output = "", error = "";
    child.stdout.on("data", chunk => { output += chunk; });
    child.stderr.on("data", chunk => { error += chunk; });
    child.on("error", reject);
    child.on("close", code => {
      if (code !== 0) {
        const conflict = error.includes("stale_run") ? "stale_run" : error.includes("revision_conflict") ? "revision_conflict" : "unavailable";
        reject(new PersistenceError(conflict));
      } else {
        try { resolve(JSON.parse(output.trim())); } catch (error) { reject(error); }
      }
    });
    child.stdin.end(`SET ROLE service_role;\n${sql}`);
  });
}
const store: WorkflowStore = {
  snapshot: () => query("SELECT fd_snapshot();"),
  commit: (run, revision, events) => query(`SELECT fd_commit('${run}', ${revision}, ${literal(events)});`),
  reset: run => query(`SELECT fd_reset('${run}');`),
};
async function main() {
  const before = await store.snapshot();
  const state = await store.reset(before.run_id);
  const command = (value: unknown) => executeCommand(store, state.run_id, value);
  const prescribe = { kind: "prescribe", patient_id: "pt_maria", drug_id: "drug_otezla" };
  const first = await Promise.all([command(prescribe), command(prescribe)]);
  assert.deepEqual(first.map(r => r.inserted.length).sort(), [0, 2]);
  console.log("PASS integrated concurrent prescriptions commit once");

  const barrier = { kind: "fire", ids: ["ev_04", "ev_05"] };
  const alerts = await Promise.all([command(barrier), command(barrier)]);
  assert.deepEqual(alerts.map(result => result.inserted.length).sort(), [0, 3]);
  const alertState = await store.snapshot();
  const appAlerts = alertState.events.filter(event => event.type === "alert_sent");
  assert.equal(appAlerts.length, 1);
  assert.equal(appAlerts[0].id, "ev_06");
  assert.equal(appAlerts[0].wrist, "Maria: Otezla first fill pending. Declined at price ($410 demo).");
  const queued = await query<{ script_id: string; wrist: string; status: string; attempts: number }[]>(
    `SELECT jsonb_agg(jsonb_build_object('script_id', script_id, 'wrist', wrist, 'status', status, 'attempts', attempts)) FROM notification_outbox WHERE run_id='${state.run_id}';`,
  );
  assert.deepEqual(queued, [{ script_id: "ev_06", wrist: appAlerts[0].wrist, status: "pending", attempts: 0 }]);
  console.log("PASS integrated concurrent reason commands create one app alert and pending outbox entry");
  await command({ kind: "handoff", case_id: "rx_001" });
  await command({ kind: "fix", case_id: "rx_001", fix: "RESEND_COPAY_CARD" });
  await command({ kind: "use_card", case_id: "rx_001" });
  const acknowledged = await store.snapshot();
  assert.equal(acknowledged.events.at(-1)?.id, "ev_10");
  assert.ok(!acknowledged.events.some(e => e.status_text === "Dispensed"));
  console.log("PASS integrated patient acknowledgment leaves fill pending");

  await command({ kind: "use_card", case_id: "rx_001" });
  assert.deepEqual(await store.snapshot(), acknowledged);
  const fill = await command({ kind: "fire", ids: ["ev_11"] });
  assert.deepEqual(fill.inserted.map(e => e.id), ["ev_11"]);
  assert.equal(fill.inserted[0].status_text, "Dispensed");
  assert.equal(fill.inserted[0].wrist, "Maria: Otezla pharmacy fill confirmed.");
  await command({ kind: "fire", ids: ["ev_11"] });
  const finalQueue = await query<{ script_id: string; wrist: string }[]>(
    `SELECT jsonb_agg(jsonb_build_object('script_id', script_id, 'wrist', wrist) ORDER BY script_id) FROM notification_outbox WHERE run_id='${state.run_id}';`,
  );
  assert.deepEqual(finalQueue, [
    { script_id: "ev_06", wrist: appAlerts[0].wrist },
    { script_id: "ev_11", wrist: fill.inserted[0].wrist },
  ]);
  console.log("PASS independent fill queues one second wrist alert despite duplicate command");
  assert.ok(fill.snapshot.events.every(e => !["started", "recovered"].includes(e.type)));
  assert.ok(fill.snapshot.events.every((e, i, all) => i === 0 || Date.parse(String(e.at)) > Date.parse(String(all[i - 1].at))));
  console.log("PASS integrated independent pharmacy signal and ordered timestamps");

  const next = await store.reset(state.run_id);
  await assert.rejects(command(prescribe), { code: "stale_run" });
  assert.deepEqual(await store.snapshot(), next);
  await executeCommand(store, next.run_id, prescribe);
  assert.deepEqual((await store.snapshot()).events.map(e => e.id), ["ev_01", "ev_03"]);
  console.log("PASS integrated reset fences old devices and allows a new run");

  const weekRun = await store.reset(next.run_id);
  const seedCommand = { kind: "seed_week" };
  const seeds = await Promise.all([
    executeCommand(store, weekRun.run_id, seedCommand),
    executeCommand(store, weekRun.run_id, seedCommand),
  ]);
  assert.deepEqual(seeds.map(result => result.inserted.length).sort((a, b) => a - b), [0, 38]);
  const seeded = await store.snapshot();
  assert.equal(seeded.revision, 1);
  assert.equal(seeded.events.length, 38);
  assert.equal(new Set(seeded.events.map(event => event.case_id)).size, 13);
  assert.equal(seeded.events.filter(event => event.actor === "pharmacy" && event.status_text === "Dispensed").length, 8);
  assert.ok(seeded.events.every(event => event.wrist === null));
  assert.equal(await query<number>(`SELECT count(*) FROM notification_outbox WHERE run_id='${weekRun.run_id}';`), 0);
  console.log("PASS integrated seed-week double tap writes 13 cases once without notifications");

  const fix = await executeCommand(store, weekRun.run_id, { kind: "fix", case_id: "week_rx_01", fix: "ACCESS_SUPPORT" });
  assert.equal(fix.inserted[0].type, "fix_sent");
  await executeCommand(store, weekRun.run_id, prescribe);
  const weekAfter = await store.snapshot();
  assert.ok(weekAfter.events.some(event => event.id === "ev_01"));
  const retry = await executeCommand(store, weekRun.run_id, seedCommand);
  assert.deepEqual(retry.inserted, []);
  assert.deepEqual(retry.snapshot, weekAfter);
  const afterWeek = await store.reset(weekRun.run_id);
  await assert.rejects(executeCommand(store, weekRun.run_id, seedCommand), { code: "stale_run" });
  assert.deepEqual((await store.snapshot()).events, []);
  const reseeded = await executeCommand(store, afterWeek.run_id, seedCommand);
  assert.deepEqual(reseeded.inserted.map(event => event.id), seeded.events.map(event => event.id));
  console.log("PASS integrated seed-week fixes, Maria continuation and reset preserve run isolation");
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
