import { afterEach, describe, expect, it, vi } from "vitest";
import type { Snapshot } from "@/lib/server/commands";
import { planCommand } from "@/lib/server/workflow";

const hooks = vi.hoisted(() => ({
  after: vi.fn(), classify: vi.fn(), replay: vi.fn(), deliver: vi.fn(), source: vi.fn(), write: vi.fn(), summary: vi.fn(), history: vi.fn(), snapshot: vi.fn(),
}));
vi.mock("next/server", () => ({ after: hooks.after }));
vi.mock("@/lib/server/classify", () => ({ classify: hooks.classify }));
vi.mock("@/lib/server/notification-worker", () => ({ deliverNotifications: hooks.deliver }));
vi.mock("@/lib/server/supabase-workflow", async importOriginal => ({
  ...await importOriginal<typeof import("@/lib/server/supabase-workflow")>(), createWorkflowStore: hooks.source, readCommittedEvents: hooks.history,
}));
vi.mock("@/lib/server/tiger", () => ({ writeMetricBatch: hooks.write, getAccessSummary: hooks.summary }));
import { POST } from "@/app/api/sim/fire/route";
import { GET } from "@/app/api/access/summary/route";

const run = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const token = "phase2-runtime-test-token-at-least-32-characters";
const time = "2026-09-26T18:00:00.000Z";
function setup() {
  vi.stubEnv("FIRSTDOSE_DEMO_TOKEN", token);
  vi.stubEnv("ANALYTICS_HMAC_KEY", "a-local-only-analytics-test-key-of-32-characters");
  vi.stubEnv("TIGER_DATABASE_URL", "postgresql://unused.test/runtime-test");
  const events = planCommand([], { kind: "prescribe", patient_id: "pt_maria", drug_id: "drug_otezla" }, time);
  let state: Snapshot = { run_id: run, revision: 1, events };
  hooks.snapshot.mockImplementation(async () => structuredClone(state));
  hooks.history.mockImplementation(async () => state.events.map(event => ({ run_id: run, script_id: event.id, event })));
  hooks.source.mockReturnValue({ snapshot: hooks.snapshot, readCommittedEvents: hooks.history, commit: async (_run: string, _revision: number, inserted: Snapshot["events"]) => {
    state = { ...state, revision: state.revision + (inserted.length ? 1 : 0), events: [...state.events, ...inserted] };
    return state;
  } });
  hooks.classify.mockResolvedValue("PA_REQUIRED");
  hooks.deliver.mockResolvedValue({ attempted: 0 });
  hooks.write.mockResolvedValue(undefined);
  hooks.summary.mockResolvedValue({ recovered: 0, median_ttff_seconds: null, reason_tally: { PA_REQUIRED: 1 } });
}
afterEach(() => { vi.resetAllMocks(); vi.unstubAllEnvs(); });

describe("actual Phase 2 route wiring", () => {
  it("live fire calls Gemini, commits its reason, then schedules real replay and delivery", async () => {
    setup();
    const response = await POST(new Request("http://localhost/api/sim/fire", { method: "POST", headers: {
      authorization: `Bearer ${token}`, "content-type": "application/json", "x-firstdose-run": run,
    }, body: JSON.stringify({ ids: ["ev_04", "ev_05"] }) }));
    expect(response.status).toBe(200);
    const inserted = await response.json();
    expect(hooks.classify).toHaveBeenCalledExactlyOnceWith(inserted[0].note);
    expect(inserted.find((event: { id: string }) => event.id === "ev_05").reason).toBe("PA_REQUIRED");
    expect(hooks.after).toHaveBeenCalledOnce();
    expect(hooks.write).not.toHaveBeenCalled();
    await hooks.after.mock.calls[0][0]();
    expect(hooks.deliver).toHaveBeenCalledOnce();
    expect(hooks.history).toHaveBeenCalledWith(run);
    const metrics = hooks.write.mock.calls[0][0];
    expect(metrics.map((row: { kind: string }) => row.kind)).toEqual(["prescribed", "reason"]);
    expect(metrics[1]).toMatchObject({ reason: "PA_REQUIRED", run_id: run });
    expect(JSON.stringify(metrics)).not.toContain(inserted[0].note);
  });

  it("summary route replays through the production wrapper and returns matching checkpoint headers", async () => {
    setup();
    const response = await GET(new Request(`http://localhost/api/access/summary?run_id=${run}&revision=1`, { headers: { authorization: `Bearer ${token}` } }));
    expect(response.status).toBe(200);
    expect(hooks.write).toHaveBeenCalledOnce();
    expect(hooks.summary).toHaveBeenCalledExactlyOnceWith(run);
    expect(response.headers.get("x-firstdose-revision")).toBe("1");
    expect(response.headers.get("x-firstdose-run")).toBe(run);
  });

  it("returns unavailable instead of querying partial data after a failed Tiger write", async () => {
    setup();
    hooks.write.mockRejectedValue(new Error("private database detail"));
    const response = await GET(new Request(`http://localhost/api/access/summary?run_id=${run}&revision=1`, { headers: { authorization: `Bearer ${token}` } }));
    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({ error: "analytics_unavailable" });
    expect(hooks.summary).not.toHaveBeenCalled();
  });
});
