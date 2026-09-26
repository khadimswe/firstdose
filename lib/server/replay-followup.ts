import type { AccessSummary } from "@/components/data/types";
import type { Snapshot } from "./commands";
import { createWorkflowStore, isRunId, type CommittedEvent } from "./supabase-workflow";

export type ReplayCheckpoint = Pick<Snapshot, "run_id" | "revision">;
type ReadHistory = (runId: string) => Promise<CommittedEvent[]>;
type Options = {
  store?: { snapshot(): Promise<Snapshot>; readCommittedEvents: ReadHistory };
  replayRun: (runId: string, read: ReadHistory) => Promise<void>;
  getSummary: (runId: string) => Promise<AccessSummary>;
};

export class ReplayError extends Error {
  constructor(public readonly code: "analytics_stale" | "analytics_unavailable") {
    super(code);
    this.name = "ReplayError";
  }
}

/** Server-only orchestration. The injected replay owns projection and Tiger writes. */
export async function readReplayedSummary(
  requested: ReplayCheckpoint, options: Options,
): Promise<{ checkpoint: ReplayCheckpoint; summary: AccessSummary }> {
  const checkpoint = { run_id: requested.run_id, revision: requested.revision };
  try {
    if (!isRunId(checkpoint.run_id) || !Number.isSafeInteger(checkpoint.revision) || checkpoint.revision < 0) throw new ReplayError("analytics_unavailable");
    checkpoint.run_id = checkpoint.run_id.toLowerCase();
    const store = options.store ?? createWorkflowStore();
    async function requireCurrent() {
      const current = await store.snapshot();
      if (current.run_id !== checkpoint.run_id || current.revision !== checkpoint.revision) throw new ReplayError("analytics_stale");
    }
    await requireCurrent();
    const history = structuredClone(await store.readCommittedEvents(checkpoint.run_id));
    if (history.some(row => row.run_id !== checkpoint.run_id)) throw new ReplayError("analytics_unavailable");
    // A command could have committed between the snapshot and history reads.
    await requireCurrent();
    await options.replayRun(checkpoint.run_id, async runId => {
      if (runId !== checkpoint.run_id) throw new ReplayError("analytics_unavailable");
      return structuredClone(history);
    });
    await requireCurrent();
    const summary = await options.getSummary(checkpoint.run_id);
    await requireCurrent();
    return { checkpoint, summary };
  } catch (error) {
    if (error instanceof ReplayError) throw error;
    throw new ReplayError("analytics_unavailable");
  }
}
