// Generates the coordinator-approved patient message (PLAN 6.8) with ElevenLabs,
// once per language, into public/audio/. Pre-generated and committed; the app
// never calls ElevenLabs at runtime.
//
//   node --env-file=.env scripts/tts.mjs
//
// Needs ELEVENLABS_API_KEY and ELEVENLABS_VOICE_ID. The key is only sent as a
// request header and is never printed.
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";

const root = new URL("..", import.meta.url);
const json = (path) => JSON.parse(readFileSync(new URL(path, root), "utf8"));

// The spoken text is the template, filled with the drug name only (every
// sentence about a patient comes from mock/templates.json). Maria's case is the
// one that gets the savings card.
const templates = json("mock/templates.json");
const { drugs, cases } = json("mock/patients.json");
const rx = cases.find((c) => c.id === "rx_001");
const drug = drugs.find((d) => d.id === rx.drug_id);

const missing = ["ELEVENLABS_API_KEY", "ELEVENLABS_VOICE_ID"].filter((k) => !process.env[k]);
if (missing.length) {
  console.error(`Missing ${missing.join(", ")}. Run with: node --env-file=.env scripts/tts.mjs`);
  process.exit(1);
}

mkdirSync(new URL("public/audio/", root), { recursive: true });

for (const [lang, template] of Object.entries(templates.patient_message.text)) {
  const text = template.replace("{drug}", drug.brand);
  const res = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${process.env.ELEVENLABS_VOICE_ID}?output_format=mp3_44100_128`,
    {
      method: "POST",
      headers: {
        "xi-api-key": process.env.ELEVENLABS_API_KEY,
        "content-type": "application/json",
        accept: "audio/mpeg",
      },
      body: JSON.stringify({ text, model_id: "eleven_multilingual_v2", language_code: lang }),
    },
  );
  if (!res.ok) {
    console.error(`ElevenLabs returned ${res.status} for ${lang}: ${await res.text()}`);
    process.exit(1);
  }
  const file = `public/audio/patient-message-${drug.id}-${lang}.mp3`;
  const bytes = Buffer.from(await res.arrayBuffer());
  writeFileSync(new URL(file, root), bytes);
  console.log(`Wrote ${file} (${bytes.length} bytes): "${text}"`);
}
