import { describe, expect, it, vi } from "vitest";
import { coordinatorHandler } from "@/lib/server/coordinator-http";
import { validateCoordinatorCommand, type CoordinatorSnapshot, type CoordinatorStore } from "@/lib/server/coordinator";
import { PersistenceError } from "@/lib/server/commands";

const run = "63d4b651-0eb5-440d-a523-e8daf82f36ca";
const token = "local-coordinator-test-token-at-least-32-characters";
const env = { FIRSTDOSE_DEMO_TOKEN: token };
const command = { action: "request", coordinator_id: "coord_demo", prescriber_id: "prescriber_demo" };
const snapshot: CoordinatorSnapshot = { run_id: run, revision: 2, events: [], links: [], cases: [] };
function store(): CoordinatorStore {
  return { snapshot: vi.fn(async () => snapshot), command: vi.fn(async () => snapshot) };
}
function req(body: unknown = command, headers: Record<string, string> = {}, method = "POST") {
  return new Request("http://localhost/api/coordinator", { method,
    headers: { authorization: `Bearer ${token}`, "content-type": "application/json", "x-firstdose-run": run, ...headers },
    ...(method === "POST" ? { body: JSON.stringify(body) } : {}),
  });
}

describe("coordinator contract", () => {
  it.each(["invite", "request", "approve"])("accepts fixed fictional %s", action => {
    expect(() => validateCoordinatorCommand({ ...command, action })).not.toThrow();
  });
  it("accepts assignment with a case", () => {
    expect(() => validateCoordinatorCommand({ ...command, action: "assign", case_id: "rx_001" })).not.toThrow();
  });
  it.each([
    null, [], {}, { ...command, action: "linked" }, { ...command, coordinator_id: "real-person" },
    { ...command, prescriber_id: "1234567890" }, { ...command, actor: "doctor" },
    { ...command, at: "2026-09-26" }, { ...command, case_id: "rx_001" },
    { ...command, action: "assign" }, { ...command, action: "assign", case_id: "x".repeat(101) },
  ])("rejects untrusted payload %j", body => {
    expect(() => validateCoordinatorCommand(body)).toThrow();
  });
});

describe("protected coordinator API", () => {
  it("reads a separate no-store snapshot with run/revision headers", async () => {
    const response = await coordinatorHandler("read", { env, store: store() })(req({}, {}, "GET"));
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual(snapshot);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(response.headers.get("x-firstdose-run")).toBe(run);
  });
  it("passes only validated commands with normalized run identity", async () => {
    const db = store();
    const response = await coordinatorHandler("write", { env, store: db })(req(command, { "x-firstdose-run": run.toUpperCase() }));
    expect(response.status).toBe(200);
    expect(db.command).toHaveBeenCalledWith(run, command);
  });
  it.each([
    [{ authorization: "" }, 401], [{ origin: "https://elsewhere.example" }, 403],
    [{ "sec-fetch-site": "cross-site" }, 403], [{ "x-firstdose-run": "" }, 428],
    [{ "x-firstdose-run": "bad" }, 400], [{ "content-type": "text/plain" }, 415],
  ] as const)("rejects invalid writes before storage", async (headers, status) => {
    const db = store();
    const response = await coordinatorHandler("write", { env, store: db })(req(command, headers));
    expect(response.status).toBe(status);
    expect(db.command).not.toHaveBeenCalled();
  });
  it("rejects malformed and oversized commands before storage", async () => {
    const db = store();
    const handler = coordinatorHandler("write", { env, store: db });
    expect((await handler(req({ ...command, extra: true }))).status).toBe(400);
    expect((await handler(req({ data: "x".repeat(9000) }))).status).toBe(413);
    expect(db.command).not.toHaveBeenCalled();
  });
  it("keeps stale-run errors distinct from sanitized provider failure", async () => {
    const db = store();
    db.command = async () => { throw new PersistenceError("stale_run"); };
    expect((await coordinatorHandler("write", { env, store: db })(req())).status).toBe(409);
    db.command = async () => { throw new Error("secret provider detail"); };
    const response = await coordinatorHandler("write", { env, store: db })(req());
    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({ error: "unavailable" });
  });
  it("requires configuration and authentication for reads", async () => {
    const db = store();
    expect((await coordinatorHandler("read", { env: {}, store: db })(req({}, {}, "GET"))).status).toBe(503);
    expect((await coordinatorHandler("read", { env, store: db })(req({}, { authorization: "" }, "GET"))).status).toBe(401);
    expect(db.snapshot).not.toHaveBeenCalled();
  });
});
