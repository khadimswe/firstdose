import { describe, expect, it, vi } from "vitest";
import { accessSummaryHandler } from "@/lib/server/analytics-http";
import { ReplayError } from "@/lib/server/replay-followup";

const run = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const token = "local-analytics-test-token-at-least-32-characters";
const env = { FIRSTDOSE_DEMO_TOKEN: token };
const checkpoint = { run_id: run, revision: 4 };
const summary = { recovered: 2, median_ttff_seconds: 90, reason_tally: { UNABLE_TO_REACH: 1 } };
function request(query = `run_id=${run}&revision=4`, authorized = true) {
  return new Request(`http://localhost/api/access/summary?${query}`, { headers: authorized ? { authorization: `Bearer ${token}` } : {} });
}

describe("replayed analytics HTTP boundary", () => {
  it("requires demo authentication before querying or replaying", async () => {
    const readSummary = vi.fn();
    const response = await accessSummaryHandler({ env, readSummary })(request(undefined, false));
    expect(response.status).toBe(401);
    expect(readSummary).not.toHaveBeenCalled();
  });
  it.each(["", `run_id=${run}`, `run_id=smoke-not-a-uuid&revision=1`, `run_id=${run}&revision=-1`, `run_id=${run}&revision=1.2`, `run_id=${run}&revision=9007199254740992`, `run_id=${run}&revision=1&revision=2`])("rejects invalid checkpoint %s without I/O", async query => {
    const readSummary = vi.fn();
    expect((await accessSummaryHandler({ env, readSummary })(request(query))).status).toBe(400);
    expect(readSummary).not.toHaveBeenCalled();
  });
  it("returns the verified checkpoint headers and exact aggregate body", async () => {
    const readSummary = vi.fn().mockResolvedValue({ checkpoint, summary });
    const response = await accessSummaryHandler({ env, readSummary })(request());
    expect(response.status).toBe(200);
    expect(readSummary).toHaveBeenCalledExactlyOnceWith(checkpoint);
    expect(await response.json()).toEqual(summary);
    expect(response.headers.get("x-firstdose-run")).toBe(run);
    expect(response.headers.get("x-firstdose-revision")).toBe("4");
    expect(response.headers.get("cache-control")).toBe("no-store");
  });
  it.each([[new ReplayError("analytics_stale"), 409, "analytics_stale"], [new Error("private database credential"), 503, "analytics_unavailable"]] as const)("keeps failures distinct from zero totals", async (error, status, code) => {
    const response = await accessSummaryHandler({ env, readSummary: vi.fn().mockRejectedValue(error) })(request());
    expect(response.status).toBe(status);
    expect(await response.json()).toEqual({ error: code });
    expect(response.headers.has("x-firstdose-revision")).toBe(false);
  });
});
