import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

function run(args: string[], topic = "") {
  return spawnSync(process.execPath, ["--import", "tsx", "scripts/ntfy-smoke.ts", ...args], {
    cwd: fileURLToPath(new URL("..", import.meta.url)),
    env: { ...process.env, NTFY_TOPIC: topic, NTFY_TOKEN: "", NTFY_SERVER: "https://notify.example.test" },
    encoding: "utf8",
    timeout: 5_000,
  });
}

describe("watch smoke CLI", () => {
  it("defaults to no send and never prints the configured topic", () => {
    const result = run([], "private-fictional-test-topic");
    expect(result.status).toBe(0);
    expect(result.stdout).toContain("no notification sent");
    expect(result.stdout + result.stderr).not.toContain("private-fictional-test-topic");
  });

  it("reports missing configuration on a dry run without failing", () => {
    const result = run([]);
    expect(result.status).toBe(0);
    expect(result.stdout).toContain("not configured");
  });

  it("rejects an unknown flag instead of sending", () => {
    const result = run(["--send-now"]);
    expect(result.status).toBe(1);
    expect(result.stderr).toContain("Usage:");
  });

  it("fails before networking when explicitly sending without a topic", () => {
    const result = run(["--send"]);
    expect(result.status).toBe(1);
    expect(result.stderr).toContain("Configure a valid NTFY_TOPIC");
    expect(result.stdout).not.toContain("accepted");
  });
});
