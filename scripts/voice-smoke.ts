import { createHash } from "node:crypto";
import { open } from "node:fs/promises";
import { extname } from "node:path";
import { MAX_AUDIO_BYTES, transcribeAudio, validateAudio, VoiceError, VOICE_MODEL } from "../lib/server/voice";

const MIME: Record<string, string> = {
  ".wav": "audio/wav", ".mp3": "audio/mpeg", ".m4a": "audio/mp4", ".mp4": "audio/mp4",
  ".aac": "audio/aac", ".ogg": "audio/ogg", ".flac": "audio/flac",
};

async function main() {
  const args = process.argv.slice(2);
  if (args.length === 1 && args[0] === "--help") {
    console.log("Usage: node --env-file-if-exists=.env --import tsx scripts/voice-smoke.ts --audio <fictional-demo.wav> [--send]\nWithout --send: local validation only. With --send: two xAI calls, first without keyterms, then with keyterms; no workflow command.");
    return;
  }
  let path: string | undefined;
  let send = false;
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--audio" && !path && args[i + 1] && !args[i + 1].startsWith("--")) path = args[++i];
    else if (args[i] === "--send" && !send) send = true;
    else throw new VoiceError(400, "invalid_arguments");
  }
  if (!path) throw new VoiceError(400, "invalid_arguments");
  const type = MIME[extname(path).toLowerCase()];
  if (!type) throw new VoiceError(415, "unsupported_audio");
  const file = await open(path, "r");
  let bytes: Buffer;
  try {
    const metadata = await file.stat();
    if (!metadata.isFile()) throw new VoiceError(400, "audio_required");
    if (metadata.size > MAX_AUDIO_BYTES) throw new VoiceError(413, "audio_too_large");
    // A bounded read also handles a file that grows between stat and read.
    bytes = Buffer.alloc(MAX_AUDIO_BYTES + 1);
    let offset = 0;
    while (offset < bytes.length) {
      const { bytesRead } = await file.read(bytes, offset, bytes.length - offset, offset);
      if (bytesRead === 0) break;
      offset += bytesRead;
    }
    bytes = bytes.subarray(0, offset);
  } finally { await file.close(); }
  const audio = new Blob([new Uint8Array(bytes)], { type });
  validateAudio(audio);
  const evidence = { model: VOICE_MODEL, audio_bytes: audio.size, audio_sha256: createHash("sha256").update(bytes).digest("hex") };
  const providerConfigured = Boolean(process.env.XAI_API_KEY?.trim());
  if (!send) {
    console.log(JSON.stringify({ mode: "dry-run", ...evidence, provider_configured: providerConfigured }));
    return;
  }
  if (!providerConfigured) throw new VoiceError(503, "voice_not_configured");
  const trials = [];
  for (const keyterms of [false, true]) {
    const started = performance.now();
    const recordedAt = new Date().toISOString();
    try {
      const proposal = await transcribeAudio(audio, { keyterms });
      trials.push({ keyterms, recorded_at: recordedAt, elapsed_ms: Math.round(performance.now() - started), status: "ok", ...proposal });
    } catch (error) {
      trials.push({ keyterms, recorded_at: recordedAt, elapsed_ms: Math.round(performance.now() - started), status: "error", error: error instanceof VoiceError ? error.code : "voice_unavailable" });
      process.exitCode = 1;
    }
  }
  console.log(JSON.stringify({ mode: "live", ...evidence, trials }, null, 2));
}

main().catch(error => {
  console.error(JSON.stringify({ error: error instanceof VoiceError ? error.code : "audio_read_failed" }));
  process.exitCode = 1;
});
