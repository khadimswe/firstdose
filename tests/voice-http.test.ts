import { describe, expect, it, vi } from "vitest";
import { voiceHandler } from "@/lib/server/voice-http";
import { commandHandler } from "@/lib/server/command-http";
import type { Snapshot, WorkflowStore } from "@/lib/server/commands";
import { planCommand } from "@/lib/server/workflow";
import { issueDemoCookie } from "@/lib/server/demo-session";

const runId = "63d4b651-0eb5-440d-a523-e8daf82f36ca";
const env = { FIRSTDOSE_DEMO_TOKEN: "local-demo-token-at-least-32-characters", XAI_API_KEY: "local-test-key" };
function request(form?: FormData, extra: Record<string, string> = {}) {
  const body = form ?? new FormData();
  if (!form) body.set("audio", new Blob(["test audio"], { type: "audio/wav" }), "private-name.wav");
  return new Request("http://localhost:3000/api/voice", { method: "POST", headers: { authorization: `Bearer ${env.FIRSTDOSE_DEMO_TOKEN}`, "x-firstdose-run": runId, ...extra }, body });
}
const provider: typeof fetch = async () => Response.json({ text: "send maria to my coordinator" });

describe("voice HTTP proposal boundary", () => {
  it("returns a no-store proposal bound to the submitted run without invoking the workflow", async () => {
    const fetchImpl = vi.fn(provider);
    const response = await voiceHandler({ env, fetchImpl })(request());
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ transcript: "send maria to my coordinator", intent: "SEND_TO_COORDINATOR", case_id: "rx_001" });
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(response.headers.get("x-firstdose-run")).toBe(runId);
    // Any accidental Supabase or handoff request would be an additional fetch.
    expect(fetchImpl).toHaveBeenCalledTimes(1);
    expect(fetchImpl.mock.calls[0][0]).toBe("https://api.x.ai/v1/stt");
  });

  it.each([
    [{ authorization: "" }, 401, "unauthorized"],
    [{ origin: "https://other.example" }, 403, "forbidden_origin"],
    [{ "sec-fetch-site": "cross-site" }, 403, "forbidden_origin"],
    [{ "x-firstdose-run": "" }, 428, "run_required"],
    [{ "x-firstdose-run": "bad" }, 400, "invalid_run"],
    [{ "content-type": "application/json" }, 415, "multipart_required"],
  ])("rejects unauthorized or malformed requests before uploading", async (headers, status, error) => {
    const fetchImpl = vi.fn(provider);
    const response = await voiceHandler({ env, fetchImpl })(request(undefined, headers as Record<string, string>));
    expect(response.status).toBe(status);
    expect(await response.json()).toEqual({ error });
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("fails closed without demo auth configuration", async () => {
    expect((await voiceHandler({ env: {}, fetchImpl: provider })(request())).status).toBe(503);
  });

  it("accepts the existing browser session with a same-origin upload", async () => {
    const original = request();
    const headers = new Headers(original.headers);
    headers.delete("authorization");
    headers.set("cookie", issueDemoCookie(original, env).split(";")[0]);
    headers.set("origin", "http://localhost:3000");
    const authenticated = new Request(original, { headers });
    const response = await voiceHandler({ env, fetchImpl: provider })(authenticated);
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ intent: "SEND_TO_COORDINATOR", case_id: "rx_001" });
  });

  it.each([undefined, "https://attacker.example"])("rejects a browser session without a matching origin: %s", async origin => {
    const original = request();
    const headers = new Headers(original.headers);
    headers.delete("authorization");
    headers.set("cookie", issueDemoCookie(original, env).split(";")[0]);
    if (origin) headers.set("origin", origin);
    const fetchImpl = vi.fn(provider);
    const response = await voiceHandler({ env, fetchImpl })(new Request(original, { headers }));
    expect(response.status).toBe(403);
    expect(await response.json()).toEqual({ error: "forbidden_origin" });
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("does not use a valid cookie to bypass an invalid explicit bearer", async () => {
    const original = request();
    const headers = new Headers(original.headers);
    headers.set("authorization", "Bearer wrong");
    headers.set("cookie", issueDemoCookie(original, env).split(";")[0]);
    headers.set("origin", "http://localhost:3000");
    const fetchImpl = vi.fn(provider);
    expect((await voiceHandler({ env, fetchImpl })(new Request(original, { headers }))).status).toBe(401);
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it.each(["missing", "duplicate", "text", "extra", "keyterms", "url"])("rejects invalid multipart shape: %s", async kind => {
    const form = new FormData();
    if (kind !== "missing") form.set("audio", new Blob(["test"], { type: "audio/wav" }));
    if (kind === "duplicate") form.append("audio", new Blob(["test"], { type: "audio/wav" }));
    if (kind === "text") form.set("audio", "not a file");
    if (kind === "extra") form.set("confirmed", "true");
    if (kind === "keyterms") form.set("keyterms", "Maria");
    if (kind === "url") form.set("url", "http://internal.example/audio.wav");
    const fetchImpl = vi.fn(provider);
    expect((await voiceHandler({ env, fetchImpl })(request(form))).status).toBe(400);
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("bounds the actual multipart bytes without trusting content-length", async () => {
    const form = new FormData();
    form.set("audio", new Blob([new Uint8Array(4_100_001)], { type: "audio/wav" }));
    const encoded = request(form, { "content-length": "1" });
    // Supply wire bytes: Node's synthetic FormData producer throws after early cancellation.
    const wireRequest = new Request(encoded.url, { method: "POST", headers: encoded.headers, body: await encoded.arrayBuffer() });
    const response = await voiceHandler({ env, fetchImpl: provider })(wireRequest);
    expect(response.status).toBe(413);
    expect(await response.json()).toEqual({ error: "body_too_large" });
  });

  it("reports malformed multipart input without parser details", async () => {
    const req = request();
    const response = await voiceHandler({ env, fetchImpl: provider })(new Request(req.url, { method: "POST", headers: req.headers, body: "broken" }));
    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: "invalid_multipart" });
  });

  it("interrupts a stalled upload at the configured deadline without calling xAI", async () => {
    vi.useFakeTimers();
    const timeout = vi.spyOn(AbortSignal, "timeout").mockImplementation(milliseconds => {
      const controller = new AbortController();
      setTimeout(() => controller.abort(new DOMException("deadline", "TimeoutError")), milliseconds);
      return controller.signal;
    });
    try {
      let cancelled = false;
      const template = request();
      const init: RequestInit & { duplex: "half" } = { method: "POST", headers: template.headers, duplex: "half", body: new ReadableStream({ cancel() { cancelled = true; } }) };
      const fetchImpl = vi.fn(provider);
      const pending = voiceHandler({ env, fetchImpl })(new Request(template.url, init));
      await vi.advanceTimersByTimeAsync(9_999);
      expect(cancelled).toBe(false);
      await vi.advanceTimersByTimeAsync(1);
      const response = await pending;
      expect(response.status).toBe(408);
      expect(await response.json()).toEqual({ error: "upload_timeout" });
      expect(cancelled).toBe(true);
      expect(fetchImpl).not.toHaveBeenCalled();
    } finally { timeout.mockRestore(); vi.useRealTimers(); }
  });

  it("exposes a provider outage without private details", async () => {
    const response = await voiceHandler({ env, fetchImpl: async () => { throw new Error("private provider key"); } })(request());
    expect(response.status).toBe(502);
    expect(await response.json()).toEqual({ error: "voice_unavailable" });
  });

  it("accepts explicit keyterm comparison mode without forwarding arbitrary prompts", async () => {
    const form = new FormData();
    form.set("audio", new Blob(["test"], { type: "audio/mp4; codecs=mp4a.40.2" }));
    form.set("keyterms", "false");
    const fetchImpl: typeof fetch = async (_url, init) => {
      expect((init?.body as FormData).getAll("keyterm")).toEqual([]);
      expect((init?.body as FormData).get("file")).toMatchObject({ name: "recording.m4a" });
      return Response.json({ text: "send maria to my coordinator" });
    };
    expect((await voiceHandler({ env, fetchImpl })(request(form))).status).toBe(200);
  });

  it("rejects an old proposal after reset and permits only the separate current-run handoff", async () => {
    const voice = await voiceHandler({ env, fetchImpl: provider })(request());
    const proposal = await voice.json();
    const now = "2026-09-26T12:00:00Z";
    let events = planCommand([], { kind: "prescribe", patient_id: "pt_maria", drug_id: "drug_otezla" }, now);
    events = [...events, ...planCommand(events, { kind: "fire", ids: ["ev_04", "ev_05"] }, now)];
    let snapshot: Snapshot = { run_id: runId, revision: 2, events };
    const commit = vi.fn<WorkflowStore["commit"]>(async (_run, _revision, inserted) => {
      snapshot = { ...snapshot, revision: snapshot.revision + 1, events: [...snapshot.events, ...inserted] };
      return snapshot;
    });
    const store: WorkflowStore = { snapshot: async () => snapshot, commit, reset: vi.fn() };
    const confirm = () => new Request("http://localhost:3000/api/handoff", { method: "POST", headers: { authorization: `Bearer ${env.FIRSTDOSE_DEMO_TOKEN}`, "x-firstdose-run": voice.headers.get("x-firstdose-run")!, "content-type": "application/json" }, body: JSON.stringify({ case_id: proposal.case_id }) });
    expect((await commandHandler("handoff", { env, store })(confirm())).status).toBe(200);
    expect(snapshot.events.filter(event => event.type === "handoff")).toHaveLength(1);
    snapshot = { run_id: "12c21f65-988b-401c-a1c5-1973656f77a6", revision: 0, events: [] };
    commit.mockClear();
    const stale = await commandHandler("handoff", { env, store })(confirm());
    expect(stale.status).toBe(409);
    expect(await stale.json()).toEqual({ error: "stale_run" });
    expect(commit).not.toHaveBeenCalled();
  });

  it("still requires a legal current state on the separate confirmed handoff", async () => {
    const voice = await voiceHandler({ env, fetchImpl: provider })(request());
    const { case_id } = await voice.json();
    const snapshot: Snapshot = { run_id: runId, revision: 0, events: [] };
    const store: WorkflowStore = { snapshot: async () => snapshot, commit: vi.fn(), reset: vi.fn() };
    const confirm = new Request("http://localhost:3000/api/handoff", { method: "POST", headers: { authorization: `Bearer ${env.FIRSTDOSE_DEMO_TOKEN}`, "x-firstdose-run": runId, "content-type": "application/json" }, body: JSON.stringify({ case_id }) });
    const result = await commandHandler("handoff", { env, store })(confirm);
    expect(result.status).toBe(409);
    expect(await result.json()).toEqual({ error: "invalid_transition" });
    expect(store.commit).not.toHaveBeenCalled();
  });
});
