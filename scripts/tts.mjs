// Generates public/audio/started-maria.mp3 with ElevenLabs (PLAN 4.2).
// Pre-generated once and committed; the app never calls ElevenLabs at runtime.
//
//   node --env-file=.env scripts/tts.mjs
//
// Needs ELEVENLABS_API_KEY and ELEVENLABS_VOICE_ID. The key is only sent as a
// request header and is never printed.
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";

const root = new URL("..", import.meta.url);
const json = (path) => JSON.parse(readFileSync(new URL(path, root), "utf8"));

// The spoken line is a template sentence (every sentence about a patient comes
// from mock/templates.json): the first sentence of wrist.started for Maria.
const templates = json("mock/templates.json");
const { patients, drugs, cases } = json("mock/patients.json");
const rx = cases.find((c) => c.id === "rx_001");
const patient = patients.find((p) => p.id === rx.patient_id);
const drug = drugs.find((d) => d.id === rx.drug_id);
const filled = templates.wrist.started
  .replace("{patient_short}", patient.display_short)
  .replace("{drug}", drug.brand);
const text = filled.slice(0, filled.indexOf(".") + 1); // "Maria started Otezla."

const missing = ["ELEVENLABS_API_KEY", "ELEVENLABS_VOICE_ID"].filter((k) => !process.env[k]);
if (missing.length) {
  console.error(`Missing ${missing.join(", ")}. Run with: node --env-file=.env scripts/tts.mjs`);
  process.exit(1);
}

const res = await fetch(
  `https://api.elevenlabs.io/v1/text-to-speech/${process.env.ELEVENLABS_VOICE_ID}?output_format=mp3_44100_128`,
  {
    method: "POST",
    headers: {
      "xi-api-key": process.env.ELEVENLABS_API_KEY,
      "content-type": "application/json",
      accept: "audio/mpeg",
    },
    body: JSON.stringify({ text, model_id: "eleven_multilingual_v2" }),
  },
);

if (!res.ok) {
  console.error(`ElevenLabs returned ${res.status}: ${await res.text()}`);
  process.exit(1);
}

const out = new URL("public/audio/started-maria.mp3", root);
mkdirSync(new URL("public/audio/", root), { recursive: true });
const bytes = Buffer.from(await res.arrayBuffer());
writeFileSync(out, bytes);
console.log(`Wrote public/audio/started-maria.mp3 (${bytes.length} bytes): "${text}"`);
