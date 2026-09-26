// Replay/retry seam for analytics (task 2.3 / C3).
//
// replayRun reads a run's durable source history (supplied by the workflow
// owner — never imported from Vinh's module here), projects the allowed
// events, and writes the batch. Replaying the whole two-case demo run is
// sufficient: no queue, daemon or scheduler. It never modifies authoritative
// events or timestamps, and rejects on failure so the caller can retry from
// the same source (identical immutable data no-ops through the key ledger).

import type { CommittedEvent, MetricEvent } from './project';
import { projectEvent } from './project';

export async function replayRun(
  runId: string,
  readCommittedEvents: (runId: string) => Promise<CommittedEvent[]>,
  writeBatch: (events: readonly MetricEvent[]) => Promise<void>,
  hmacKey: string,
): Promise<void> {
  const source = await readCommittedEvents(runId);
  const projected: MetricEvent[] = [];
  for (const committed of source) {
    if (committed.run_id !== runId) continue;
    const metric = projectEvent(committed, hmacKey);
    if (metric !== null) projected.push(metric);
  }
  if (projected.length > 0) {
    await writeBatch(projected);
  }
}