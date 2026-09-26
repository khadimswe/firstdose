export class HttpError extends Error {
  constructor(public status: number, public code: string) { super(code); }
}

/** Bound bytes while streaming rather than trusting a caller's Content-Length. */
export async function readText(request: Request): Promise<string> {
  const reader = request.body?.getReader();
  if (!reader) return "";
  const decoder = new TextDecoder();
  let text = "", bytes = 0;
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      bytes += value.byteLength;
      if (bytes > 8_192) {
        await reader.cancel();
        throw new HttpError(413, "body_too_large");
      }
      text += decoder.decode(value, { stream: true });
    }
    return text + decoder.decode();
  } finally { reader.releaseLock(); }
}

export function requireSameOrigin(request: Request, required = false) {
  const origin = request.headers.get("origin");
  if (request.headers.get("sec-fetch-site") === "cross-site" || (required && !origin) || (origin && origin !== new URL(request.url).origin)) {
    throw new HttpError(403, "forbidden_origin");
  }
}
