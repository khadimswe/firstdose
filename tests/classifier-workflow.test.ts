import { describe, expect, it, vi } from "vitest";
import { executeCommand, PersistenceError, type Snapshot, type WorkflowStore } from "@/lib/server/commands";
import { planCommand } from "@/lib/server/workflow";
import type { ReasonKey } from "@/components/data/types";

const RUN = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const NEXT = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const now = () => "2026-09-26T18:00:00.000Z";
function memory() {
  let state: Snapshot = { run_id: RUN, revision: 0, events: [] };
  const store: WorkflowStore = {
    snapshot: async () => structuredClone(state),
    commit: async (run, revision, events) => {
      if (run !== state.run_id) throw new PersistenceError("stale_run");
      if (revision !== state.revision) throw new PersistenceError("revision_conflict");
      if (events.length) state = { ...state, revision: revision + 1, events: [...state.events, ...events] };
      return structuredClone(state);
    },
    reset: async () => { state = { run_id: NEXT, revision: 0, events: [] }; return structuredClone(state); },
  };
  return store;
}
async function maria() {
  const store = memory();
  await executeCommand(store, RUN, { kind: "prescribe", patient_id: "pt_maria", drug_id: "drug_otezla" }, now);
  return store;
}

describe("Gemini into the committed workflow", () => {
  it("classifies only the bounded source note and atomically persists the actual reason and alert", async () => {
    const store = await maria();
    const classify = vi.fn(async (): Promise<ReasonKey | null> => "COPAY_NOT_APPLIED");
    const result = await executeCommand(store, RUN, { kind: "fire", ids: ["ev_04", "ev_05"] }, now, classify);
    expect(classify).toHaveBeenCalledExactlyOnceWith(result.inserted[0].note);
    expect(result.inserted.map(e => e.id)).toEqual(["ev_04", "ev_05", "ev_06"]);
    expect(result.inserted[1]).toMatchObject({ reason: "COPAY_NOT_APPLIED", note: "", wrist: null });
    expect(result.inserted[2]).toMatchObject({ reason: "COPAY_NOT_APPLIED", wrist: expect.any(String) });
    await executeCommand(store, RUN, { kind: "fire", ids: ["ev_05"] }, now, classify);
    expect(classify).toHaveBeenCalledTimes(1);
  });

  it.each([null, "throw"])("keeps unknown/provider failure (%s) unclassified with deterministic access-support fallback", async failure => {
    const store = await maria();
    const classify = vi.fn(async () => { if (failure === "throw") throw new Error("private provider data"); return null; });
    const result = await executeCommand(store, RUN, { kind: "fire", ids: ["ev_04", "ev_05"] }, now, classify);
    expect(result.inserted.map(e => e.id)).toEqual(["ev_04", "ev_05"]);
    expect(result.inserted[1]).toMatchObject({ reason: null, wrist: null, note: "" });
    const handoff = planCommand(result.snapshot.events, { kind: "handoff", case_id: "rx_001" }, now());
    expect(handoff.find(e => e.type === "fix_chosen")?.fix).toBe("ACCESS_SUPPORT");
  });

  it("preflights the whole batch before sending anything to Gemini", async () => {
    const store = await maria();
    const classify = vi.fn(async (): Promise<ReasonKey | null> => "DECLINED_AT_PRICE");
    await expect(executeCommand(store, RUN, { kind: "fire", ids: ["ev_04", "ev_05", "ev_11"] }, now, classify)).rejects.toMatchObject({ code: "invalid_transition" });
    expect(classify).not.toHaveBeenCalled();
    expect((await store.snapshot()).events).toHaveLength(2);
  });

  it("does not invent a price when Gemini gives a price reason for James without a quote", async () => {
    const store = memory();
    await executeCommand(store, RUN, { kind: "prescribe", patient_id: "pt_james", drug_id: "drug_humira" }, now);
    const result = await executeCommand(store, RUN, { kind: "fire", ids: ["ev_16", "ev_17", "ev_18"] }, now, async () => "DECLINED_AT_PRICE");
    expect(result.inserted.map(e => e.id)).toEqual(["ev_16", "ev_17", "ev_18"]);
    expect(result.inserted.at(-1)?.reason).toBeNull();
  });

  it("reuses classification across a revision retry without changing persisted source time", async () => {
    const store = await maria();
    await executeCommand(store, RUN, { kind: "fire", ids: ["ev_04"] }, now);
    const original = (await store.snapshot()).events.find(e => e.id === "ev_04");
    const commit = store.commit;
    let once = true;
    store.commit = async (...args) => { if (once) { once = false; throw new PersistenceError("revision_conflict"); } return commit(...args); };
    const classify = vi.fn(async (): Promise<ReasonKey | null> => "DECLINED_AT_PRICE");
    const result = await executeCommand(store, RUN, { kind: "fire", ids: ["ev_05"] }, now, classify);
    expect(classify).toHaveBeenCalledTimes(1);
    expect(result.snapshot.events.find(e => e.id === "ev_04")).toEqual(original);
  });

  it("rejects reset racing the classifier without leaking old events into the new run", async () => {
    const store = await maria();
    const classify = async (): Promise<ReasonKey | null> => { await store.reset(RUN); return "DECLINED_AT_PRICE"; };
    await expect(executeCommand(store, RUN, { kind: "fire", ids: ["ev_04", "ev_05"] }, now, classify)).rejects.toMatchObject({ code: "stale_run" });
    expect(await store.snapshot()).toEqual({ run_id: NEXT, revision: 0, events: [] });
  });

  it("concurrent classification commands persist one reason/alert pair", async () => {
    const store = await maria();
    await Promise.all([1, 2].map(() => executeCommand(store, RUN, { kind: "fire", ids: ["ev_04", "ev_05"] }, now, async () => "DECLINED_AT_PRICE")));
    expect((await store.snapshot()).events.filter(e => ["ev_05", "ev_06"].includes(e.id)).map(e => e.id)).toEqual(["ev_05", "ev_06"]);
  });
});
