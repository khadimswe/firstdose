import { describe, expect, it, vi } from "vitest";
import { readReplayedSummary } from "@/lib/server/replay-followup";
import type { CommittedEvent } from "@/lib/server/supabase-workflow";
import { seedWeekEvents } from "@/lib/demo-week";

const run = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const other = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const target = { run_id: run, revision: 1 };
const history: CommittedEvent[] = seedWeekEvents("2026-09-26T17:00:00Z").map(event => ({ run_id: run, script_id: event.id, event: { ...event, at: String(event.at) } }));
const summary = { recovered: 8, median_ttff_seconds: 60, reason_tally: {} };
function setup() {
  const store = {
    snapshot: vi.fn().mockResolvedValue({ ...target, events: history.map(row => row.event) }),
    readCommittedEvents: vi.fn().mockResolvedValue(history),
  };
  const replayRun = vi.fn(async (id: string, read: (id: string) => Promise<CommittedEvent[]>) => { await read(id); });
  const getSummary = vi.fn().mockResolvedValue(summary);
  return { store, replayRun, getSummary };
}

describe("replay before serving a current summary", () => {
  it("replays fixed committed history before querying, returning its exact checkpoint", async () => {
    const options = setup();
    options.replayRun.mockImplementation(async (id, read) => {
      expect(options.getSummary).not.toHaveBeenCalled();
      expect(id).toBe(run);
      const first = await read(id);
      expect(first).toEqual(history);
      first[0].event.note = "mutated by consumer";
      expect(await read(id)).toEqual(history);
    });
    expect(await readReplayedSummary(target, options)).toEqual({ checkpoint: target, summary });
    expect(options.store.readCommittedEvents).toHaveBeenCalledExactlyOnceWith(run);
    expect(options.getSummary).toHaveBeenCalledExactlyOnceWith(run);
  });

  it.each([{ ...target, revision: 2 }, { ...target, run_id: other }])("rejects an obsolete checkpoint before replay: %j", async changed => {
    const options = setup();
    options.store.snapshot.mockResolvedValue(changed);
    await expect(readReplayedSummary(target, options)).rejects.toMatchObject({ code: "analytics_stale" });
    expect(options.replayRun).not.toHaveBeenCalled();
    expect(options.getSummary).not.toHaveBeenCalled();
  });

  it.each(["replay", "query"])("does not return current data if reset happens during %s", async stage => {
    const options = setup();
    const reset = () => { options.store.snapshot.mockResolvedValue({ ...target, run_id: other }); };
    if (stage === "replay") options.replayRun.mockImplementation(async () => reset());
    else options.getSummary.mockImplementation(async () => { reset(); return summary; });
    await expect(readReplayedSummary(target, options)).rejects.toMatchObject({ code: "analytics_stale" });
  });

  it("rejects a concurrent same-run commit while history is read", async () => {
    const options = setup();
    options.store.readCommittedEvents.mockImplementation(async () => {
      options.store.snapshot.mockResolvedValue({ ...target, revision: 2 });
      return history;
    });
    await expect(readReplayedSummary(target, options)).rejects.toMatchObject({ code: "analytics_stale" });
    expect(options.replayRun).not.toHaveBeenCalled();
  });

  it("fails closed on replay error, sanitizes it, and retries the same durable history", async () => {
    const options = setup();
    options.replayRun.mockRejectedValueOnce(new Error("private Tiger credentials"));
    await expect(readReplayedSummary(target, options)).rejects.toMatchObject({ message: "analytics_unavailable" });
    expect(options.getSummary).not.toHaveBeenCalled();
    expect(await readReplayedSummary(target, options)).toEqual({ checkpoint: target, summary });
    expect(options.store.readCommittedEvents).toHaveBeenCalledTimes(2);
  });

  it("never supplies another run's history to a replay consumer", async () => {
    const options = setup();
    options.replayRun.mockImplementation(async (_id, read) => { await read(other); });
    await expect(readReplayedSummary(target, options)).rejects.toMatchObject({ code: "analytics_unavailable" });
    expect(options.getSummary).not.toHaveBeenCalled();
  });

  it("rejects mixed-run storage output before invoking replay", async () => {
    const options = setup();
    options.store.readCommittedEvents.mockResolvedValue([{ ...history[0], run_id: other }]);
    await expect(readReplayedSummary(target, options)).rejects.toMatchObject({ code: "analytics_unavailable" });
    expect(options.replayRun).not.toHaveBeenCalled();
  });

  it("replays an existing empty run before accepting a zero summary", async () => {
    const options = setup();
    options.store.snapshot.mockResolvedValue({ ...target, revision: 0, events: [] });
    options.store.readCommittedEvents.mockResolvedValue([]);
    const empty = { recovered: 0, median_ttff_seconds: null, reason_tally: {} };
    options.getSummary.mockResolvedValue(empty);
    expect(await readReplayedSummary({ ...target, revision: 0 }, options)).toEqual({ checkpoint: { ...target, revision: 0 }, summary: empty });
    expect(options.replayRun).toHaveBeenCalledOnce();
  });

  it.each(["snapshot", "history", "query"])("sanitizes a %s failure without a success result", async stage => {
    const options = setup();
    const error = new Error("private provider details");
    if (stage === "snapshot") options.store.snapshot.mockRejectedValue(error);
    else if (stage === "history") options.store.readCommittedEvents.mockRejectedValue(error);
    else options.getSummary.mockRejectedValue(error);
    await expect(readReplayedSummary(target, options)).rejects.toMatchObject({ message: "analytics_unavailable" });
  });

  it("rejects a new same-run revision during the summary query", async () => {
    const options = setup();
    options.getSummary.mockImplementation(async () => {
      options.store.snapshot.mockResolvedValue({ ...target, revision: 2 });
      return summary;
    });
    await expect(readReplayedSummary(target, options)).rejects.toMatchObject({ code: "analytics_stale" });
  });

  it.each([{ run_id: "invalid", revision: 1 }, { ...target, revision: -1 }, { ...target, revision: 1.5 }])("rejects invalid checkpoint before I/O: %j", async value => {
    const options = setup();
    await expect(readReplayedSummary(value, options)).rejects.toMatchObject({ code: "analytics_unavailable" });
    expect(options.store.snapshot).not.toHaveBeenCalled();
  });
});
