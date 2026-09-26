import patientsJson from "@/mock/patients.json";

export const MAX_AUDIO_BYTES = 4_000_000;
export const VOICE_MODEL = "grok-voice-transcribe-2.0";
export const VOICE_KEYTERMS = ["Maria", "James", "Otezla", "Humira", "coordinator"] as const;
const AUDIO_EXTENSIONS: Record<string, string> = {
  "audio/wav": "wav", "audio/x-wav": "wav", "audio/wave": "wav",
  "audio/mpeg": "mp3", "audio/mp3": "mp3", "audio/mp4": "m4a",
  "audio/x-m4a": "m4a", "audio/aac": "aac", "audio/ogg": "ogg",
  "audio/flac": "flac", "audio/x-flac": "flac",
};

export type VoiceProposal = {
  transcript: string;
  intent: "SEND_TO_COORDINATOR" | null;
  case_id: string | null;
};
export class VoiceError extends Error {
  constructor(public status: number, public code: string) { super(code); }
}
export type VoiceOptions = {
  env?: Record<string, string | undefined>;
  fetchImpl?: typeof fetch;
  keyterms?: boolean;
  signal?: AbortSignal;
};

/** Entire-utterance grammar deliberately leaves negation, extra clauses and ambiguity unresolved. */
export function proposeHandoff(transcript: string): VoiceProposal {
  const unresolved: VoiceProposal = { transcript, intent: null, case_id: null };
  const command = transcript.trim().replace(/\s+/g, " ").toLowerCase();
  const match = /^(?:please )?send ([a-z]+(?: [a-z]+)?) to (?:my |the |our )?coordinator(?: please)?[.!]?$/.exec(command);
  if (!match) return unresolved;
  const patients = patientsJson.patients.filter(patient => [patient.name, patient.display_short].some(name => name.toLowerCase() === match[1]));
  if (patients.length !== 1) return unresolved;
  const cases = patientsJson.cases.filter(rx => rx.patient_id === patients[0].id);
  if (cases.length !== 1) return unresolved;
  return { transcript, intent: "SEND_TO_COORDINATOR", case_id: cases[0].id };
}

/** Bounds bytes before parsing multipart or provider JSON; cancellation also interrupts stalled reads. */
export async function readVoiceBody(body: ReadableStream<Uint8Array> | null, limit: number, signal: AbortSignal, tooLarge: VoiceError): Promise<Uint8Array<ArrayBuffer>> {
  signal.throwIfAborted();
  const chunks: Uint8Array[] = [];
  let size = 0;
  const reader = body?.getReader();
  if (!reader) return new Uint8Array();
  const cancel = () => { void reader.cancel().catch(() => {}); };
  signal.addEventListener("abort", cancel, { once: true });
  try {
    while (true) {
      signal.throwIfAborted();
      const { done, value } = await reader.read();
      signal.throwIfAborted();
      if (done) break;
      size += value.byteLength;
      if (size > limit) { cancel(); throw tooLarge; }
      chunks.push(value);
    }
  } finally {
    signal.removeEventListener("abort", cancel);
    reader.releaseLock();
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length; }
  return bytes;
}

export function validateAudio(audio: Blob): string {
  if (!audio.size) throw new VoiceError(400, "audio_required");
  if (audio.size > MAX_AUDIO_BYTES) throw new VoiceError(413, "audio_too_large");
  const extension = AUDIO_EXTENSIONS[audio.type.split(";")[0].trim().toLowerCase()];
  if (!extension) throw new VoiceError(415, "unsupported_audio");
  return extension;
}

export async function transcribeAudio(audio: Blob, options: VoiceOptions = {}): Promise<VoiceProposal> {
  const extension = validateAudio(audio);
  const apiKey = (options.env ?? process.env).XAI_API_KEY?.trim();
  if (!apiKey) throw new VoiceError(503, "voice_not_configured");
  const timeout = AbortSignal.timeout(20_000);
  const signal = options.signal ? AbortSignal.any([timeout, options.signal]) : timeout;
  const form = new FormData();
  form.set("model", VOICE_MODEL);
  form.set("language", "en");
  if (options.keyterms !== false) for (const term of VOICE_KEYTERMS) form.append("keyterm", term);
  // xAI requires the file last. Never forward a user's filename or a remote audio URL.
  form.set("file", audio, `recording.${extension}`);
  try {
    signal.throwIfAborted();
    const response = await (options.fetchImpl ?? fetch)("https://api.x.ai/v1/stt", {
      method: "POST", headers: { Authorization: `Bearer ${apiKey}` }, body: form, signal, redirect: "error",
    });
    if (!response.ok) {
      void response.body?.cancel().catch(() => {});
      throw new VoiceError(response.status === 429 ? 503 : 502, response.status === 429 ? "voice_rate_limited" : "voice_unavailable");
    }
    const bytes = await readVoiceBody(response.body, 131_072, signal, new VoiceError(502, "invalid_transcription"));
    let result: unknown;
    try { result = JSON.parse(new TextDecoder().decode(bytes)); } catch { throw new VoiceError(502, "invalid_transcription"); }
    if (!result || typeof result !== "object" || !("text" in result) || typeof result.text !== "string" || result.text.length > 4_000) throw new VoiceError(502, "invalid_transcription");
    return proposeHandoff(result.text);
  } catch (error) {
    if (error instanceof VoiceError) throw error;
    if (error instanceof Error && error.name === "TimeoutError") throw new VoiceError(504, "voice_timeout");
    if (options.signal?.aborted) throw new VoiceError(408, "voice_cancelled");
    throw new VoiceError(502, "voice_unavailable");
  }
}
