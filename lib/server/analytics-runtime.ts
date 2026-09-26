import { replayRun } from "./analytics/replay";
import { getAccessSummary, writeMetricBatch } from "./tiger";
import { readCommittedEvents, isRunId } from "./supabase-workflow";
import { readReplayedSummary, ReplayError, type ReplayCheckpoint } from "./replay-followup";

function hmacKey(): string {
  const key = process.env.ANALYTICS_HMAC_KEY;
  if (!process.env.TIGER_DATABASE_URL || !key || key.length < 32) throw new ReplayError("analytics_unavailable");
  return key;
}

/** Retry from retained practice-side history; only the projector's allowlist reaches Tiger. */
export async function replayCommittedRun(runId: string): Promise<void> {
  try {
    if (!isRunId(runId)) throw new ReplayError("analytics_unavailable");
    await replayRun(runId.toLowerCase(), readCommittedEvents, writeMetricBatch, hmacKey());
  } catch { throw new ReplayError("analytics_unavailable"); }
}

export async function readLiveAccessSummary(checkpoint: ReplayCheckpoint) {
  const key = hmacKey();
  return readReplayedSummary(checkpoint, {
    replayRun: (runId, read) => replayRun(runId, read, writeMetricBatch, key),
    getSummary: getAccessSummary,
  });
}
