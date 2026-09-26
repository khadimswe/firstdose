// Tiger smoke: real hypertable proof with a synthetic run (task 2.3 / C2).
//
// Usage: node --env-file-if-exists=.env --import tsx scripts/analytics/smoke.ts
//
// Uses a FRESH synthetic run UUID: inserts 60/120-second cases, replays
// duplicates, attempts a conflicting duplicate, compares the SQL summary with
// the pure oracle, and queries another run to prove isolation. Unavailable DB
// exits nonzero, never skip/pass. Prints only the synthetic run id, check
// names, summary and pass/fail — never credentials or connection strings.
// Never deletes other runs.

import { randomUUID } from 'node:crypto';
import { isDeepStrictEqual } from 'node:util';

import type { MetricEvent } from '@/lib/server/analytics/project';
import { summarize } from '@/lib/server/analytics/summary';
import { closeAnalyticsPool, getAccessSummary, payloadHash, writeMetricBatch, EventConflictError } from '@/lib/server/analytics/store';

function metric(run: string, over: Partial<MetricEvent> & { script_id: string; kind: MetricEvent['kind']; at: string }): MetricEvent {
  return { run_id: run, case_hash: over.case_hash ?? 'case-a', reason: null, ...over };
}

function fail(message: string): never {
  console.error(`FAIL ${message}`);
  throw new Error('smoke_check_failed');
}

async function main(): Promise<void> {
  const run = randomUUID();
  const other = randomUUID();
  const base = '2026-09-26T10:00:00.000Z';
  console.log(`Synthetic run: ${run}`);

  // Two cases: 60 s and 120 s to first fill.
  const batch: MetricEvent[] = [
    metric(run, { script_id: 'p1', kind: 'prescribed', at: base }),
    metric(run, { script_id: 'd1', kind: 'dispensed', at: '2026-09-26T10:01:00.000Z' }),
    metric(run, { script_id: 'r1', kind: 'reason', reason: 'DECLINED_AT_PRICE', at: '2026-09-26T10:00:10.000Z' }),
    metric(run, { script_id: 'p2', kind: 'prescribed', at: base, case_hash: 'case-b' }),
    metric(run, { script_id: 'd2', kind: 'dispensed', at: '2026-09-26T10:02:00.000Z', case_hash: 'case-b' }),
    metric(run, { script_id: 'r2', kind: 'reason', reason: 'UNABLE_TO_REACH', at: '2026-09-26T10:00:15.000Z', case_hash: 'case-b' }),
  ];

  // Check 1: initial write.
  try {
    await writeMetricBatch(batch);
    console.log('PASS initial write');
  } catch {
    fail('initial write: analytics_unavailable');
  }

  // Check 2: replay duplicates (identical payload) — no-op, no conflict.
  try {
    await writeMetricBatch(batch);
    console.log('PASS replay duplicates no-op');
  } catch {
    fail('replay duplicates: analytics_unavailable');
  }

  // Check 3: conflicting duplicate must be rejected.
  const conflicting = metric(run, { script_id: 'd1', kind: 'dispensed', at: '2026-09-26T10:09:00.000Z' });
  try {
    await writeMetricBatch([conflicting]);
    fail('conflicting duplicate was accepted');
  } catch (error) {
    if (error instanceof EventConflictError) {
      console.log('PASS conflicting duplicate rejected (event_conflict)');
    } else {
      fail('conflicting duplicate threw an unexpected error');
    }
  }

  // Check 4: SQL summary equals the pure oracle on the same rows.
  const sql = await getAccessSummary(run);
  const oracle = summarize(batch, run);
  const same = isDeepStrictEqual(sql, oracle);
  if (!same) {
    fail(`SQL/oracle mismatch: sql=${JSON.stringify(sql)} oracle=${JSON.stringify(oracle)}`);
  }
  console.log(`PASS SQL matches oracle: ${JSON.stringify(sql)}`);

  // Check 5: another run is isolated (no cross-run leakage).
  const otherSummary = await getAccessSummary(other);
  if (otherSummary.recovered !== 0 || otherSummary.median_ttff_seconds !== null || Object.keys(otherSummary.reason_tally).length !== 0) {
    fail(`run isolation broken: ${JSON.stringify(otherSummary)}`);
  }
  console.log('PASS other run isolated (zeros/null)');

  // Check 6: payload hash is stable and content-sensitive.
  const stable = payloadHash(batch[0]!) === payloadHash({ ...batch[0]! });
  const sensitive = payloadHash(batch[0]!) !== payloadHash({ ...batch[0]!, at: '2026-09-26T10:00:01.000Z' });
  if (!stable || !sensitive) fail('payload hash stability/sensitivity');
  console.log('PASS payload hash stable and content-sensitive');

  console.log('Smoke complete: all checks passed for the synthetic run.');
}

main().catch(() => {
  console.error('FAIL smoke: analytics_unavailable_or_check_failed');
  process.exitCode = 1;
}).finally(async () => {
  await closeAnalyticsPool().catch(() => {
    console.error('FAIL smoke cleanup: analytics_unavailable');
    process.exitCode = 1;
  });
});
