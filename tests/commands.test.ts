import { describe, expect, it } from "vitest";
import { executeCommand, PersistenceError, type Snapshot, type WorkflowStore } from "@/lib/server/commands";
import type { FillEvent } from "@/components/data/types";

const runId = "63d4b651-0eb5-440d-a523-e8daf82f36ca";
const prescribe = { kind: "prescribe", patient_id: "pt_maria", drug_id: "drug_otezla" } as const;
const now = () => "2026-09-26T08:00:00.000Z";

// Models just the external transaction boundary. The planner/service are real.
class Store implements WorkflowStore {
  state: Snapshot = { run_id: runId, revision: 0, events: [] };
  async snapshot() { return structuredClone(this.state); }
  async commit(run: string, revision: number, events: FillEvent[]) {
    if (run !== this.state.run_id) throw new PersistenceError("stale_run");
    if (revision !== this.state.revision) throw new PersistenceError("revision_conflict");
    this.state = { ...this.state, revision: revision + (events.length ? 1 : 0), events: [...this.state.events, ...events] };
    return this.snapshot();
  }
  async reset(run: string) {
    if (run !== this.state.run_id) throw new PersistenceError("stale_run");
    this.state = { run_id: "12c21f65-988b-401c-a1c5-1973656f77a6", revision: 0, events: [] };
    return this.snapshot();
  }
}

describe("durable workflow commands", () => {
  it("accepts an equivalent uppercase run identity", async () => {
    const store = new Store();
    const result = await executeCommand(store, runId.toUpperCase(), prescribe, now);
    expect(result.snapshot.run_id).toBe(runId);
    expect(result.inserted.map(e => e.id)).toEqual(["ev_01", "ev_03"]);
  });

  it("replans concurrent double taps so only one prescription is inserted", async () => {
    const store = new Store();
    const results = await Promise.all([executeCommand(store, runId, prescribe, now), executeCommand(store, runId, prescribe, now)]);
    expect(store.state.events.map(e => e.id)).toEqual(["ev_01", "ev_03"]);
    expect(results.map(r => r.inserted.length).sort()).toEqual([0, 2]);
    expect(store.state.revision).toBe(1);
  });

  it("rejects an old device's command after reset, even if the same script could run again", async () => {
    const store = new Store();
    await store.reset(runId);
    await expect(executeCommand(store, runId, prescribe, now)).rejects.toMatchObject({ code: "stale_run" });
    expect(store.state.events).toEqual([]);
  });

  it("checks run identity atomically even for an already applied command", async () => {
    const store = new Store();
    await executeCommand(store, runId, prescribe, now);
    const commit = store.commit.bind(store);
    store.commit = async (...args) => { await store.reset(runId); return commit(...args); };
    await expect(executeCommand(store, runId, prescribe, now)).rejects.toMatchObject({ code: "stale_run" });
    expect(store.state.events).toEqual([]);
  });

  it("keeps acknowledgment pending until a separate pharmacy command", async () => {
    const store = new Store();
    for (const command of [prescribe, { kind: "fire", ids: ["ev_04", "ev_05"] }, { kind: "handoff", case_id: "rx_001" }, { kind: "fix", case_id: "rx_001", fix: "RESEND_COPAY_CARD" }, { kind: "use_card", case_id: "rx_001" }]) {
      await executeCommand(store, runId, command, now);
    }
    expect(store.state.events.at(-1)?.id).toBe("ev_10");
    expect(store.state.events.some(e => e.status_text === "Dispensed")).toBe(false);
    const result = await executeCommand(store, runId, { kind: "fire", ids: ["ev_11"] }, now);
    expect(result.inserted.map(e => e.id)).toEqual(["ev_11"]);
    expect(result.inserted[0].status_text).toBe("Dispensed");
  });

  it("persists one app alert when concurrent reason commands are replanned", async () => {
    const store = new Store();
    await executeCommand(store, runId, prescribe, now);
    const barrier = { kind: "fire", ids: ["ev_04", "ev_05"] };
    const results = await Promise.all([executeCommand(store, runId, barrier, now), executeCommand(store, runId, barrier, now)]);
    expect(results.map(result => result.inserted.length).sort()).toEqual([0, 3]);
    expect(store.state.events.filter(event => event.type === "alert_sent")).toMatchObject([
      { id: "ev_06", wrist: "Maria: Otezla not started. Declined at price ($410 demo)." },
    ]);
  });

  it("does not partially persist a batch when its later beat is invalid", async () => {
    const store = new Store();
    await executeCommand(store, runId, prescribe, now);
    await expect(executeCommand(store, runId, { kind: "fire", ids: ["ev_04", "ev_05", "ev_11"] }, now)).rejects.toMatchObject({ code: "invalid_transition" });
    expect(store.state.events.map(e => e.id)).toEqual(["ev_01", "ev_03"]);
  });

  it("bounds retries and never retries ambiguous network failures", async () => {
    const store = new Store();
    let attempts = 0;
    store.commit = async () => { attempts++; throw new PersistenceError("revision_conflict"); };
    await expect(executeCommand(store, runId, prescribe, now)).rejects.toMatchObject({ code: "busy" });
    expect(attempts).toBe(3);
    attempts = 0;
    store.commit = async () => { attempts++; throw new PersistenceError("unavailable"); };
    await expect(executeCommand(store, runId, prescribe, now)).rejects.toMatchObject({ code: "unavailable" });
    expect(attempts).toBe(1);
  });
});
