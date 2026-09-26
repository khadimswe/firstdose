import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import pg from "pg";
import { createWorkflowStore } from "@/lib/server/supabase-workflow";
import { executeCommand } from "@/lib/server/commands";
import { createAnalyticsStore, EventConflictError } from "@/lib/server/analytics/store";
import { projectEvent, type MetricEvent } from "@/lib/server/analytics/project";
import { summarize } from "@/lib/server/analytics/summary";
import { replayRun } from "@/lib/server/analytics/replay";
import { readReplayedSummary } from "@/lib/server/replay-followup";

async function main() {
  const url = new URL(process.env.FIRSTDOSE_LOCAL_DATABASE_URL ?? "");
  assert.equal(url.hostname, "127.0.0.1");
  assert.ok(url.port);
  assert.equal(url.pathname, "/postgres");
  const pool = new pg.Pool({ connectionString: url.href, ssl: false, max: 4, connectionTimeoutMillis: 5_000, statement_timeout: 5_000, query_timeout: 6_000 });
  let check = "setup";
  try {
    await pool.query("CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role BYPASSRLS; GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;");
    for (const name of readdirSync("supabase/migrations").filter(name => name.endsWith(".sql")).sort()) await pool.query(readFileSync(`supabase/migrations/${name}`, "utf8"));
    const seeded = spawnSync(process.execPath, ["--import", "tsx", "scripts/seed.ts"], { encoding: "utf8" });
    assert.equal(seeded.status, 0);
    await pool.query(seeded.stdout);
    // Test the same ledger/table/query SQL on PostgreSQL, without claiming Timescale proof.
    const schema = readFileSync("scripts/analytics/schema.sql", "utf8").replace(/^SELECT create_hypertable[^\n]*\n/m, "");
    await pool.query(schema);
    const analytics = createAnalyticsStore(pool);
    const rpcArguments: Record<string, string[]> = {
      fd_snapshot: [], fd_commit: ["p_run_id", "p_revision", "p_events"], fd_reset: ["p_run_id"], fd_read_run: ["p_run_id"],
    };
    const source = createWorkflowStore({ env: { NEXT_PUBLIC_SUPABASE_URL: "https://local.test", SUPABASE_SECRET_KEY: "disposable-local-test" }, fetch: async (input, init) => {
      const rpc = new URL(String(input)).pathname.split("/").at(-1)!;
      assert.ok(Object.hasOwn(rpcArguments, rpc));
      const body = JSON.parse(String(init?.body));
      const values = rpcArguments[rpc].map(key => key === "p_events" ? JSON.stringify(body[key]) : body[key]);
      try {
        const result = await pool.query(`SELECT public.${rpc}(${values.map((_, i) => `$${i + 1}`).join(",")}) AS value`, values);
        return Response.json(result.rows[0].value);
      } catch (error) {
        const e = error as { code?: string; message?: string };
        return Response.json({ code: e.code, message: e.message }, { status: 400 });
      }
    } });
    const run = (await source.snapshot()).run_id;
    let tick = 0;
    const clock = () => new Date(Date.parse("2026-09-26T18:00:00Z") + tick++ * 60_000).toISOString();
    const act = (command: unknown) => executeCommand(source, run, command, clock, async () => "DECLINED_AT_PRICE");
    const key = "local-only-phase2-integration-hmac-key";
    const replay = (runId: string, read: typeof source.readCommittedEvents) => replayRun(runId, read, analytics.writeMetricBatch, key);
    const read = async () => readReplayedSummary(await source.snapshot(), { store: source, replayRun: replay, getSummary: analytics.getAccessSummary });

    check = "acknowledgment is not a fill";
    await act({ kind: "prescribe", patient_id: "pt_maria", drug_id: "drug_otezla" });
    await act({ kind: "fire", ids: ["ev_04", "ev_05"] });
    await act({ kind: "handoff", case_id: "rx_001" });
    await act({ kind: "fix", case_id: "rx_001", fix: "RESEND_COPAY_CARD" });
    await act({ kind: "use_card", case_id: "rx_001" });
    assert.equal((await read()).summary.recovered, 0);
    console.log(`PASS ${check}`);

    check = "independent pharmacy confirmation feeds real SQL summary";
    await act({ kind: "fire", ids: ["ev_11"] });
    const completed = await read();
    const history = await source.readCommittedEvents(run);
    const metrics = history.map(event => projectEvent(event, key)).filter((event): event is MetricEvent => event !== null);
    assert.equal(completed.summary.recovered, 1);
    assert.deepEqual(completed.summary, summarize(metrics, run));
    console.log(`PASS ${check}`);

    check = "concurrent replay keeps immutable times and one row per event";
    await Promise.all([replay(run, source.readCommittedEvents), replay(run, source.readCommittedEvents)]);
    assert.deepEqual(await source.readCommittedEvents(run), history);
    assert.equal(Number((await pool.query("SELECT count(*) FROM firstdose.fill_events WHERE run_id=$1", [run])).rows[0].count), metrics.length);
    assert.deepEqual((await read()).summary, completed.summary);
    const rows = (await pool.query("SELECT * FROM firstdose.fill_events WHERE run_id=$1", [run])).rows;
    for (const row of rows) assert.deepEqual(Object.keys(row).sort(), ["at", "case_hash", "kind", "reason", "run_id", "script_id"]);
    assert.ok(rows.every(row => !String(row.case_hash).includes("rx_") && String(row.case_hash).length === 64));
    console.log(`PASS ${check}`);

    check = "conflicting replay rolls back the entire new batch";
    await assert.rejects(analytics.writeMetricBatch([
      { ...metrics[0], script_id: "ev_rollback_marker" },
      { ...metrics[0], at: "2026-09-26T19:00:00Z" },
    ]), EventConflictError);
    assert.equal(Number((await pool.query("SELECT count(*) FROM firstdose.event_keys WHERE script_id='ev_rollback_marker'")).rows[0].count), 0);
    assert.deepEqual(await analytics.getAccessSummary(run), completed.summary);
    console.log(`PASS ${check}`);

    check = "failed projection preserves workflow and permits full retry";
    const current = await source.snapshot();
    await assert.rejects(readReplayedSummary(current, { store: source, replayRun: async () => { throw new Error("test outage"); }, getSummary: analytics.getAccessSummary }), { message: "analytics_unavailable" });
    assert.deepEqual(await source.snapshot(), current);
    assert.deepEqual((await read()).summary, completed.summary);
    console.log(`PASS ${check}`);

    check = "reset during summary rejects stale results and preserves old run history";
    await assert.rejects(readReplayedSummary(current, { store: source, replayRun: replay, getSummary: async id => {
      const summary = await analytics.getAccessSummary(id);
      await source.reset(id);
      return summary;
    } }), { message: "analytics_stale" });
    assert.deepEqual(await source.readCommittedEvents(run), history);
    assert.deepEqual((await read()).summary, { recovered: 0, median_ttff_seconds: null, reason_tally: {} });
    console.log(`PASS ${check}`);

    check = "equal timestamps and fractional medians agree with SQL";
    const synthetic = randomUUID();
    const fractional: MetricEvent[] = [
      { run_id: synthetic, script_id: "z_prescribed", case_hash: "a", at: "2026-09-26T10:00:00Z", kind: "prescribed", reason: null },
      { run_id: synthetic, script_id: "a_dispensed", case_hash: "a", at: "2026-09-26T10:00:00Z", kind: "dispensed", reason: null },
      { run_id: synthetic, script_id: "p_b", case_hash: "b", at: "2026-09-26T10:00:00Z", kind: "prescribed", reason: null },
      { run_id: synthetic, script_id: "d_b", case_hash: "b", at: "2026-09-26T10:00:00.500Z", kind: "dispensed", reason: null },
    ];
    await analytics.writeMetricBatch(fractional);
    assert.deepEqual(await analytics.getAccessSummary(synthetic), summarize(fractional, synthetic));
    assert.equal((await analytics.getAccessSummary(synthetic)).median_ttff_seconds, 0.25);
    console.log(`PASS ${check}`);
    console.log("7 Phase 2 PostgreSQL checks passed. Hosted Tiger/Timescale and live Gemini are separate evidence.");
  } catch { throw new Error(`Local Phase 2 database check failed: ${check}`); }
  finally { await pool.end(); }
}

main().catch(error => { console.error(error instanceof Error ? error.message : "Local Phase 2 check failed"); process.exitCode = 1; });
