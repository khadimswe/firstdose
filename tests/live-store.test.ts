import { afterEach, describe, expect, it, vi } from "vitest";
import { createLiveStore } from "@/components/data/live";
import { CATALOG, SCRIPT } from "@/components/data/catalog";
import type { FillEvent } from "@/components/data/types";
import type { PollingEventSource } from "@/lib/realtime";

const event = (id: string): FillEvent => ({ ...SCRIPT.find(e => e.id === id)!, at: "2026-09-26T08:00:00Z" });
function deferred<T>() { let resolve!: (value: T) => void; let reject!: (reason: unknown) => void; const promise = new Promise<T>((yes, no) => { resolve = yes; reject = no; }); return { promise, resolve, reject }; }
async function flush() { for (let i = 0; i < 8; i++) await Promise.resolve(); }
function fixture() {
  let insert!: (event: FillEvent) => void;
  let run!: (id: string, previous: string | null) => void;
  let fail!: (error: Error) => void;
  let synced!: () => void;
  const unsubscribe = vi.fn();
  const source = {
    load: vi.fn(async () => []),
    subscribe: vi.fn((onInsert, onRun, onError, onSync) => { insert = onInsert; run = onRun!; fail = onError!; synced = onSync!; return unsubscribe; }),
    act: vi.fn(async () => {}), fire: vi.fn(async () => {}), reset: vi.fn(async () => {}),
    accessSummary: vi.fn(async () => ({ recovered: 0, median_ttff_seconds: null, reason_tally: {} })),
  } satisfies PollingEventSource;
  const store = createLiveStore({ source: async () => source });
  return { store, source, unsubscribe, insert: (e: FillEvent) => insert(e), run: (id: string, previous: string | null = null) => run(id, previous), fail: (error: Error) => fail(error), synced: () => synced() };
}
afterEach(() => vi.useRealTimers());

describe("live screen store", () => {
  it("clears same-ID history, pending commands and summaries on a remote reset", async () => {
    vi.useFakeTimers(); const f = fixture(); const stop = f.store.subscribe(() => {}); await flush();
    f.run("old"); f.insert(event("ev_01")); f.synced();
    const summary = deferred<{ recovered: number; median_ttff_seconds: null; reason_tally: Record<string, number> }>();
    f.source.accessSummary.mockReturnValueOnce(summary.promise);
    await vi.advanceTimersByTimeAsync(500);
    f.run("new", "old"); f.synced();
    summary.resolve({ recovered: 99, median_ttff_seconds: null, reason_tally: {} }); await flush();
    expect(f.store.events()).toEqual([]); expect(f.store.access()).toBeNull(); expect(f.store.pending().size).toBe(0);
    f.insert({ ...event("ev_01"), at: "2026-09-26T09:00:00Z" });
    expect(f.store.events()).toHaveLength(1); expect(f.store.events()[0].at).toContain("09:00"); stop();
  });
  it("blocks commands until synchronized and fences an old command completion after reset", async () => {
    const f = fixture(); const stop = f.store.subscribe(() => {}); await flush();
    await f.store.act("prescribe", "rx_001"); expect(f.source.act).not.toHaveBeenCalled();
    f.run("old"); f.synced(); const command = deferred<void>(); f.source.act.mockReturnValueOnce(command.promise);
    const pending = f.store.act("prescribe", "rx_001"); await flush(); expect(f.store.pending().size).toBe(1);
    f.run("new", "old"); f.synced(); command.resolve(); await pending;
    expect(f.store.events()).toEqual([]); expect(f.store.pending().size).toBe(0); stop();
  });
  it("deduplicates double clicks and preserves the server-selected fix", async () => {
    const f = fixture(); const stop = f.store.subscribe(() => {}); await flush(); f.run("one");
    for (const id of ["ev_01", "ev_05", "ev_07", "ev_08"]) f.insert(event(id)); f.synced();
    const command = deferred<void>(); f.source.act.mockReturnValueOnce(command.promise);
    const first = f.store.act("fix", "rx_001"); await f.store.act("fix", "rx_001");
    expect(f.source.act).toHaveBeenCalledExactlyOnceWith("fix", CATALOG.cases[0], "RESEND_COPAY_CARD");
    command.resolve(); await first; stop();
  });
  it("exposes login on 401 and recovers on an unchanged successful snapshot", async () => {
    const f = fixture(); const stop = f.store.subscribe(() => {}); await flush();
    f.fail(Object.assign(new Error("Sign in"), { status: 401, loginPath: "/api/demo-login" }));
    expect(f.store.error()?.loginPath).toBe("/api/demo-login"); expect(f.store.ready()).toBe(false);
    f.run("one"); f.synced(); expect(f.store.error()).toBeNull(); expect(f.store.ready()).toBe(true); stop();
  });
  it("clears stale analytics and exposes failure instead of claiming Tiger totals", async () => {
    vi.useFakeTimers(); const f = fixture(); const stop = f.store.subscribe(() => {}); await flush();
    f.source.accessSummary.mockRejectedValueOnce(new Error("missing")); f.run("one"); f.synced();
    await vi.advanceTimersByTimeAsync(500); expect(f.store.access()).toBeNull(); expect(f.store.accessError()).toBeTruthy(); stop();
  });
  it("unsubscribes and discards callbacks/imports after the last screen leaves", async () => {
    const f = fixture(); const stop = f.store.subscribe(() => {}); await flush(); f.run("one"); f.synced(); stop();
    expect(f.unsubscribe).toHaveBeenCalledOnce(); f.insert(event("ev_01")); expect(f.store.events()).toEqual([]);
  });
  it("retries failed analytics after a bounded delay even with no new events", async () => {
    vi.useFakeTimers(); const f = fixture(); const stop = f.store.subscribe(() => {}); await flush();
    f.source.accessSummary.mockRejectedValueOnce(new Error("temporary")); f.run("one"); f.synced();
    await vi.advanceTimersByTimeAsync(500); expect(f.store.accessError()).toBeTruthy();
    f.synced(); await vi.advanceTimersByTimeAsync(500); expect(f.source.accessSummary).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(15_000); f.synced(); await vi.advanceTimersByTimeAsync(500);
    expect(f.store.accessError()).toBeNull(); expect(f.store.access()?.recovered).toBe(0); stop();
  });
});
