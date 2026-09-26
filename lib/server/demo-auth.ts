import { createHash, timingSafeEqual } from "node:crypto";

export class HttpError extends Error {
  constructor(public status: number, public code: string) { super(code); }
}
const digest = (value: string) => createHash("sha256").update(value).digest();

export function authorizeDemo(request: Request, env: Record<string, string | undefined>) {
  const token = env.FIRSTDOSE_DEMO_TOKEN;
  if (!token || token.length < 32) throw new HttpError(503, "demo_not_configured");
  if (!timingSafeEqual(digest(request.headers.get("authorization") ?? ""), digest(`Bearer ${token}`))) throw new HttpError(401, "unauthorized");
  if (request.headers.get("sec-fetch-site") === "cross-site") throw new HttpError(403, "forbidden_origin");
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin) throw new HttpError(403, "forbidden_origin");
}
