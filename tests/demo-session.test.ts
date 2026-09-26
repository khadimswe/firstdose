import { describe, expect, it } from "vitest";
import { demoAccess, issueDemoCookie } from "@/lib/server/demo-session";

const token = "private-demo-test-token-at-least-32-characters";
const env = { FIRSTDOSE_DEMO_TOKEN: token };
const now = 1_790_000_000_000;
const request = (cookie = "", url = "https://demo.example/api/events") => new Request(url, { headers: { cookie } });
const pair = (cookie: string) => cookie.split(";")[0];

describe("private demo session", () => {
  it("issues a signed HttpOnly host cookie without exposing the master token", () => {
    const cookie = issueDemoCookie(request(), env, now);
    expect(cookie).toContain("__Host-firstdose_demo=");
    expect(cookie).toContain("HttpOnly");
    expect(cookie).toContain("Secure");
    expect(cookie).toContain("SameSite=Strict");
    expect(cookie).toContain("Path=/");
    expect(cookie).not.toContain(token);
    expect(cookie).not.toContain("Domain=");
    expect(demoAccess(request(pair(cookie)), env, now)).toBe("session");
  });

  it("supports local HTTP development without accepting that cookie on HTTPS", () => {
    const local = issueDemoCookie(request("", "http://localhost:3000/api/demo-login"), env, now);
    expect(local).toMatch(/^firstdose_demo=/);
    expect(local).not.toContain("; Secure");
    expect(demoAccess(request(pair(local), "http://localhost:3000/api/events"), env, now)).toBe("session");
    expect(demoAccess(request(pair(local)), env, now)).toBe(null);
  });

  it("rejects tampering, expiration, duplicated cookies and rotated tokens", () => {
    const cookie = pair(issueDemoCookie(request(), env, now));
    expect(demoAccess(request(cookie.slice(0, -1) + (cookie.endsWith("a") ? "b" : "a")), env, now)).toBe(null);
    expect(demoAccess(request(cookie), env, now + 12 * 60 * 60 * 1000 + 1)).toBe(null);
    expect(demoAccess(request(`${cookie}; ${cookie}`), env, now)).toBe(null);
    expect(demoAccess(request(cookie), { FIRSTDOSE_DEMO_TOKEN: token + "rotated" }, now)).toBe(null);
  });

  it("keeps private bearer access for CLI without accepting a bad explicit bearer via cookie fallback", () => {
    const cookie = pair(issueDemoCookie(request(), env, now));
    expect(demoAccess(new Request("https://demo.example/api/events", { headers: { authorization: `Bearer ${token}` } }), env, now)).toBe("bearer");
    expect(demoAccess(new Request("https://demo.example/api/events", { headers: { cookie, authorization: "Bearer wrong" } }), env, now)).toBe(null);
  });
});
