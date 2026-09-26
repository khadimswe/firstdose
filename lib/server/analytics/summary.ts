// Pure run-scoped access summary (task 2.3 / C1).
//
// summarize reduces a run's metric rows to the exact AccessSummary shape the
// /access screen consumes. `recovered` counts cases with a confirmed first
// fill (earliest dispensing at or after the earliest prescription) — the
// existing response key, never a clinical claim. Deterministic: input arrays
// are never mutated; ties resolve by timestamp then script id.

import type { AccessSummary, ReasonKey } from '@/components/data/types';

import { metricEventConflict, type MetricEvent } from './project';

function median(values: number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 1
    ? sorted[middle]!
    : (sorted[middle - 1]! + sorted[middle]!) / 2;
}

type CaseFold = { firstPrescribedAt: number | null; firstDispensedAfter: number | null; latestReason: { at: number; scriptId: string; reason: ReasonKey } | null };

export function summarize(events: readonly MetricEvent[], runId: string): AccessSummary {
  // Deduplicate by (run_id, script_id): a replayed batch is one event.
  const byKey = new Map<string, MetricEvent>();
  for (const event of events) {
    if (event.run_id !== runId) continue;
    const key = event.script_id;
    const prior = byKey.get(key);
    if (prior && metricEventConflict(prior, event)) throw new Error('event_conflict');
    byKey.set(key, event);
  }

  // Deterministic order: timestamp, then script id for ties.
  const ordered = [...byKey.values()].sort((a, b) =>
    a.at === b.at ? (a.script_id < b.script_id ? -1 : 1) : a.at < b.at ? -1 : 1,
  );

  const byCase = new Map<string, CaseFold>();
  const foldOf = (caseHash: string): CaseFold => {
    let fold = byCase.get(caseHash);
    if (fold === undefined) {
      fold = { firstPrescribedAt: null, firstDispensedAfter: null, latestReason: null };
      byCase.set(caseHash, fold);
    }
    return fold;
  };

  // Find prescriptions first so an equal-time fill never depends on script order.
  for (const event of ordered) {
    if (event.kind !== 'prescribed') continue;
    const fold = foldOf(event.case_hash);
    const time = Date.parse(event.at);
    if (fold.firstPrescribedAt === null || time < fold.firstPrescribedAt) fold.firstPrescribedAt = time;
  }

  for (const event of ordered) {
    const fold = foldOf(event.case_hash);
    const time = Date.parse(event.at);
    switch (event.kind) {
      case 'prescribed':
        if (fold.firstPrescribedAt === null || time < fold.firstPrescribedAt) {
          fold.firstPrescribedAt = time;
        }
        break;
      case 'dispensed':
        // Only a fill at or after the case's prescription confirms; an early
        // stray fill must not hide a later valid confirmation.
        if (fold.firstPrescribedAt !== null
          && fold.firstDispensedAfter === null
          && time >= fold.firstPrescribedAt) {
          fold.firstDispensedAfter = time;
        }
        break;
      case 'reason':
        // Latest non-null reason wins; null reason adds no bucket. Ties on
        // timestamp resolve by the smaller script id (the ordered list's
        // earlier row), deterministically.
        if (event.reason !== null) {
          if (
            fold.latestReason === null
            || time > fold.latestReason.at
            || (time === fold.latestReason.at && event.script_id < fold.latestReason.scriptId)
          ) {
            fold.latestReason = { at: time, scriptId: event.script_id, reason: event.reason };
          }
        }
        break;
    }
  }

  const ttffs: number[] = [];
  const reasonTally: Partial<Record<ReasonKey, number>> = {};
  for (const fold of byCase.values()) {
    if (fold.firstPrescribedAt !== null && fold.firstDispensedAfter !== null) {
      ttffs.push((fold.firstDispensedAfter - fold.firstPrescribedAt) / 1000);
    }
    if (fold.latestReason !== null) {
      const reason = fold.latestReason.reason;
      reasonTally[reason] = (reasonTally[reason] ?? 0) + 1;
    }
  }

  return {
    recovered: ttffs.length,
    median_ttff_seconds: median(ttffs),
    reason_tally: reasonTally,
  };
}
