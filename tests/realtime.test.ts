import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createPollingEventSource } from "../lib/realtime";
import type { FillEvent, RxCase } from "../components/data/types";

const RUN_A = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const RUN_B = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const row = (id: string): FillEvent => ({ id, case_id: "rx_001", at: "2026-09-26T14:00:00Z", actor: "doctor", type: "prescribed", status_text: null, reject_code: null, note: "", reason: null, fix: null, amount_usd: null, wrist: null, side: "practice" });
const snapshot = (run = RUN_A, revision = 0, events: FillEvent[] = []) => Response.json({ run_id: run, revision, events });
const rx = { id: "rx_001", patient_id: "pt_maria", drug_id: "drug_otezla" } as RxCase;
function deferred() { let resolve!: (value: Response) => void; const promise = new Promise<Response>(done => { resolve = done; }); return { promise, resolve }; }
const flush = async () => { await vi.advanceTimersByTimeAsync(0); };

describe("protected polling event source", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => { vi.useRealTimers(); vi.restoreAllMocks(); });

  it("loads through same-origin cookies and conditionally revalidates with 304", async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValueOnce(snapshot(RUN_A, 1, [row("ev_01")])).mockResolvedValueOnce(new Response(null, { status: 304 }));
    const source = createPollingEventSource({ fetch: fetcher });
    expect(await source.load()).toEqual([row("ev_01")]);
    expect(await source.load()).toEqual([row("ev_01")]);
    expect(fetcher.mock.calls[0][0]).toBe("/api/events");
    for (const [, init] of fetcher.mock.calls) {
      expect(init?.credentials).toBe("same-origin");
      expect(new Headers(init?.headers).has("authorization")).toBe(false);
    }
    expect(new Headers(fetcher.mock.calls[1][1]?.headers).get("if-none-match")).toBe(`"${RUN_A}:1"`);
  });

  it("shares in-flight loads and prevents overlapping polls", async () => {
    const pending = deferred();
    const fetcher = vi.fn<typeof fetch>().mockReturnValueOnce(pending.promise).mockResolvedValue(new Response(null, { status: 304 }));
    const source = createPollingEventSource({ fetch: fetcher });
    const first = source.load(); const second = source.load();
    const insert = vi.fn(); const stop = source.subscribe(insert);
    await vi.advanceTimersByTimeAsync(9_000);
    expect(fetcher).toHaveBeenCalledTimes(1);
    pending.resolve(snapshot(RUN_A, 1, [row("ev_01")]));
    expect(await first).toEqual(await second);
    await flush();
    await vi.advanceTimersByTimeAsync(1_500);
    expect(fetcher).toHaveBeenCalledTimes(2);
    expect(insert.mock.calls.map(([event]) => event.id)).toEqual(["ev_01"]);
    stop();
  });

  it("deduplicates polling callbacks in server order and stops on unsubscribe", async () => {
    const fetcher = vi.fn<typeof fetch>()
      .mockResolvedValueOnce(snapshot(RUN_A, 1, [row("ev_01")]))
      .mockResolvedValueOnce(snapshot(RUN_A, 2, [row("ev_01"), row("ev_03"), row("ev_04")]))
      .mockResolvedValue(new Response(null, { status: 304 }));
    const source = createPollingEventSource({ fetch: fetcher });
    const insert = vi.fn(); const stop = source.subscribe(insert);
    await flush(); await vi.advanceTimersByTimeAsync(3_000);
    expect(insert.mock.calls.map(([event]) => event.id)).toEqual(["ev_01", "ev_03", "ev_04"]);
    stop(); const calls = fetcher.mock.calls.length;
    await vi.advanceTimersByTimeAsync(9_000);
    expect(fetcher).toHaveBeenCalledTimes(calls);
    expect(vi.getTimerCount()).toBe(0);
  });

  it("announces a remote reset before replaying new-run IDs", async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValueOnce(snapshot(RUN_A, 1, [row("ev_01")])).mockResolvedValueOnce(snapshot(RUN_B, 1, [row("ev_01")]));
    const source = createPollingEventSource({ fetch: fetcher });
    const calls: string[] = [];
    const stop = source.subscribe(event => calls.push(event.id), run => calls.push(run));
    await flush(); await vi.advanceTimersByTimeAsync(1_500);
    expect(calls).toEqual([RUN_A, "ev_01", RUN_B, "ev_01"]);
    stop();
  });

  it("ignores an old load that completes after local reset", async () => {
    const old = deferred();
    const fetcher = vi.fn<typeof fetch>()
      .mockResolvedValueOnce(snapshot(RUN_A, 1, [row("ev_01")]))
      .mockReturnValueOnce(old.promise)
      .mockResolvedValueOnce(snapshot(RUN_B))
      .mockResolvedValueOnce(snapshot(RUN_B));
    const source = createPollingEventSource({ fetch: fetcher });
    await source.load(); const late = source.load();
    await source.reset();
    expect(fetcher.mock.calls[1][1]?.signal?.aborted).toBe(true);
    old.resolve(snapshot(RUN_A, 2, [row("ev_01"), row("ev_03")]));
    expect(await late).toEqual([]);
    expect(new Headers(fetcher.mock.calls[2][1]?.headers).get("x-firstdose-run")).toBe(RUN_A);
  });

  it("sends all screen commands and simulator beats to their original routes", async () => {
    const fetcher = vi.fn<typeof fetch>().mockImplementation(async (_url, init) => init?.method === "POST" ? Response.json([]) : snapshot(RUN_A));
    const source = createPollingEventSource({ fetch: fetcher });
    await source.load();
    await source.act("prescribe", rx, null); await source.act("handoff", rx, null);
    await source.act("fix", rx, "RESEND_COPAY_CARD"); await source.act("use_card", rx, null);
    await source.fire(["ev_04", "ev_05"]);
    const writes = fetcher.mock.calls.filter(([, init]) => init?.method === "POST");
    expect(writes.map(([url]) => url)).toEqual(["/api/rx", "/api/handoff", "/api/fix", "/api/patient/use", "/api/sim/fire"]);
    expect(writes.map(([, init]) => JSON.parse(String(init?.body)))).toEqual([
      { patient_id: "pt_maria", drug_id: "drug_otezla" }, { case_id: "rx_001" },
      { case_id: "rx_001", fix: "RESEND_COPAY_CARD" }, { case_id: "rx_001" }, { ids: ["ev_04", "ev_05"] },
    ]);
    for (const [, init] of writes) {
      expect(new Headers(init?.headers).get("x-firstdose-run")).toBe(RUN_A);
      expect(init?.credentials).toBe("same-origin");
    }
    expect(fetcher.mock.calls.filter(([, init]) => init?.method !== "POST")).toHaveLength(6);
  });

  it("refreshes a stale run after 409 but never replays the click", async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValueOnce(snapshot(RUN_A)).mockResolvedValueOnce(Response.json({ error: "stale_run" }, { status: 409 })).mockResolvedValueOnce(snapshot(RUN_B));
    const source = createPollingEventSource({ fetch: fetcher });
    await source.load();
    await expect(source.act("prescribe", rx, null)).rejects.toMatchObject({ code: "stale_run", status: 409 });
    expect(fetcher.mock.calls.filter(([, init]) => init?.method === "POST")).toHaveLength(1);
    expect(fetcher.mock.calls.at(-1)?.[0]).toBe("/api/events");
  });

  it("surfaces failed loads and subscription authentication errors", async () => {
    const fetcher = vi.fn<typeof fetch>().mockImplementation(async () => Response.json({ error: "unauthorized" }, { status: 401 }));
    const source = createPollingEventSource({ fetch: fetcher });
    await expect(source.load()).rejects.toMatchObject({ code: "unauthorized", status: 401, loginPath: "/api/demo-login" });
    const errors = vi.fn(); const stop = source.subscribe(vi.fn(), undefined, errors);
    await flush();
    expect(errors).toHaveBeenCalledWith(expect.objectContaining({ code: "unauthorized" }));
    stop();
  });

  it("refreshes on visible transitions and removes its listener", async () => {
    const visibility = new EventTarget() as EventTarget & { visibilityState: DocumentVisibilityState };
    visibility.visibilityState = "visible";
    const remove = vi.spyOn(visibility, "removeEventListener");
    const fetcher = vi.fn<typeof fetch>().mockImplementation(async () => snapshot());
    const source = createPollingEventSource({ fetch: fetcher, document: visibility });
    const stop = source.subscribe(vi.fn()); await flush();
    visibility.visibilityState = "hidden"; visibility.dispatchEvent(new Event("visibilitychange")); await flush();
    expect(fetcher).toHaveBeenCalledTimes(1);
    visibility.visibilityState = "visible"; visibility.dispatchEvent(new Event("visibilitychange")); await flush();
    expect(fetcher).toHaveBeenCalledTimes(2);
    stop(); expect(remove).toHaveBeenCalledWith("visibilitychange", expect.any(Function));
  });

  it("propagates unavailable analytics without synthesizing local counts", async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(Response.json({ error: "unavailable" }, { status: 503 }));
    const source = createPollingEventSource({ fetch: fetcher });
    await expect(source.accessSummary()).rejects.toMatchObject({ code: "unavailable", status: 503 });
    expect(fetcher.mock.calls[0][0]).toBe("/api/access/summary");
  });

  it("suspends legacy insert callbacks after reset and explains the missing handler", async () => {
    const fetcher = vi.fn<typeof fetch>()
      .mockResolvedValueOnce(snapshot(RUN_A, 1, [row("ev_01")]))
      .mockResolvedValueOnce(snapshot(RUN_B, 1, [row("ev_03")]))
      .mockResolvedValueOnce(new Response(null, { status: 304 }));
    const source = createPollingEventSource({ fetch: fetcher });
    const insert = vi.fn(), errors = vi.fn(); const stop = source.subscribe(insert, undefined, errors);
    await flush(); await vi.advanceTimersByTimeAsync(1_500);
    expect(insert.mock.calls.map(([event]) => event.id)).toEqual(["ev_01"]);
    expect(errors).toHaveBeenCalledWith(expect.objectContaining({ code: "run_change_handler_required" }));
    expect(await source.load()).toEqual([row("ev_03")]);
    stop();
  });

  it("refreshes after a successful command even if an older pending read failed", async () => {
    const pending = deferred();
    const fetcher = vi.fn<typeof fetch>().mockResolvedValueOnce(snapshot())
      .mockReturnValueOnce(pending.promise).mockResolvedValueOnce(Response.json([]))
      .mockResolvedValueOnce(snapshot(RUN_A, 1, [row("ev_01")]));
    const source = createPollingEventSource({ fetch: fetcher });
    await source.load();
    const read = source.load(); const failure = expect(read).rejects.toMatchObject({ status: 503 });
    const write = source.act("prescribe", rx, null);
    await flush(); pending.resolve(Response.json({ error: "unavailable" }, { status: 503 }));
    await failure; await write;
    expect(fetcher).toHaveBeenCalledTimes(4);
  });

  it("does not restore a delayed reset response after observing a newer run", async () => {
    const reset = deferred();
    const runC = "cccccccc-cccc-4ccc-8ccc-cccccccccccc";
    const fetcher = vi.fn<typeof fetch>().mockResolvedValueOnce(snapshot())
      .mockReturnValueOnce(reset.promise).mockResolvedValueOnce(snapshot(runC, 1, [row("ev_03")]))
      .mockResolvedValueOnce(new Response(null, { status: 304 }));
    const source = createPollingEventSource({ fetch: fetcher });
    await source.load(); const pending = source.reset();
    expect(await source.load()).toEqual([row("ev_03")]);
    reset.resolve(snapshot(RUN_B)); await pending;
    expect(new Headers(fetcher.mock.calls.at(-1)?.[1]?.headers).get("if-none-match")).toBe(`"${runC}:1"`);
  });

  it("keeps the newer snapshot when the same run returns an older revision", async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValueOnce(snapshot(RUN_A, 2, [row("ev_01"), row("ev_03")])).mockResolvedValueOnce(snapshot(RUN_A, 1, [row("ev_01")]));
    const source = createPollingEventSource({ fetch: fetcher });
    await source.load(); expect(await source.load()).toEqual([row("ev_01"), row("ev_03")]);
  });

  it("reports network failure and resumes on the next poll", async () => {
    const fetcher = vi.fn<typeof fetch>().mockRejectedValueOnce(new TypeError("network offline")).mockResolvedValueOnce(snapshot(RUN_A, 1, [row("ev_01")]));
    const source = createPollingEventSource({ fetch: fetcher });
    const insert = vi.fn(), errors = vi.fn(); const stop = source.subscribe(insert, undefined, errors);
    await flush(); expect(errors).toHaveBeenCalledWith(expect.objectContaining({ code: "unavailable" }));
    await vi.advanceTimersByTimeAsync(1_500); expect(insert).toHaveBeenCalledWith(row("ev_01")); stop();
  });

  it("rejects malformed snapshots without poisoning the last valid cache", async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValueOnce(snapshot(RUN_A, 1, [row("ev_01")]))
      .mockResolvedValueOnce(snapshot(RUN_A, 2, [row("ev_01"), row("ev_01")]))
      .mockResolvedValueOnce(new Response(null, { status: 304 }));
    const source = createPollingEventSource({ fetch: fetcher });
    await source.load(); await expect(source.load()).rejects.toMatchObject({ code: "invalid_response" });
    expect(await source.load()).toEqual([row("ev_01")]);
  });

  it("returns the analytics endpoint result unchanged", async () => {
    const summary = { recovered: 1, median_ttff_seconds: 22, reason_tally: { DECLINED_AT_PRICE: 1 } };
    const fetcher = vi.fn<typeof fetch>().mockResolvedValueOnce(Response.json(summary));
    expect(await createPollingEventSource({ fetch: fetcher }).accessSummary()).toEqual(summary);
  });

  it("aborts a stalled read after ten seconds and permits a new poll", async () => {
    const fetcher = vi.fn<typeof fetch>().mockImplementationOnce((_url, init) => new Promise((_resolve, reject) => {
      init?.signal?.addEventListener("abort", () => reject(new DOMException("Aborted", "AbortError")), { once: true });
    })).mockResolvedValueOnce(snapshot(RUN_A, 1, [row("ev_01")]));
    const source = createPollingEventSource({ fetch: fetcher });
    const insert = vi.fn(), errors = vi.fn(); const stop = source.subscribe(insert, undefined, errors);
    await vi.advanceTimersByTimeAsync(10_000);
    expect(fetcher.mock.calls[0][1]?.signal?.aborted).toBe(true);
    expect(errors).toHaveBeenCalledWith(expect.objectContaining({ code: "timeout" }));
    await vi.advanceTimersByTimeAsync(1_500);
    expect(insert).toHaveBeenCalledWith(row("ev_01")); stop();
  });

  it("also times out a response whose headers arrive but body stalls", async () => {
    const fetcher = vi.fn<typeof fetch>().mockImplementationOnce(async (_url, init) => new Response(new ReadableStream({
      start(controller) { init?.signal?.addEventListener("abort", () => controller.error(new DOMException("Aborted", "AbortError")), { once: true }); },
    })));
    const source = createPollingEventSource({ fetch: fetcher });
    const read = source.load(); const rejected = expect(read).rejects.toMatchObject({ code: "timeout" });
    await vi.advanceTimersByTimeAsync(10_000);
    await rejected;
  });
});
