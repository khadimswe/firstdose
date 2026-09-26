// Pure helpers for the doctor's voice handoff (4.1). The server (/api/voice)
// only proposes a case; the doctor confirms before anything is sent.

/** Audio types /api/voice accepts (mirrors lib/server/voice.ts). */
const SERVER_TYPES = new Set([
  "audio/wav", "audio/x-wav", "audio/wave",
  "audio/mpeg", "audio/mp3", "audio/mp4", "audio/x-m4a", "audio/aac",
  "audio/ogg", "audio/flac", "audio/x-flac",
]);

/** Recorder formats in order of preference. webm is recorded only to be re-encoded as WAV. */
const RECORDER_TYPES = ["audio/mp4", "audio/ogg;codecs=opus", "audio/ogg", "audio/webm;codecs=opus", "audio/webm"];

export const MAX_RECORD_MS = 15_000;
export const WAV_RATE = 16_000;

export function baseType(type: string): string {
  return type.split(";")[0].trim().toLowerCase();
}

export function serverAccepts(type: string): boolean {
  return SERVER_TYPES.has(baseType(type));
}

/** The first recorder type the browser supports, or "" to let it choose. */
export function pickRecorderType(isSupported: (type: string) => boolean): string {
  return RECORDER_TYPES.find((type) => isSupported(type)) ?? "";
}

/** Averages channels to mono and resamples linearly to `rate`. */
export function toMono(channels: Float32Array[], fromRate: number, rate = WAV_RATE): Float32Array {
  if (channels.length === 0) return new Float32Array();
  const length = channels[0].length;
  const mono = new Float32Array(length);
  for (const channel of channels) for (let i = 0; i < length; i++) mono[i] += channel[i] / channels.length;
  if (fromRate === rate) return mono;
  const out = new Float32Array(Math.max(1, Math.round((length * rate) / fromRate)));
  const step = fromRate / rate;
  for (let i = 0; i < out.length; i++) {
    const x = i * step;
    const i0 = Math.min(length - 1, Math.floor(x));
    const i1 = Math.min(length - 1, i0 + 1);
    out[i] = mono[i0] + (mono[i1] - mono[i0]) * (x - i0);
  }
  return out;
}

/** 16-bit PCM mono WAV bytes. */
export function encodeWav(samples: Float32Array, rate = WAV_RATE): ArrayBuffer {
  const buffer = new ArrayBuffer(44 + samples.length * 2);
  const view = new DataView(buffer);
  const text = (offset: number, value: string) => {
    for (let i = 0; i < value.length; i++) view.setUint8(offset + i, value.charCodeAt(i));
  };
  text(0, "RIFF");
  view.setUint32(4, 36 + samples.length * 2, true);
  text(8, "WAVE");
  text(12, "fmt ");
  view.setUint32(16, 16, true); // fmt chunk size
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, 1, true); // mono
  view.setUint32(24, rate, true);
  view.setUint32(28, rate * 2, true); // byte rate
  view.setUint16(32, 2, true); // block align
  view.setUint16(34, 16, true); // bits per sample
  text(36, "data");
  view.setUint32(40, samples.length * 2, true);
  for (let i = 0; i < samples.length; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(44 + i * 2, s < 0 ? s * 0x8000 : s * 0x7fff, true);
  }
  return buffer;
}

export type VoiceResult =
  | { kind: "proposal"; transcript: string; caseId: string }
  | { kind: "unresolved"; transcript: string }
  | { kind: "error"; message: string; signIn?: boolean };

const ERROR_MESSAGES: Record<string, string> = {
  unauthorized: "Sign in to use voice.",
  audio_too_large: "That recording is too long. Keep it short.",
  body_too_large: "That recording is too long. Keep it short.",
  unsupported_audio: "This browser records in a format voice can't read.",
  audio_required: "Nothing was recorded. Try again.",
  voice_not_configured: "Voice isn't set up on this server yet.",
  voice_rate_limited: "Voice is busy. Try again in a moment.",
  voice_timeout: "That took too long. Try again.",
  upload_timeout: "That took too long. Try again.",
  voice_cancelled: "Voice was cancelled.",
};

/** Maps an /api/voice response to what the screen shows. */
export function voiceResult(status: number, body: unknown): VoiceResult {
  const record = body && typeof body === "object" ? (body as Record<string, unknown>) : {};
  if (status === 200 && typeof record.transcript === "string") {
    return record.intent === "SEND_TO_COORDINATOR" && typeof record.case_id === "string"
      ? { kind: "proposal", transcript: record.transcript, caseId: record.case_id }
      : { kind: "unresolved", transcript: record.transcript };
  }
  const code = typeof record.error === "string" ? record.error : "";
  if (status === 401) return { kind: "error", message: ERROR_MESSAGES.unauthorized, signIn: true };
  return { kind: "error", message: ERROR_MESSAGES[code] ?? "Voice isn't available right now. Use the Send button instead." };
}
