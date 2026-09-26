import { describe, expect, it } from "vitest";
import { commandHandler, snapshotHandler } from "@/lib/server/command-http";
import { PersistenceError, type Snapshot, type WorkflowStore } from "@/lib/server/commands";

const runId = "63d4b651-0eb5-440d-a523-e8daf82f36ca";
const token = "a-local-test-token-with-at-least-32-characters";
const env = { FIRSTDOSE_DEMO_TOKEN: token };
const prescribe = { patient_id: "pt_maria", drug_id: "drug_otezla" };
function request(body: unknown = prescribe, headers: Record<string, string> = {}) {
  return new Request("http://localhost:3000/api/rx", {
    method: "POST", headers: { authorization: `Bearer ${token}`, "content-type": "application/json", "x-firstdose-run": runId, ...headers }, body: JSON.stringify(body),
  });
}
function makeStore(): WorkflowStore {
  let state: Snapshot = { run_id: runId, revision: 0, events: [] };
  return {
    snapshot: async () => structuredClone(state),
    commit: async (run, revision, events) => {
      if (run !== state.run_id) throw new PersistenceError("stale_run");
      if (revision !== state.revision) throw new PersistenceError("revision_conflict");
      state = { ...state, revision: revision + (events.length ? 1 : 0), events: [...state.events, ...events] };
      return structuredClone(state);
    },
    reset: async run => {
      if (run !== state.run_id) throw new PersistenceError("stale_run");
      state = { run_id: "12c21f65-988b-401c-a1c5-1973656f77a6", revision: 0, events: [] };
      return state;
    },
  };
}

describe("guarded demo command HTTP boundary", () => {
  it("schedules notification work only after a successful atomic command", async () => {
    const store = makeStore();
    const scheduled: string[][] = [];
    const handler = commandHandler("prescribe", { store, env, onCommit: async () => { scheduled.push((await store.snapshot()).events.map(e => e.id)); } });
    expect((await handler(request())).status).toBe(200);
    expect(scheduled).toEqual([["ev_01", "ev_03"]]);
    expect((await handler(request({ ...prescribe, trusted: true }))).status).toBe(400);
    expect(scheduled).toHaveLength(1);
  });

  it("returns committed script IDs with run and revision headers", async () => {
    const store = makeStore();
    const response = await commandHandler("prescribe", { store, env })(request());
    expect(response.status).toBe(200);
    expect((await response.json()).map((e: { id: string }) => e.id)).toEqual(["ev_01", "ev_03"]);
    expect(response.headers.get("x-firstdose-run")).toBe(runId);
    expect(response.headers.get("x-firstdose-revision")).toBe("1");
    expect(response.headers.get("cache-control")).toBe("no-store");
    const repeat = await commandHandler("prescribe", { store, env })(request());
    expect(await repeat.json()).toEqual([]);
  });

  it.each(["", "Bearer wrong"])("rejects unauthorized reads and writes before touching storage", async authorization => {
    const store = makeStore();
    store.snapshot = async () => { throw new Error("Storage must not run"); };
    expect((await commandHandler("prescribe", { store, env })(request(prescribe, { authorization }))).status).toBe(401);
    expect((await snapshotHandler({ store, env })(new Request("http://localhost/api/events", { headers: { authorization } }))).status).toBe(401);
  });

  it("fails closed until a private demo token is configured", async () => {
    expect((await commandHandler("prescribe", { store: makeStore(), env: {} })(request())).status).toBe(503);
  });

  it.each<Record<string, string>>([{ origin: "https://attacker.example" }, { "sec-fetch-site": "cross-site" }])("blocks cross-origin commands", async headers => {
    expect((await commandHandler("prescribe", { store: makeStore(), env })(request(prescribe, headers))).status).toBe(403);
  });

  it.each([
    [{ ...prescribe, kind: "fire", ids: ["ev_11"] }, 400],
    [{ ...prescribe, trusted: true }, 400],
    [null, 400],
    [[], 400],
    [{ patient_id: "unknown", drug_id: "drug_otezla" }, 400],
  ])("strictly validates the route's command payload", async (body, status) => {
    const store = makeStore();
    expect((await commandHandler("prescribe", { store, env })(request(body))).status).toBe(status);
    expect((await store.snapshot()).events).toEqual([]);
  });

  it.each([
    [{ "x-firstdose-run": "" }, 428],
    [{ "x-firstdose-run": "bad" }, 400],
    [{ "x-firstdose-run": "12c21f65-988b-401c-a1c5-1973656f77a6" }, 409],
    [{ "content-type": "text/plain" }, 415],
  ])("rejects invalid run identity or media type", async (headers, status) => {
    expect((await commandHandler("prescribe", { store: makeStore(), env })(request(prescribe, headers as Record<string, string>))).status).toBe(status);
  });

  it("bounds streamed input even without a content-length header", async () => {
    const response = await commandHandler("prescribe", { store: makeStore(), env })(request({ patient_id: "x".repeat(9000), drug_id: "drug_otezla" }));
    expect(response.status).toBe(413);
  });

  it("reports malformed JSON without leaking parser details", async () => {
    const req = request();
    const broken = new Request(req.url, { method: "POST", headers: req.headers, body: "{" });
    const response = await commandHandler("prescribe", { store: makeStore(), env })(broken);
    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: "invalid_json" });
  });

  it("maps a forbidden transition to 409 without inserting anything", async () => {
    const store = makeStore();
    const response = await commandHandler("handoff", { store, env })(request({ case_id: "rx_001" }));
    expect(response.status).toBe(409);
    expect((await store.snapshot()).events).toEqual([]);
  });

  it("resets into a new snapshot and rejects a delayed old command", async () => {
    const store = makeStore();
    const response = await commandHandler("reset", { store, env })(request({}));
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ revision: 0, events: [] });
    expect(response.headers.get("x-firstdose-run")).not.toBe(runId);
    expect((await commandHandler("prescribe", { store, env })(request())).status).toBe(409);
  });

  it("reads a protected snapshot and sanitizes unexpected provider errors", async () => {
    const store = makeStore();
    const req = new Request("http://localhost/api/events", { headers: { authorization: `Bearer ${token}` } });
    const response = await snapshotHandler({ store, env })(req);
    expect(await response.json()).toEqual({ run_id: runId, revision: 0, events: [] });
    store.snapshot = async () => { throw new Error("secret database detail"); };
    const failed = await snapshotHandler({ store, env })(req);
    expect(failed.status).toBe(503);
    expect(await failed.json()).toEqual({ error: "unavailable" });
  });

  it("returns not-modified only for the same authorized run and revision", async () => {
    const store = makeStore();
    const handler = snapshotHandler({ store, env });
    const headers = { authorization: `Bearer ${token}` };
    const first = await handler(new Request("http://localhost/api/events", { headers }));
    const etag = first.headers.get("etag");
    expect(etag).toBe(`"${runId}:0"`);
    const conditional = new Request("http://localhost/api/events", { headers: { ...headers, "if-none-match": etag! } });
    const unchanged = await handler(conditional);
    expect(unchanged.status).toBe(304);
    expect(await unchanged.text()).toBe("");
    await store.reset(runId);
    const reset = await handler(conditional);
    expect(reset.status).toBe(200);
    expect(reset.headers.get("etag")).not.toBe(etag);
    expect((await handler(new Request("http://localhost/api/events", { headers: { "if-none-match": reset.headers.get("etag")! } }))).status).toBe(401);
  });
});
