import { afterEach, describe, expect, it, vi } from "vitest";
import { createCoordinatorLiveStore } from "@/components/data/coordinator-live";
import type { CoordinatorSnapshot } from "@/lib/server/coordinator";

const ONE = "11111111-1111-4111-8111-111111111111";
const TWO = "22222222-2222-4222-8222-222222222222";
function snapshot(run_id = ONE, revision = 0, status?: "pending" | "linked", assigned = false): CoordinatorSnapshot {
  return { run_id, revision, events: [], links: status ? [{ coordinator_id: "coord_demo", prescriber_id: "prescriber_demo", status }] : [], cases: [{ case_id: "rx_001", coordinator_id: assigned ? "coord_demo" : null }] };
}
function deferred<T>() { let resolve!: (value: T) => void; const promise = new Promise<T>(yes => { resolve = yes; }); return { promise, resolve }; }
async function flush() { for (let i = 0; i < 20; i++) await Promise.resolve(); }
function fixture() {
  let run!: (id: string) => void;
  let monitorRun = ONE;
  const fetcher = vi.fn<typeof fetch>();
  const store = createCoordinatorLiveStore({ fetch: fetcher, monitor: callback => { run = callback; callback(monitorRun); return () => {}; }, pollIntervalMs: 1_500 });
  return { store, fetcher, run: (id: string) => { monitorRun = id; run(id); }, start: async (body = snapshot()) => {
    monitorRun = body.run_id;
    fetcher.mockResolvedValueOnce(Response.json(body)); const stop = store.subscribe(() => {}); await flush(); return stop;
  } };
}
afterEach(() => vi.useRealTimers());

describe("live coordinator links", () => {
  it("hydrates independently of fill events, with stable snapshots", async () => {
    const f = fixture(); expect(f.store).not.toBeNull(); const stop = await f.start(snapshot(ONE, 1, "linked"));
    expect(f.store.getSnapshot().ready).toBe(true);
    expect(f.store.getSnapshot().snapshot?.links[0].status).toBe("linked");
    expect(f.store.getSnapshot()).toBe(f.store.getSnapshot()); stop();
  });
  it("fences a delayed initial load after unsubscribe and reconnect", async () => {
    const f = fixture(); const old = deferred<Response>(); f.fetcher.mockReturnValueOnce(old.promise);
    const stop = f.store.subscribe(() => {}); await flush(); stop();
    const stop2 = await f.start(snapshot(TWO, 0)); old.resolve(Response.json(snapshot(ONE, 9, "linked"))); await flush();
    expect(f.store.getSnapshot().snapshot?.run_id).toBe(TWO); stop2();
  });
  it("fences an old load when the fill adapter observes reset", async () => {
    const f = fixture(); const stop = await f.start(snapshot(ONE, 1, "linked"));
    const old = deferred<Response>(); f.fetcher.mockReturnValueOnce(old.promise); const load = f.store.refresh();
    f.fetcher.mockResolvedValueOnce(Response.json(snapshot(TWO))); f.run(TWO); await flush();
    old.resolve(Response.json(snapshot(ONE, 99, "linked"))); await load;
    expect(f.store.getSnapshot().snapshot?.run_id).toBe(TWO);
    expect(f.store.getSnapshot().snapshot?.links).toEqual([]); stop();
  });
  it("ignores a late lower-revision GET after persisted approval", async () => {
    const f = fixture(); const stop = await f.start(snapshot(ONE, 1, "pending"));
    const old = deferred<Response>(); f.fetcher.mockReturnValueOnce(old.promise); const load = f.store.refresh();
    f.fetcher.mockResolvedValueOnce(Response.json(snapshot(ONE, 2, "linked"))); await f.store.command("approve");
    old.resolve(Response.json(snapshot(ONE, 1, "pending"))); await load;
    expect(f.store.getSnapshot().snapshot?.links[0].status).toBe("linked"); stop();
  });
  it("deduplicates double taps and sends the observed run and fixed identities", async () => {
    const f = fixture(); const stop = await f.start(); const reply = deferred<Response>(); f.fetcher.mockReturnValueOnce(reply.promise);
    const first = f.store.command("request"); const second = f.store.command("request");
    expect(f.fetcher).toHaveBeenCalledTimes(2);
    expect(f.store.getSnapshot().pending).toBe(true);
    const init = f.fetcher.mock.calls[1][1]!;
    expect(new Headers(init.headers).get("x-firstdose-run")).toBe(ONE);
    expect(JSON.parse(init.body as string)).toEqual({ action: "request", coordinator_id: "coord_demo", prescriber_id: "prescriber_demo" });
    reply.resolve(Response.json(snapshot(ONE, 1, "pending"))); expect(await first).toBe(true); expect(await second).toBe(true); stop();
  });
  it("does not hand off until invite, approval and assignment commit", async () => {
    const f = fixture(); const stop = await f.start(); const handoff = vi.fn(async () => {});
    f.fetcher.mockResolvedValueOnce(Response.json(snapshot(ONE, 1, "pending")));
    f.fetcher.mockResolvedValueOnce(Response.json(snapshot(ONE, 2, "linked")));
    const assign = deferred<Response>(); f.fetcher.mockReturnValueOnce(assign.promise);
    const flow = f.store.approveAndHandoff("rx_001", handoff); await flush();
    expect(handoff).not.toHaveBeenCalled();
    assign.resolve(Response.json(snapshot(ONE, 3, "linked", true))); expect(await flow).toBe(true);
    expect(handoff).toHaveBeenCalledOnce();
    expect(f.fetcher.mock.calls.slice(1).map(call => JSON.parse(call[1]!.body as string).action)).toEqual(["invite", "approve", "assign"]); stop();
  });
  it("retries a partial assignment failure without repeating approval", async () => {
    const f = fixture(); const stop = await f.start(snapshot(ONE, 2, "linked")); const handoff = vi.fn(async () => {});
    f.fetcher.mockResolvedValueOnce(Response.json({ error: "unavailable" }, { status: 503 }));
    expect(await f.store.approveAndHandoff("rx_001", handoff)).toBe(false); expect(handoff).not.toHaveBeenCalled();
    f.fetcher.mockResolvedValueOnce(Response.json(snapshot(ONE, 3, "linked", true)));
    expect(await f.store.approveAndHandoff("rx_001", handoff)).toBe(true);
    expect(f.fetcher.mock.calls.slice(1).map(call => JSON.parse(call[1]!.body as string).action)).toEqual(["assign", "assign"]); stop();
  });
  it("retains committed assignment on handoff failure and only retries the handoff", async () => {
    const f = fixture(); const stop = await f.start(snapshot(ONE, 3, "linked", true));
    const handoff = vi.fn().mockRejectedValueOnce(new Error("handoff unavailable")).mockResolvedValueOnce(undefined);
    expect(await f.store.approveAndHandoff("rx_001", handoff)).toBe(false);
    expect(f.store.getSnapshot().error).toContain("handoff unavailable");
    expect(await f.store.approveAndHandoff("rx_001", handoff)).toBe(true);
    expect(f.fetcher).toHaveBeenCalledOnce(); stop();
  });
  it("fences approval and assignment completions after reset", async () => {
    const f = fixture(); const stop = await f.start(snapshot(ONE, 1, "pending")); const approval = deferred<Response>();
    f.fetcher.mockReturnValueOnce(approval.promise); const handoff = vi.fn(async () => {});
    const flow = f.store.approveAndHandoff("rx_001", handoff); await flush();
    f.fetcher.mockResolvedValueOnce(Response.json(snapshot(TWO))); f.run(TWO); await flush();
    approval.resolve(Response.json(snapshot(ONE, 2, "linked"))); expect(await flow).toBe(false);
    expect(handoff).not.toHaveBeenCalled(); expect(f.store.getSnapshot().snapshot?.run_id).toBe(TWO); stop();
  });
  it("disables commands on401 and recovers after a fresh read", async () => {
    const f = fixture(); f.fetcher.mockResolvedValueOnce(Response.json({ error: "unauthorized" }, { status: 401 }));
    const stop = f.store.subscribe(() => {}); await flush();
    expect(f.store.getSnapshot().ready).toBe(false); expect(f.store.getSnapshot().loginPath).toBe("/api/demo-login?next=%2Fdoctor%2Fprofile");
    expect(await f.store.command("approve")).toBe(false);
    f.fetcher.mockResolvedValueOnce(Response.json(snapshot(ONE, 2, "linked"))); await f.store.refresh();
    expect(f.store.getSnapshot().ready).toBe(true); expect(f.store.getSnapshot().error).toBeNull(); stop();
  });
  it("rejects malformed identity or snapshot without using its linked state", async () => {
    const f = fixture(); const body = snapshot(ONE, 1, "linked"); body.links[0].prescriber_id = "real_npi" as "prescriber_demo";
    const stop = await f.start(body); expect(f.store.getSnapshot().ready).toBe(false); expect(f.store.getSnapshot().snapshot).toBeNull(); stop();
  });
  it("polls persisted approval made on another device", async () => {
    vi.useFakeTimers(); const f = fixture(); const stop = await f.start(snapshot(ONE, 1, "pending"));
    f.fetcher.mockResolvedValueOnce(Response.json(snapshot(ONE, 2, "linked")));
    await vi.advanceTimersByTimeAsync(1_500);
    expect(f.store.getSnapshot().snapshot?.links[0].status).toBe("linked"); stop();
  });
  it("keeps the snapshot identity stable for an unchanged poll", async () => {
    const f = fixture(); const stop = await f.start(snapshot(ONE, 1, "linked")); const before = f.store.getSnapshot();
    f.fetcher.mockResolvedValueOnce(Response.json(snapshot(ONE, 1, "linked"))); await f.store.refresh();
    expect(f.store.getSnapshot()).toBe(before); stop();
  });
  it("does not claim approval when a successful response is still pending", async () => {
    const f = fixture(); const stop = await f.start(snapshot(ONE, 1, "pending"));
    f.fetcher.mockResolvedValueOnce(Response.json(snapshot(ONE, 2, "pending")));
    expect(await f.store.approve()).toBe(false); expect(f.store.getSnapshot().error).toBeTruthy(); stop();
  });
  it("does not send when an assignment response omits the assignment", async () => {
    const f = fixture(); const stop = await f.start(snapshot(ONE, 2, "linked")); const handoff = vi.fn(async () => {});
    f.fetcher.mockResolvedValueOnce(Response.json(snapshot(ONE, 3, "linked")));
    expect(await f.store.approveAndHandoff("rx_001", handoff)).toBe(false);
    expect(handoff).not.toHaveBeenCalled(); stop();
  });
  it("profile approval before prescription does not assign any case", async () => {
    const f = fixture(); const initial = snapshot(); initial.cases = []; const stop = await f.start(initial);
    const pending = snapshot(ONE, 1, "pending"); pending.cases = [];
    const linked = snapshot(ONE, 2, "linked"); linked.cases = [];
    f.fetcher.mockResolvedValueOnce(Response.json(pending)); f.fetcher.mockResolvedValueOnce(Response.json(linked));
    expect(await f.store.approve()).toBe(true);
    expect(f.store.getSnapshot().snapshot?.cases).toEqual([]);
    expect(f.fetcher.mock.calls.slice(1).map(call => JSON.parse(call[1]!.body as string).action)).toEqual(["invite", "approve"]); stop();
  });
  it("blocks commands when coordinator endpoint reaches the new run before the fill feed", async () => {
    const f = fixture(); const stop = await f.start(snapshot(ONE, 1, "linked"));
    f.fetcher.mockResolvedValueOnce(Response.json(snapshot(TWO, 2, "pending"))); await f.store.refresh();
    expect(f.store.getSnapshot().snapshot?.run_id).toBe(TWO); expect(f.store.getSnapshot().ready).toBe(false);
    expect(await f.store.approve()).toBe(false);
    const handoff = vi.fn(async () => {}); expect(await f.store.approveAndHandoff("rx_001", handoff)).toBe(false);
    expect(handoff).not.toHaveBeenCalled(); expect(f.fetcher).toHaveBeenCalledTimes(2);
    f.fetcher.mockResolvedValueOnce(Response.json(snapshot(TWO, 2, "pending"))); f.run(TWO); await flush();
    expect(f.store.getSnapshot().ready).toBe(true); stop();
  });
  it("blocks commands when the fill feed resets before the coordinator endpoint catches up", async () => {
    const f = fixture(); const stop = await f.start(snapshot(ONE, 1, "linked"));
    f.fetcher.mockResolvedValueOnce(Response.json(snapshot(ONE, 1, "linked"))); f.run(TWO); await flush();
    expect(f.store.getSnapshot().ready).toBe(false); expect(f.store.getSnapshot().snapshot).toBeNull();
    expect(await f.store.approve()).toBe(false);
    f.fetcher.mockResolvedValueOnce(Response.json(snapshot(TWO))); await f.store.refresh();
    expect(f.store.getSnapshot().snapshot?.run_id).toBe(TWO); expect(f.store.getSnapshot().ready).toBe(true); stop();
  });
  it("waits for the first fill-run signal even when coordinator approval is already loaded", async () => {
    let signal!: (id: string) => void;
    const fetcher = vi.fn<typeof fetch>().mockImplementation(async () => Response.json(snapshot(ONE, 1, "linked")));
    const store = createCoordinatorLiveStore({ fetch: fetcher, monitor: callback => { signal = callback; return () => {}; } });
    const stop = store.subscribe(() => {}); await flush();
    expect(store.getSnapshot().ready).toBe(false); expect(await store.command("request")).toBe(false);
    signal(ONE); await flush(); expect(store.getSnapshot().ready).toBe(true); stop();
  });
  it("does not retire a future API run when the fill monitor advances through an intermediate run", async () => {
    const future = "33333333-3333-4333-8333-333333333333";
    const f = fixture(); const stop = await f.start(snapshot(ONE, 1, "linked"));
    f.fetcher.mockResolvedValueOnce(Response.json(snapshot(future, 2, "pending"))); await f.store.refresh();
    f.fetcher.mockResolvedValueOnce(Response.json(snapshot(future, 2, "pending"))); f.run(TWO); await flush();
    expect(f.store.getSnapshot().snapshot?.run_id).toBe(future); expect(f.store.getSnapshot().ready).toBe(false);
    expect(await f.store.approve()).toBe(false);
    f.fetcher.mockResolvedValueOnce(Response.json(snapshot(future, 2, "pending"))); f.run(future); await flush();
    expect(f.store.getSnapshot().ready).toBe(true); expect(f.store.getSnapshot().snapshot?.run_id).toBe(future); stop();
  });
});
