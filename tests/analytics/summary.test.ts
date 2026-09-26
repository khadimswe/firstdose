import { describe, expect, it } from 'vitest';

import type { MetricEvent } from '@/lib/server/analytics/project';
import { summarize } from '@/lib/server/analytics/summary';

// summarize reduces a run's metric events to the exact AccessSummary shape
// the /access screen consumes: recovered (confirmed first fills), the median
// time to first fill, and a per-case latest-reason tally. Deterministic: it
// sorts a copy, never mutates the caller's array, and selects the first
// qualifying fill after the prescription.

const RUN = 'run-1';

function metric(over: Partial<MetricEvent> & { script_id: string; kind: MetricEvent['kind']; at: string }): MetricEvent {
  return {
    run_id: RUN,
    case_hash: over.case_hash ?? 'case-a',
    reason: null,
    ...over,
  };
}

describe('summarize — recovered count and median ttff', () => {
  it('counts equal-time dispensing even when its script sorts before prescribing', () => {
    expect(summarize([
      metric({ script_id: 'z-prescribed', kind: 'prescribed', at: '2026-09-26T10:00:00.000Z' }),
      metric({ script_id: 'a-dispensed', kind: 'dispensed', at: '2026-09-26T10:00:00.000Z' }),
    ], RUN)).toEqual({ recovered: 1, median_ttff_seconds: 0, reason_tally: {} });
  });

  it('preserves millisecond durations when computing the median', () => {
    expect(summarize([
      metric({ script_id: 'p1', kind: 'prescribed', at: '2026-09-26T10:00:00.000Z' }),
      metric({ script_id: 'd1', kind: 'dispensed', at: '2026-09-26T10:00:00.490Z' }),
      metric({ script_id: 'p2', kind: 'prescribed', at: '2026-09-26T10:00:00.000Z', case_hash: 'b' }),
      metric({ script_id: 'd2', kind: 'dispensed', at: '2026-09-26T10:00:00.500Z', case_hash: 'b' }),
    ], RUN).median_ttff_seconds).toBe(0.495);
  });

  it('rejects conflicting duplicate identities in either input order', () => {
    const first = metric({ script_id: 'p1', kind: 'prescribed', at: '2026-09-26T10:00:00.000Z' });
    const changed = { ...first, at: '2026-09-26T10:01:00.000Z' };
    expect(() => summarize([first, changed], RUN)).toThrow('event_conflict');
    expect(() => summarize([changed, first], RUN)).toThrow('event_conflict');
  });
  it('two cases at 60/120 seconds -> count 2, median 90', () => {
    const events = [
      metric({ script_id: 'p1', kind: 'prescribed', at: '2026-09-26T10:00:00Z' }),
      metric({ script_id: 'd1', kind: 'dispensed', at: '2026-09-26T10:01:00Z', case_hash: 'case-a' }),
      metric({ script_id: 'p2', kind: 'prescribed', at: '2026-09-26T10:00:00Z', case_hash: 'case-b' }),
      metric({ script_id: 'd2', kind: 'dispensed', at: '2026-09-26T10:02:00Z', case_hash: 'case-b' }),
    ];
    expect(summarize(events, RUN)).toEqual({
      recovered: 2,
      median_ttff_seconds: 90,
      reason_tally: {},
    });
  });

  it('odd median uses the middle value', () => {
    const events = [
      metric({ script_id: 'p1', kind: 'prescribed', at: '2026-09-26T10:00:00Z' }),
      metric({ script_id: 'd1', kind: 'dispensed', at: '2026-09-26T10:01:00Z' }),
    ];
    expect(summarize(events, RUN).median_ttff_seconds).toBe(60);
  });

  it('missing-prescription/unresolved cases do not count; no completed cases -> median null', () => {
    // Dispensing without a prescription in the run is not a confirmed first fill.
    const events = [
      metric({ script_id: 'd1', kind: 'dispensed', at: '2026-09-26T10:01:00Z' }),
      metric({ script_id: 'p1', kind: 'prescribed', at: '2026-09-26T10:00:00Z', case_hash: 'case-b' }),
    ];
    const summary = summarize(events, RUN);
    expect(summary.recovered).toBe(0);
    expect(summary.median_ttff_seconds).toBeNull();
  });

  it('an early fill before the prescription does not hide a later valid confirmation', () => {
    const events = [
      metric({ script_id: 'p1', kind: 'prescribed', at: '2026-09-26T10:00:00Z' }),
      // Invalid earlier fill (before the prescription).
      metric({ script_id: 'd-early', kind: 'dispensed', at: '2026-09-26T09:00:00Z', case_hash: 'case-other' }),
      // Valid later confirmation for case-a.
      metric({ script_id: 'd1', kind: 'dispensed', at: '2026-09-26T10:02:00Z' }),
    ];
    const summary = summarize(events, RUN);
    expect(summary.recovered).toBe(1);
    expect(summary.median_ttff_seconds).toBe(120);
  });
});

describe('summarize — run scoping, duplicates and determinism', () => {
  it('uses the requested run only (another run is excluded)', () => {
    const events = [
      metric({ script_id: 'p1', kind: 'prescribed', at: '2026-09-26T10:00:00Z' }),
      metric({ script_id: 'd1', kind: 'dispensed', at: '2026-09-26T10:01:00Z' }),
      { ...metric({ script_id: 'p9', kind: 'prescribed', at: '2026-09-26T10:00:00Z' }), run_id: 'run-2' },
      { ...metric({ script_id: 'd9', kind: 'dispensed', at: '2026-09-26T10:01:00Z' }), run_id: 'run-2' },
    ];
    expect(summarize(events, RUN).recovered).toBe(1);
    expect(summarize(events, 'run-2').recovered).toBe(1);
  });

  it('deduplicates identical (run, script) rows instead of counting twice', () => {
    const events = [
      metric({ script_id: 'p1', kind: 'prescribed', at: '2026-09-26T10:00:00Z' }),
      metric({ script_id: 'd1', kind: 'dispensed', at: '2026-09-26T10:01:00Z' }),
      // Replay duplicate of the same committed event.
      metric({ script_id: 'd1', kind: 'dispensed', at: '2026-09-26T10:01:00Z' }),
    ];
    expect(summarize(events, RUN).recovered).toBe(1);
  });

  it('empty run -> zeros and null median', () => {
    expect(summarize([], RUN)).toEqual({ recovered: 0, median_ttff_seconds: null, reason_tally: {} });
  });

  it('sorts a copy; never mutates the caller array', () => {
    const events = [
      metric({ script_id: 'd1', kind: 'dispensed', at: '2026-09-26T10:01:00Z' }),
      metric({ script_id: 'p1', kind: 'prescribed', at: '2026-09-26T10:00:00Z' }),
    ];
    const snapshot = JSON.stringify(events);
    summarize(events, RUN);
    expect(JSON.stringify(events)).toBe(snapshot);
  });

  it('out-of-order source input yields the same result as sorted input', () => {
    const sorted = [
      metric({ script_id: 'p1', kind: 'prescribed', at: '2026-09-26T10:00:00Z' }),
      metric({ script_id: 'd1', kind: 'dispensed', at: '2026-09-26T10:01:00Z' }),
    ];
    const shuffled = [sorted[1]!, sorted[0]!];
    expect(summarize(shuffled, RUN)).toEqual(summarize(sorted, RUN));
  });
});

describe('summarize — reason_tally', () => {
  it('counts the latest non-null reason once per case, including unresolved cases', () => {
    const events = [
      metric({ script_id: 'p1', kind: 'prescribed', at: '2026-09-26T10:00:00Z' }),
      metric({ script_id: 'r1', kind: 'reason', reason: 'PA_REQUIRED', at: '2026-09-26T10:00:10Z' }),
      // Later re-classification for the same case wins, once.
      metric({ script_id: 'r2', kind: 'reason', reason: 'DECLINED_AT_PRICE', at: '2026-09-26T10:00:20Z' }),
      metric({ script_id: 'p2', kind: 'prescribed', at: '2026-09-26T10:00:00Z', case_hash: 'case-b' }),
      metric({ script_id: 'r3', kind: 'reason', reason: 'UNABLE_TO_REACH', at: '2026-09-26T10:00:15Z', case_hash: 'case-b' }),
      // case-b never fills; it still counts in the tally.
    ];
    expect(summarize(events, RUN).reason_tally).toEqual({
      DECLINED_AT_PRICE: 1,
      UNABLE_TO_REACH: 1,
    });
  });

  it('ties on timestamp resolve by script id deterministically', () => {
    const events = [
      metric({ script_id: 'r2', kind: 'reason', reason: 'NOT_COVERED', at: '2026-09-26T10:00:10Z' }),
      metric({ script_id: 'r1', kind: 'reason', reason: 'PA_REQUIRED', at: '2026-09-26T10:00:10Z' }),
    ];
    expect(summarize(events, RUN).reason_tally).toEqual({ PA_REQUIRED: 1 });
  });

  it('repeated classifications do not count as extra people; null reason adds no bucket', () => {
    const events = [
      metric({ script_id: 'r1', kind: 'reason', reason: 'PA_REQUIRED', at: '2026-09-26T10:00:10Z' }),
      metric({ script_id: 'r2', kind: 'reason', reason: 'PA_REQUIRED', at: '2026-09-26T10:00:20Z' }),
    ];
    expect(summarize(events, RUN).reason_tally).toEqual({ PA_REQUIRED: 1 });
  });
});

describe('summarize — ignored evidence', () => {
  it('acknowledgment only, or started/recovered only, produces empty summary', () => {
    // These never become MetricEvents (projected out), but summarize must also
    // tolerate rows of other kinds without treating them as fills.
    const events = [metric({ script_id: 'p1', kind: 'prescribed', at: '2026-09-26T10:00:00Z' })];
    expect(summarize(events, RUN)).toEqual({ recovered: 0, median_ttff_seconds: null, reason_tally: {} });
  });

  it('immutable retry times: identical timestamps across retries keep the same summary', () => {
    const first = [
      metric({ script_id: 'p1', kind: 'prescribed', at: '2026-09-26T10:00:00Z' }),
      metric({ script_id: 'd1', kind: 'dispensed', at: '2026-09-26T10:01:30Z' }),
    ];
    const retried = [...first];
    expect(summarize(retried, RUN)).toEqual(summarize(first, RUN));
  });
});
