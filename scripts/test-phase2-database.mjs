import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { setTimeout as delay } from "node:timers/promises";

// Local PostgreSQL proof only. Never loads .env or connects to hosted Supabase/Tiger.
const root = fileURLToPath(new URL("../", import.meta.url));
const container = `firstdose-phase2-test-${process.pid}-${Date.now()}`;
const docker = args => spawnSync("docker", args, { encoding: "utf8", timeout: 60_000 });
try {
  const start = docker(["run", "--detach", "--rm", "--name", container, "-p", "127.0.0.1::5432", "-e", "POSTGRES_HOST_AUTH_METHOD=trust", "postgres:16-alpine"]);
  assert.equal(start.status, 0, "Could not start disposable local PostgreSQL");
  let ready = false;
  for (let i = 0; i < 60; i++) {
    if (docker(["exec", container, "pg_isready", "-h", "127.0.0.1", "-U", "postgres"]).status === 0) { ready = true; break; }
    await delay(500);
  }
  assert.ok(ready, "Local PostgreSQL did not become ready");
  const port = docker(["port", container, "5432/tcp"]);
  const match = /^127\.0\.0\.1:(\d+)\s*$/.exec(port.stdout);
  assert.ok(match, "Expected a loopback-only disposable port");
  const smoke = spawnSync(process.execPath, ["--import", "tsx", "scripts/phase2-database-smoke.ts"], {
    cwd: root, encoding: "utf8", timeout: 120_000,
    env: { ...process.env, FIRSTDOSE_LOCAL_DATABASE_URL: `postgresql://postgres@127.0.0.1:${match[1]}/postgres` },
  });
  process.stdout.write(smoke.stdout);
  assert.equal(smoke.status, 0, smoke.stderr || "Local Phase 2 database check failed");
} finally {
  assert.equal(docker(["rm", "--force", container]).status, 0, "Could not clean up disposable test container");
}
