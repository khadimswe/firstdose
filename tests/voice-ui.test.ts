import { describe, expect, it } from "vitest";
import {
  encodeWav,
  pickRecorderType,
  serverAccepts,
  toMono,
  voiceResult,
} from "@/app/(screens)/doctor/_components/voice";

describe("voice handoff UI helpers", () => {
  it("accepts only the formats /api/voice accepts", () => {
    expect(serverAccepts("audio/mp4")).toBe(true);
    expect(serverAccepts("audio/ogg;codecs=opus")).toBe(true);
    expect(serverAccepts("audio/wav")).toBe(true);
    expect(serverAccepts("audio/webm;codecs=opus")).toBe(false);
  });

  it("prefers a server-readable recorder format and falls back to webm", () => {
    expect(pickRecorderType((t) => t === "audio/mp4" || t === "audio/webm")).toBe("audio/mp4");
    expect(pickRecorderType((t) => t.startsWith("audio/webm"))).toBe("audio/webm;codecs=opus");
    expect(pickRecorderType(() => false)).toBe("");
  });

  it("writes a 16-bit mono WAV header and samples", () => {
    const wav = new DataView(encodeWav(new Float32Array([0, 1, -1]), 16_000));
    const text = (o: number) => String.fromCharCode(...[0, 1, 2, 3].map((i) => wav.getUint8(o + i)));
    expect(text(0)).toBe("RIFF");
    expect(text(8)).toBe("WAVE");
    expect(wav.getUint16(22, true)).toBe(1);
    expect(wav.getUint32(24, true)).toBe(16_000);
    expect(wav.getUint32(40, true)).toBe(6);
    expect(wav.getInt16(44, true)).toBe(0);
    expect(wav.getInt16(46, true)).toBe(0x7fff);
    expect(wav.getInt16(48, true)).toBe(-0x8000);
  });

  it("downmixes to mono and resamples", () => {
    const out = toMono([new Float32Array([1, 1, 1, 1]), new Float32Array([0, 0, 0, 0])], 32_000, 16_000);
    expect(out.length).toBe(2);
    expect(out[0]).toBeCloseTo(0.5);
  });

  it("maps /api/voice responses to proposal, unresolved and errors", () => {
    expect(voiceResult(200, { transcript: "send maria to my coordinator", intent: "SEND_TO_COORDINATOR", case_id: "rx_001" }))
      .toEqual({ kind: "proposal", transcript: "send maria to my coordinator", caseId: "rx_001" });
    expect(voiceResult(200, { transcript: "don't send maria", intent: null, case_id: null }))
      .toEqual({ kind: "unresolved", transcript: "don't send maria" });
    expect(voiceResult(401, { error: "unauthorized" })).toMatchObject({ kind: "error", signIn: true });
    expect(voiceResult(503, { error: "voice_not_configured" })).toMatchObject({ kind: "error", message: expect.stringMatching(/isn't set up/) });
    expect(voiceResult(502, null)).toMatchObject({ kind: "error" });
  });
});
