import { demoConfigured, issueDemoCookie, matchesDemoToken } from "./demo-session";
import { HttpError, readText, requireSameOrigin } from "./http-body";

// Preserve the same-origin form POST's Origin for CSRF validation.
const headers = { "Cache-Control": "no-store", "Referrer-Policy": "same-origin", "X-Content-Type-Options": "nosniff" };
const paths = new Set([
  "/", "/demo", "/doctor", "/doctor/new", "/doctor/profile", "/doctor/concierge",
  "/doctor/patients/pt_maria", "/doctor/patients/pt_james",
  "/coordinator", "/coordinator/prescribers", "/patient/rx_001", "/patient/rx_002", "/board", "/access", "/sim",
]);
function returnPath(value: unknown): string {
  if (value === undefined || value === null || value === "") return "/doctor";
  if (typeof value !== "string" || value.length > 512 || /[\\\r\n]/.test(value) || !value.startsWith("/") || value.startsWith("//")) throw new HttpError(400, "invalid_return_path");
  const url = new URL(value, "https://demo.invalid");
  if (url.origin !== "https://demo.invalid" || !paths.has(url.pathname)) throw new HttpError(400, "invalid_return_path");
  return url.pathname + url.search;
}
const escape = (value: string) => value.replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]!);
function failure(error: unknown) {
  return Response.json({ error: error instanceof HttpError ? error.code : "unavailable" }, { status: error instanceof HttpError ? error.status : 503, headers });
}

export function demoLoginGet(request: Request): Response {
  try {
    const next = returnPath(new URL(request.url).searchParams.get("next"));
    return new Response(`<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>FirstDose demo access</title><style>body{font:18px system-ui;max-width:28rem;margin:12vh auto;padding:1.5rem;color:#142b28;background:#f4f7f5}label,input,button{display:block}input,button{font:inherit;box-sizing:border-box;width:100%;padding:.8rem;margin:.75rem 0 1.5rem}button{background:#145c4e;color:white;border:0;border-radius:.4rem}h1{font-size:2rem}</style><main><h1>Open the FirstDose demo</h1><p>Ask the demo team to enter the private access code on this device.</p><form action="/api/demo-login" method="post"><label for="token">Demo access code</label><input id="token" name="token" type="password" autocomplete="off" required maxlength="512"><input type="hidden" name="next" value="${escape(next)}"><button type="submit">Open demo</button></form></main></html>`, {
      headers: { ...headers, "Content-Type": "text/html; charset=utf-8", "Content-Security-Policy": "default-src 'none'; style-src 'unsafe-inline'; form-action 'self'; base-uri 'none'; frame-ancestors 'none'" },
    });
  } catch (error) { return failure(error); }
}

export async function demoLoginPost(request: Request, env: Record<string, string | undefined> = process.env): Promise<Response> {
  try {
    requireSameOrigin(request, true);
    if (!demoConfigured(env)) throw new HttpError(503, "demo_not_configured");
    const type = request.headers.get("content-type")?.split(";")[0].trim().toLowerCase();
    if (type !== "application/json" && type !== "application/x-www-form-urlencoded") throw new HttpError(415, "unsupported_media_type");
    const text = await readText(request);
    let body: Record<string, unknown>;
    if (type === "application/json") {
      try { body = JSON.parse(text); } catch { throw new HttpError(400, "invalid_json"); }
    } else {
      const params = new URLSearchParams(text);
      if ([...params.keys()].some(key => params.getAll(key).length !== 1)) throw new HttpError(400, "invalid_login");
      body = Object.fromEntries(params);
    }
    if (!body || Array.isArray(body) || typeof body !== "object" || Object.keys(body).some(key => !["token", "next"].includes(key)) || typeof body.token !== "string") throw new HttpError(400, "invalid_login");
    const next = returnPath(body.next);
    if (!matchesDemoToken(body.token, env)) throw new HttpError(401, "unauthorized");
    const cookie = issueDemoCookie(request, env);
    if (type === "application/json") return Response.json({ redirect: next }, { headers: { ...headers, "Set-Cookie": cookie } });
    return new Response(null, { status: 303, headers: { ...headers, "Set-Cookie": cookie, Location: next } });
  } catch (error) { return failure(error); }
}
