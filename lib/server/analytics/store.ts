// Tiger storage for run-scoped fill metrics (task 2.3 / C2).
//
// Lazy pg Pool (max 2, finite timeouts, TLS verification on). Missing config
// affects only analytics calls, never build/import. writeMetricBatch is a
// transactional key-ledger write: newly inserted keys get a hypertable row;
// an existing key no-ops only when the canonical payload hash is identical,
// otherwise the transaction rolls back with event_conflict. Analytics failure
// must never roll back Supabase's committed workflow, and connection strings
// or credential-bearing errors are never logged.

import { createHash } from 'node:crypto';

import type { AccessSummary, ReasonKey } from '@/components/data/types';

import type { MetricEvent } from './project';

export type { MetricEvent } from './project';

let pool: import('pg').Pool | null | undefined;

/** Lazy pg Pool; null when analytics is not configured (build/import unaffected). */
async function analyticsPool(): Promise<import('pg').Pool | null> {
  if (pool !== undefined) return pool;
  const url = process.env.TIGER_DATABASE_URL;
  if (typeof url !== 'string' || url.length === 0) {
    pool = null;
    return pool;
  }
  // Deferred import keeps the pg driver out of non-analytics imports.
  const pg = await import('pg');
  pool = new pg.Pool({
    connectionString: url,
    max: 2,
    connectionTimeoutMillis: 5_000,
    idleTimeoutMillis: 10_000,
    ssl: { rejectUnauthorized: true },
  });
  return pool;
}

/** Canonical payload hash from a fixed ordered array of fields. */
export function payloadHash(event: MetricEvent): string {
  const ordered = [
    event.run_id,
    event.script_id,
    event.case_hash,
    event.at,
    event.kind,
    event.reason ?? '',
  ];
  return createHash('sha256').update(ordered.join('\u0000')).digest('hex');
}

export class EventConflictError extends Error {
  constructor(runId: string, scriptId: string) {
    super(`event_conflict: ${runId}:${scriptId} already stored with different content`);
    this.name = 'EventConflictError';
  }
}

/**
 * Transactional batch write. A failed transaction leaves no key without its
 * event; retries reuse identical immutable source data and therefore no-op.
 */
export async function writeMetricBatch(events: readonly MetricEvent[]): Promise<void> {
  const current = analyticsPool();
  if (current === null) throw new Error('analytics_unavailable');
  const client = await current.connect();
  try {
    await client.query('BEGIN');
    for (const event of events) {
      const hash = payloadHash(event);
      const inserted = await client.query(
        `INSERT INTO firstdose.event_keys (run_id, script_id, payload_hash)
         VALUES ($1, $2, $3)
         ON CONFLICT (run_id, script_id) DO NOTHING
         RETURNING run_id`,
        [event.run_id, event.script_id, hash],
      );
      if (inserted.rowCount === 1) {
        await client.query(
          `INSERT INTO firstdose.fill_events (at, run_id, script_id, case_hash, kind, reason)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [event.at, event.run_id, event.script_id, event.case_hash, event.kind, event.reason],
        );
      } else {
        const existing = await client.query(
          'SELECT payload_hash FROM firstdose.event_keys WHERE run_id = $1 AND script_id = $2',
          [event.run_id, event.script_id],
        );
        const stored = existing.rows[0]?.payload_hash;
        if (stored !== hash) {
          await client.query('ROLLBACK');
          throw new EventConflictError(event.run_id, event.script_id);
        }
        // Identical replay: no-op.
      }
    }
    await client.query('COMMIT');
  } catch (error) {
    // ROLLBACK may itself throw when the transaction already aborted; the
    // client release below is the guaranteed cleanup path.
    if (!(error instanceof EventConflictError)) {
      await client.query('ROLLBACK').catch(() => undefined);
    }
    throw error;
  } finally {
    client.release();
  }
}

/** Direct SQL summary; cross-checked against the pure summarize() oracle. */
export async function getAccessSummary(runId: string): Promise<AccessSummary> {
  const current = analyticsPool();
  if (current === null) throw new Error('analytics_unavailable');

  // Confirmed first fills: earliest dispensing at or after the earliest
  // prescription per case; count and median of elapsed seconds.
  const fills = await current.query(
    `WITH firsts AS (
       SELECT fe.case_hash,
              MIN(fe.at) FILTER (WHERE fe.kind = 'prescribed') AS prescribed_at
       FROM firstdose.fill_events fe
       WHERE fe.run_id = $1
       GROUP BY fe.case_hash
     ), fills AS (
       SELECT fe.case_hash, MIN(fe.at) AS dispensed_at
       FROM firstdose.fill_events fe
       JOIN firsts f ON f.case_hash = fe.case_hash AND f.prescribed_at IS NOT NULL
       WHERE fe.run_id = $1 AND fe.kind = 'dispensed' AND fe.at >= f.prescribed_at
       GROUP BY fe.case_hash
     )
     SELECT COUNT(*)::int AS recovered,
            PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY EXTRACT(EPOCH FROM (dispensed_at - prescribed_at))) AS median_ttff_seconds
     FROM fills JOIN firsts ON firsts.case_hash = fills.case_hash`,
    [runId],
  );

  // Latest non-null reason per case, including unresolved cases; ties by
  // timestamp then script id.
  const reasons = await current.query(
    `WITH ranked AS (
       SELECT fe.case_hash, fe.reason,
              ROW_NUMBER() OVER (
                PARTITION BY fe.case_hash
                ORDER BY fe.at DESC, fe.script_id ASC
              ) AS rn
       FROM firstdose.fill_events fe
       WHERE fe.run_id = $1 AND fe.kind = 'reason' AND fe.reason IS NOT NULL
     )
     SELECT reason, COUNT(*)::int AS count
     FROM ranked WHERE rn = 1
     GROUP BY reason`,
    [runId],
  );

  const fillRow = fills.rows[0] ?? { recovered: 0, median_ttff_seconds: null };
  const recovered = Number(fillRow.recovered);
  const medianRaw = fillRow.median_ttff_seconds;
  const median = medianRaw === null || medianRaw === undefined
    ? null
    : Number.isFinite(Number(medianRaw))
      ? Math.round(Number(medianRaw))
      : null;

  const reasonTally: Partial<Record<ReasonKey, number>> = {};
  for (const row of reasons.rows as Array<{ reason: string; count: number }>) {
    reasonTally[row.reason as ReasonKey] = Number(row.count);
  }

  // Validate response keys; never return raw rows.
  return {
    recovered: Number.isFinite(recovered) ? recovered : 0,
    median_ttff_seconds: median,
    reason_tally: reasonTally,
  };
}