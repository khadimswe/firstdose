import { describe, expect, it, vi } from "vitest";
import { patientMessageHandler } from "@/lib/server/patient-message-http";
import { validateMessageCommand } from "@/lib/server/patient-messages";
import { issueDemoCookie } from "@/lib/server/demo-session";
import { PersistenceError } from "@/lib/server/commands";

const run = "63d4b651-0eb5-440d-a523-e8daf82f36ca";
const env = { FIRSTDOSE_DEMO_TOKEN: "patient-message-local-test-token-long-enough" };
const body = { action: "approve", case_id: "rx_001", lang: "es" };
const snapshot = { run_id: run, revision: 0, messages: [] };
const store = () => ({ snapshot: vi.fn(async () => snapshot), command: vi.fn(async () => snapshot) });
const req = (value: unknown = body, headers = {}, method = "POST") => new Request("https://demo.test/api/patient/message", {
  method, headers: { authorization: `Bearer ${env.FIRSTDOSE_DEMO_TOKEN}`, "content-type": "application/json", "x-firstdose-run": run, ...headers },
  ...(method === "POST" ? { body: JSON.stringify(value) } : {}),
});

describe("patient message boundary", () => {
  it.each([body, { ...body, lang: "en" }, { action: "acknowledge", case_id: "rx_001" }])("accepts fixed intent %j", command => {
    expect(() => validateMessageCommand(command)).not.toThrow();
  });
  it.each([null, [], {}, { ...body, case_id: "rx_002" }, { ...body, lang: "fr" }, { ...body, text: "custom" },
    { action: ["acknowledge"], case_id: "rx_001" }, { ...body, action: "send" }, { ...body, at: "2026-09-26" }, { ...body, actor: "coordinator" }, { ...body, action: "acknowledge" }])("rejects fabricated intent %j", command => {
    expect(() => validateMessageCommand(command)).toThrow();
  });
  it("returns a protected uncached active snapshot", async () => {
    const response = await patientMessageHandler("read", { env, store: store() })(req({}, {}, "GET"));
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual(snapshot);
    expect(response.headers.get("cache-control")).toBe("no-store");
  });
  it.each([[{ authorization: "" }, 401], [{ origin: "https://evil.test" }, 403],
    [{ "x-firstdose-run": "" }, 428], [{ "x-firstdose-run": "bad" }, 400], [{ "content-type": "text/plain" }, 415]] as const)("guards writes", async (headers, status) => {
    const db = store();
    expect((await patientMessageHandler("write", { env, store: db })(req(body, headers))).status).toBe(status);
    expect(db.command).not.toHaveBeenCalled();
  });
  it("requires Origin for the actual session-cookie path", async () => {
    const cookie = issueDemoCookie(req(), env).split(";")[0];
    const db = store();
    const request = new Request("https://demo.test/api/patient/message", { method: "POST", headers: { cookie, "content-type": "application/json", "x-firstdose-run": run }, body: JSON.stringify(body) });
    expect((await patientMessageHandler("write", { env, store: db })(request)).status).toBe(403);
    expect(db.command).not.toHaveBeenCalled();
  });
  it("bounds bodies and sanitizes unavailable failures", async () => {
    const db = store();
    const handler = patientMessageHandler("write", { env, store: db });
    expect((await handler(req({ ...body, text: "x".repeat(9000) }))).status).toBe(413);
    db.command.mockRejectedValueOnce(new Error("private provider URL"));
    expect(await (await handler(req())).json()).toEqual({ error: "unavailable" });
    db.command.mockRejectedValueOnce(new PersistenceError("stale_run"));
    expect((await handler(req())).status).toBe(409);
  });
});
