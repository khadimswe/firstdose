import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";

type Env = Record<string, string | undefined>;
const lifetime = 12 * 60 * 60;
const equal = (a: string, b: string) => timingSafeEqual(createHash("sha256").update(a).digest(), createHash("sha256").update(b).digest());
const secure = (request: Request, env: Env) => env.NODE_ENV === "production" || new URL(request.url).protocol === "https:";
const name = (request: Request, env: Env) => secure(request, env) ? "__Host-firstdose_demo" : "firstdose_demo";
const sign = (payload: string, secret: string) => createHmac("sha256", secret).update(`firstdose-demo-v1:${payload}`).digest("base64url");

export function demoConfigured(env: Env): boolean {
  return (env.FIRSTDOSE_DEMO_TOKEN?.length ?? 0) >= 32;
}

export function matchesDemoToken(value: string, env: Env): boolean {
  return demoConfigured(env) && equal(value, env.FIRSTDOSE_DEMO_TOKEN!);
}

export function issueDemoCookie(request: Request, env: Env, now = Date.now()): string {
  if (!demoConfigured(env)) throw new Error("demo_not_configured");
  const payload = `${Math.floor(now / 1000) + lifetime}.${randomBytes(16).toString("hex")}`;
  return `${name(request, env)}=${payload}.${sign(payload, env.FIRSTDOSE_DEMO_TOKEN!)}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${lifetime}${secure(request, env) ? "; Secure" : ""}`;
}

export function demoAccess(request: Request, env: Env, now = Date.now()): "bearer" | "session" | null {
  if (!demoConfigured(env)) return null;
  const authorization = request.headers.get("authorization");
  if (authorization !== null) return equal(authorization, `Bearer ${env.FIRSTDOSE_DEMO_TOKEN!}`) ? "bearer" : null;
  const prefix = `${name(request, env)}=`;
  const cookies = (request.headers.get("cookie") ?? "").split(";").map(value => value.trim()).filter(value => value.startsWith(prefix));
  if (cookies.length !== 1) return null;
  const value = cookies[0].slice(prefix.length);
  const match = /^(\d{10})\.([a-f0-9]{32})\.([A-Za-z0-9_-]{43})$/.exec(value);
  if (!match) return null;
  const expires = Number(match[1]);
  const current = Math.floor(now / 1000);
  if (expires <= current || expires > current + lifetime) return null;
  return equal(match[3], sign(`${match[1]}.${match[2]}`, env.FIRSTDOSE_DEMO_TOKEN!)) ? "session" : null;
}
