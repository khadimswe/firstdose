import { execFileSync, spawnSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, describe, expect, it } from "vitest";

const directory = mkdtempSync(join(tmpdir(), "firstdose-voice-test-"));
const audio = join(directory, "fictional-test.wav");
// Synthetic bytes exercise local validation only; no test sends them to a provider.
writeFileSync(audio, "RIFF synthetic test fixture");
afterAll(() => rmSync(directory, { recursive: true, force: true }));
const args = ["--import", "tsx", "scripts/voice-smoke.ts"];
const env = { ...process.env, XAI_API_KEY: "" };

describe("voice comparison CLI", () => {
  it("defaults to a local dry run with no key required and no secret output", () => {
    const output = execFileSync(process.execPath, [...args, "--audio", audio], { encoding: "utf8", env: { ...env, XAI_API_KEY: "private-test-key-never-log" } });
    expect(JSON.parse(output)).toMatchObject({ mode: "dry-run", model: "grok-voice-transcribe-2.0", audio_bytes: 27, provider_configured: true });
    expect(output).not.toContain("private-test-key-never-log");
    expect(output).not.toContain(directory);
  });

  it("requires a provider key for explicitly requested real trials", () => {
    const result = spawnSync(process.execPath, [...args, "--audio", audio, "--send"], { encoding: "utf8", env });
    expect(result.status).toBe(1);
    expect(JSON.parse(result.stderr)).toEqual({ error: "voice_not_configured" });
  });

  it.each([
    { extra: ["--send"] },
    { extra: ["--audio", audio, "--unknown"] },
    { extra: ["--audio", audio, "--send", "--send"] },
  ])("rejects invalid CLI arguments: $extra", ({ extra }) => {
    const result = spawnSync(process.execPath, [...args, ...extra], { encoding: "utf8", env });
    expect(result.status).toBe(1);
    expect(JSON.parse(result.stderr)).toEqual({ error: "invalid_arguments" });
  });
});
