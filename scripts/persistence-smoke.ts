import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { executeCommand, PersistenceError, type Snapshot, type WorkflowStore } from "../lib/server/commands";

// Invoked by test-database.mjs against its disposable container, never hosted state.
const container = process.argv[2];
if (!/^firstdose-db-test-\d+-\d+$/.test(container ?? "")) throw new Error("Expected the disposable test container name.");
const literal = (value: unknown) => `'${JSON.stringify(value).replaceAll("'", "''")}'::jsonb`;
async function query(sql: string): Promise<Snapshot> {
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

  await command({ kind: "fire", ids: ["ev_04", "ev_05"] });
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
  assert.ok(fill.snapshot.events.every(e => !["started", "recovered"].includes(e.type)));
  assert.ok(fill.snapshot.events.every((e, i, all) => i === 0 || Date.parse(String(e.at)) > Date.parse(String(all[i - 1].at))));
  console.log("PASS integrated independent pharmacy signal and ordered timestamps");

  const next = await store.reset(state.run_id);
  await assert.rejects(command(prescribe), { code: "stale_run" });
  assert.deepEqual(await store.snapshot(), next);
  await executeCommand(store, next.run_id, prescribe);
  assert.deepEqual((await store.snapshot()).events.map(e => e.id), ["ev_01", "ev_03"]);
  console.log("PASS integrated reset fences old devices and allows a new run");
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
