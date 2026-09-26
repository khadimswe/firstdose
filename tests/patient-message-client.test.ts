import { describe, expect, it } from "vitest";
import { createMessageClient } from "@/lib/patient-message-client";
import { parseMessageSnapshot } from "@/lib/patient-messages";

const run = "63d4b651-0eb5-440d-a523-e8daf82f36ca";
const nextRun = "12c21f65-988b-401c-a1c5-1973656f77a6";
const approved = { case_id: "rx_001", lang: "es", template_id: "patient_message_v1", approved_at: "2026-09-26T16:00:00.123456+00:00", acknowledged_at: null };
const snapshot = { run_id: run, revision: 3, messages: [approved] };
const deferred = () => { let resolve!: (value: Response) => void; const promise = new Promise<Response>(r => { resolve = r; }); return { promise, resolve }; };
describe("patient message client", () => {
  it("hides a previous run immediately even when replay already has the same fix", async () => {
    const client = createMessageClient({ fetch: async () => Response.json(snapshot) });
    client.observeRun(run);
    await client.refresh();
    expect(client.getSnapshot().ready).toBe(true);
    client.observeRun(nextRun);
    expect(client.getSnapshot().ready).toBe(false);
    expect(client.getSnapshot().data).toBeNull();
    await client.refresh(); // Lagging message endpoint must not revive the prior approval.
    expect(client.getSnapshot().data).toBeNull();
  });
  it("holds an ahead-of-workflow message snapshot until the fill source observes its run", async () => {
    const client = createMessageClient({ fetch: async () => Response.json({ ...snapshot, run_id: nextRun }) });
    client.observeRun(run);
    await client.refresh();
    expect(client.getSnapshot().ready).toBe(false);
    client.observeRun(nextRun);
    expect(client.getSnapshot().ready).toBe(true);
    expect(client.getSnapshot().observedRun).toBe(nextRun);
  });
  it("hydrates approvals from another device and clears them on reset", async () => {
    let data = snapshot;
    const client = createMessageClient({ fetch: async () => Response.json(data) });
    client.observeRun(run);
    await client.refresh();
    expect(client.getSnapshot().data?.messages[0].lang).toBe("es");
    data = { run_id: nextRun, revision: 0, messages: [] };
    client.observeRun(nextRun);
    await client.refresh();
    expect(client.getSnapshot().data).toEqual(data);
  });
  it("fences a delayed old GET after a newer reset snapshot", async () => {
    const delayed = deferred(); let calls = 0;
    const client = createMessageClient({ fetch: async () => ++calls === 1 ? delayed.promise : Response.json({ run_id: nextRun, revision: 0, messages: [] }) });
    const old = client.refresh();
    await client.refresh();
    delayed.resolve(Response.json(snapshot)); await old;
    expect(client.getSnapshot().data?.run_id).toBe(nextRun);
    expect(client.getSnapshot().data?.messages).toEqual([]);
  });
  it("does not let an old write response resurrect a reset run", async () => {
    const delayed = deferred(); let calls = 0;
    const client = createMessageClient({ fetch: async (_url, init) => {
      if (init?.method === "POST") return delayed.promise;
      return Response.json(++calls === 1 ? snapshot : { run_id: nextRun, revision: 0, messages: [] });
    } });
    client.observeRun(run);
    await client.refresh();
    const write = client.command({ action: "acknowledge", case_id: "rx_001" });
    client.observeRun(nextRun);
    await client.refresh();
    delayed.resolve(Response.json({ ...snapshot, revision: 4, messages: [{ ...approved, acknowledged_at: "2026-09-26T16:01:00Z" }] }));
    await write;
    expect(client.getSnapshot().data?.run_id).toBe(nextRun);
    expect(client.getSnapshot().data?.messages).toEqual([]);
    expect(client.getSnapshot().pending).toBe(false);
  });
  it("captures the displayed run at click time and never retries onto another run", async () => {
    const writes: RequestInit[] = []; let reads = 0;
    const client = createMessageClient({ fetch: async (_url, init) => {
      if (init?.method === "POST") { writes.push(init); return Response.json({ error: "stale_run" }, { status: 409 }); }
      return Response.json(++reads === 1 ? snapshot : { run_id: nextRun, revision: 0, messages: [] });
    } });
    client.observeRun(run);
    await client.refresh(); await client.command({ action: "acknowledge", case_id: "rx_001" });
    expect(writes).toHaveLength(1);
    expect(new Headers(writes[0].headers).get("x-firstdose-run")).toBe(run);
    expect(client.getSnapshot().data?.run_id).toBe(nextRun);
    expect(client.getSnapshot().actionError).toBe("stale_run");
  });
  it("reports sync failures, disables writes, then recovers on reconnect", async () => {
    let fail = true; let posts = 0;
    const client = createMessageClient({ fetch: async (_url, init) => {
      if (init?.method === "POST") posts++;
      if (fail) throw new Error("private detail");
      return Response.json(snapshot);
    } });
    client.observeRun(run);
    await client.refresh();
    expect(client.getSnapshot().ready).toBe(false);
    expect(client.getSnapshot().syncError).toBe("unavailable");
    await client.command({ action: "approve", case_id: "rx_001", lang: "en" });
    expect(posts).toBe(0);
    fail = false; await client.refresh();
    expect(client.getSnapshot().ready).toBe(true);
    expect(client.getSnapshot().syncError).toBeNull();
  });
  it.each([ { ...snapshot, revision: -1 }, { ...snapshot, messages: [approved, approved] },
    { ...snapshot, messages: [{ ...approved, lang: ["en"] }] },
    { ...snapshot, messages: [{ ...approved, lang: "fr" }] },
    { ...snapshot, messages: [{ ...approved, acknowledged_at: "2020-01-01" }] } ])("rejects corrupted snapshots", value => {
    expect(() => parseMessageSnapshot(value)).toThrow();
  });
});
