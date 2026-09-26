import { describe, expect, it, vi } from "vitest";
import { proposeHandoff, transcribeAudio } from "@/lib/server/voice";

const env = { XAI_API_KEY: "local-test-key" };
const audio = () => new Blob(["test audio"], { type: "audio/wav" });

describe("voice handoff suggestions", () => {
  it.each([
    ["send maria to my coordinator", "rx_001"],
    ["Please send James Carter to the coordinator.", "rx_002"],
    ["  SEND   MARIA LOPEZ to our coordinator please!  ", "rx_001"],
  ])("resolves an explicit fictional case: %s", (transcript, caseId) => {
    expect(proposeHandoff(transcript)).toEqual({ transcript, intent: "SEND_TO_COORDINATOR", case_id: caseId });
  });

  it.each([
    "", "send to my coordinator", "send Mary to my coordinator",
    "send maria and james to my coordinator", "do not send maria to my coordinator",
    "don't send james to my coordinator", "could you send maria to my coordinator?",
    "send maria to my coordinator. Actually, don't.",
    "send maria to my coordinator if she calls", "resend maria to my coordinator",
    "send maria to my coordinator and prescribe Humira", "James said send maria to my coordinator",
  ])("leaves unknown, negative or ambiguous speech unresolved: %s", transcript => {
    expect(proposeHandoff(transcript)).toEqual({ transcript, intent: null, case_id: null });
  });
});

describe("xAI transcription transport", () => {
  it("sends documented multipart fields, fixed filename, keyterms and a deadline", async () => {
    let received: RequestInit | undefined;
    let endpoint: unknown;
    const fetchImpl: typeof fetch = async (url, init) => {
      endpoint = url;
      received = init;
      return Response.json({ text: "send maria to my coordinator", duration: 2 });
    };
    expect(await transcribeAudio(audio(), { env, fetchImpl })).toEqual({ transcript: "send maria to my coordinator", intent: "SEND_TO_COORDINATOR", case_id: "rx_001" });
    expect(endpoint).toBe("https://api.x.ai/v1/stt");
    expect(received?.method).toBe("POST");
    expect(received?.headers).toEqual({ Authorization: "Bearer local-test-key" });
    expect(received?.signal).toBeInstanceOf(AbortSignal);
    expect(received?.redirect).toBe("error");
    const form = received?.body as FormData;
    expect(form.get("model")).toBe("grok-voice-transcribe-2.0");
    expect(form.getAll("keyterm")).toEqual(["Maria", "James", "Otezla", "Humira", "coordinator"]);
    expect([...form.keys()].at(-1)).toBe("file");
    expect((form.get("file") as File).name).toBe("recording.wav");
    expect(await (form.get("file") as File).text()).toBe("test audio");
  });

  it("allows the same clip to be tested without keyterms", async () => {
    const fetchImpl: typeof fetch = async (_url, init) => {
      expect((init?.body as FormData).getAll("keyterm")).toEqual([]);
      return Response.json({ text: "send james to my coordinator" });
    };
    expect(await transcribeAudio(audio(), { env, fetchImpl, keyterms: false })).toMatchObject({ case_id: "rx_002" });
  });

  it.each([
    [new Blob([], { type: "audio/wav" }), "audio_required"],
    [new Blob(["html"], { type: "text/html" }), "unsupported_audio"],
    [new Blob([new Uint8Array(4_000_001)], { type: "audio/wav" }), "audio_too_large"],
  ])("rejects unsuitable audio before calling xAI", async (clip, code) => {
    const fetchImpl = vi.fn<typeof fetch>();
    await expect(transcribeAudio(clip, { env, fetchImpl })).rejects.toMatchObject({ code });
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("fails closed without a configured provider key", async () => {
    const fetchImpl = vi.fn<typeof fetch>();
    await expect(transcribeAudio(audio(), { env: {}, fetchImpl })).rejects.toMatchObject({ code: "voice_not_configured" });
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it.each([400, 401, 429, 500])("sanitizes provider HTTP %s without retrying", async status => {
    const fetchImpl = vi.fn<typeof fetch>().mockResolvedValue(new Response("private provider details", { status }));
    await expect(transcribeAudio(audio(), { env, fetchImpl })).rejects.toMatchObject({ code: status === 429 ? "voice_rate_limited" : "voice_unavailable" });
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it.each([null, {}, { text: 3 }, { text: "x".repeat(4_001) }])("rejects invalid provider payloads", async body => {
    await expect(transcribeAudio(audio(), { env, fetchImpl: async () => Response.json(body) })).rejects.toMatchObject({ code: "invalid_transcription" });
  });

  it("returns silence as an unresolved suggestion", async () => {
    expect(await transcribeAudio(audio(), { env, fetchImpl: async () => Response.json({ text: "" }) })).toEqual({ transcript: "", intent: null, case_id: null });
  });

  it("maps timeout and network failures without exposing their messages", async () => {
    for (const error of [new DOMException("private", "TimeoutError"), new Error("private")]) {
      await expect(transcribeAudio(audio(), { env, fetchImpl: async () => { throw error; } })).rejects.toMatchObject({ code: error.name === "TimeoutError" ? "voice_timeout" : "voice_unavailable" });
    }
  });

  it("cancels an oversized provider response before parsing it", async () => {
    let cancelled = false;
    const fetchImpl: typeof fetch = async () => new Response(new ReadableStream({
      start(controller) { controller.enqueue(new Uint8Array(131_073)); },
      cancel() { cancelled = true; },
    }));
    await expect(transcribeAudio(audio(), { env, fetchImpl })).rejects.toMatchObject({ code: "invalid_transcription" });
    expect(cancelled).toBe(true);
  });

  it("interrupts a stalled provider response when the caller disconnects", async () => {
    const abort = new AbortController();
    const fetchImpl: typeof fetch = async () => new Response(new ReadableStream({
      pull() { abort.abort(); },
    }));
    await expect(transcribeAudio(audio(), { env, fetchImpl, signal: abort.signal })).rejects.toMatchObject({ code: "voice_cancelled" });
  });

  it("does not start an upload if the caller already cancelled", async () => {
    const abort = new AbortController();
    abort.abort();
    const fetchImpl = vi.fn<typeof fetch>();
    await expect(transcribeAudio(audio(), { env, fetchImpl, signal: abort.signal })).rejects.toMatchObject({ code: "voice_cancelled" });
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("stops a stalled provider body at the configured deadline", async () => {
    vi.useFakeTimers();
    const timeout = vi.spyOn(AbortSignal, "timeout").mockImplementation(milliseconds => {
      const controller = new AbortController();
      setTimeout(() => controller.abort(new DOMException("deadline", "TimeoutError")), milliseconds);
      return controller.signal;
    });
    try {
      let cancelled = false;
      const fetchImpl: typeof fetch = async () => new Response(new ReadableStream({ cancel() { cancelled = true; } }));
      const expected = expect(transcribeAudio(audio(), { env, fetchImpl })).rejects.toMatchObject({ code: "voice_timeout" });
      await vi.advanceTimersByTimeAsync(19_999);
      expect(cancelled).toBe(false);
      await vi.advanceTimersByTimeAsync(1);
      await expected;
      expect(cancelled).toBe(true);
    } finally { timeout.mockRestore(); vi.useRealTimers(); }
  });
});
