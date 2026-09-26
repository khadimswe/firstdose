import { describe, expect, it } from "vitest";
import { demoLoginGet, demoLoginPost } from "@/lib/server/demo-login";
import { snapshotHandler, commandHandler } from "@/lib/server/command-http";

const token = "private-demo-test-token-at-least-32-characters";
const env = { FIRSTDOSE_DEMO_TOKEN: token };
function login(body: Record<string, string>, origin = "https://demo.example") {
  return new Request("https://demo.example/api/demo-login", { method: "POST", headers: { "content-type": "application/x-www-form-urlencoded", origin }, body: new URLSearchParams(body) });
}

describe("demo login", () => {
  it.each([
    "/demo", "/doctor/new", "/doctor/profile", "/doctor/concierge",
    "/doctor/patients/pt_maria", "/doctor/patients/pt_james", "/coordinator/prescribers",
  ])("returns to the exact v2 screen after login: %s", async next => {
    const form = demoLoginGet(new Request(`https://demo.example/api/demo-login?next=${encodeURIComponent(next)}`));
    expect(form.status).toBe(200);
    expect(await form.text()).toContain(`value="${next}"`);
    const response = await demoLoginPost(login({ token, next }), env);
    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toBe(next);
    expect(response.headers.get("set-cookie")).toContain("HttpOnly");
  });

  it.each([
    "/doctor/patients/pt_unknown", "/doctor/patients/rx_001", "/doctor/patients/pt_maria/edit",
    "/coordinator/prescribers/unknown", "/doctor/new/api/events",
  ])("keeps unknown v2 routes outside the login return allowlist: %s", async next => {
    const form = demoLoginGet(new Request(`https://demo.example/api/demo-login?next=${encodeURIComponent(next)}`));
    expect(form.status).toBe(400);
    const response = await demoLoginPost(login({ token, next }), env);
    expect(response.status).toBe(400);
    expect(response.headers.has("set-cookie")).toBe(false);
  });

  it("serves a no-script password form with a safe patient return path", async () => {
    const response = demoLoginGet(new Request("https://demo.example/api/demo-login?next=%2Fpatient%2Frx_001"));
    const html = await response.text();
    expect(response.status).toBe(200);
    expect(html).toContain('type="password"');
    expect(html).toContain('/patient/rx_001');
    expect(html).not.toContain(token);
    expect(response.headers.get("content-security-policy")).toContain("default-src 'none'");
    expect(response.headers.get("cache-control")).toBe("no-store");
  });

  it("exchanges an entered token for a cookie and returns to the patient's QR destination", async () => {
    const response = await demoLoginPost(login({ token, next: "/patient/rx_001" }), env);
    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toBe("/patient/rx_001");
    expect(response.headers.get("set-cookie")).toContain("HttpOnly");
    const cookie = response.headers.get("set-cookie")!.split(";")[0];
    expect(cookie).not.toContain(token);
    const snapshot = { run_id: "63d4b651-0eb5-440d-a523-e8daf82f36ca", revision: 0, events: [] };
    const store = { snapshot: async () => snapshot, commit: async () => snapshot, reset: async () => snapshot };
    const read = await snapshotHandler({ store, env })(new Request("https://demo.example/api/events", { headers: { cookie } }));
    expect(read.status).toBe(200);
    const write = await commandHandler("reset", { store, env })(new Request("https://demo.example/api/sim/reset", { method: "POST", headers: { cookie, origin: "https://demo.example", "content-type": "application/json", "x-firstdose-run": snapshot.run_id }, body: "{}" }));
    expect(write.status).toBe(200);
    const csrf = await commandHandler("reset", { store, env })(new Request("https://demo.example/api/sim/reset", { method: "POST", headers: { cookie, "content-type": "application/json", "x-firstdose-run": snapshot.run_id }, body: "{}" }));
    expect(csrf.status).toBe(403);
  });

  it.each(["https://attacker.example", "null", ""])("rejects cross-origin or missing-origin login", async origin => {
    expect((await demoLoginPost(login({ token }, origin), env)).status).toBe(403);
  });

  it("rejects wrong tokens without reflecting credentials or setting a cookie", async () => {
    const response = await demoLoginPost(login({ token: "wrong" }), env);
    expect(response.status).toBe(401);
    expect(response.headers.has("set-cookie")).toBe(false);
    expect(await response.text()).not.toContain("wrong");
  });

  it.each(["https://attacker.example", "//attacker.example", "/\\attacker.example", "/api/events", "/doctor\r\nSet-Cookie:x"])("rejects unsafe return paths", async next => {
    const response = await demoLoginPost(login({ token, next }), env);
    expect(response.status).toBe(400);
    expect(response.headers.has("set-cookie")).toBe(false);
  });

  it("rejects extra/duplicate fields and excessive bodies", async () => {
    expect((await demoLoginPost(login({ token, trusted: "yes" }), env)).status).toBe(400);
    const duplicate = login({ token });
    const request = new Request(duplicate.url, { method: "POST", headers: duplicate.headers, body: `token=${token}&token=${token}` });
    expect((await demoLoginPost(request, env)).status).toBe(400);
    expect((await demoLoginPost(login({ token: "x".repeat(9000) }), env)).status).toBe(413);
  });
});
