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
import reasonCatalog from '@/mock/reasons.json';

import type { MetricEvent } from './project';

export type { MetricEvent } from './project';

/**
 * pg merges the parsed connection string OVER the config object, so a
 * URL SSL option can replace our verified ssl object. Remove those options
 * without re-encoding credentials or unrelated query parameters.
 */
export function stripSslParams(url: string): string {
  const queryStart = url.indexOf('?');
  if (queryStart === -1) return url;
  const base = url.slice(0, queryStart);
  const query = url.slice(queryStart + 1);
  const stripped = ['ssl', 'sslmode', 'sslcert', 'sslkey', 'sslrootcert', 'uselibpqcompat', 'sslnegotiation'];
  const kept = query.split('&').filter((part) => {
    const key = new URLSearchParams(part).keys().next().value;
    return key !== undefined && !stripped.includes(key);
  });
  return kept.length > 0 ? `${base}?${kept.join('&')}` : base;
}

/** Verify the certificate chain and hostname using Node's trusted CAs. */
export function tigerSsl(): { rejectUnauthorized: true } {
  return { rejectUnauthorized: true };
}

let pool: Promise<import('pg').Pool> | undefined;

/** URL options cannot override the server's verified TLS or finite timeouts. */
export function analyticsConnectionConfig(value: string): import('pg').PoolConfig {
  try {
    const url = new URL(value);
    if (!['postgres:', 'postgresql:'].includes(url.protocol) || !url.hostname) throw new Error();
    url.search = '';
    url.hash = '';
    return {
      connectionString: url.toString(), max: 2,
      connectionTimeoutMillis: 5_000, idleTimeoutMillis: 10_000,
      statement_timeout: 5_000, query_timeout: 6_000,
      idle_in_transaction_session_timeout: 6_000,
      ssl: { rejectUnauthorized: true },
    };
  } catch {
    throw new Error('analytics_unavailable');
  }
}

/** Lazy pg Pool; missing configuration fails only at call time. */
async function analyticsPool(): Promise<import('pg').Pool> {
  if (pool) return pool;
  const url = process.env.TIGER_DATABASE_URL;
  if (typeof url !== 'string' || url.length === 0) {
    throw new Error('analytics_unavailable');
  }
  // Deferred import keeps the pg driver out of non-analytics imports.
  const config = analyticsConnectionConfig(url);
  pool = import('pg').then(pg => {
    const current = new pg.Pool(config);
    // Idle client failures must not become uncaught EventEmitter errors.
    current.on('error', () => undefined);
    return current;
  }).catch(() => {
    pool = undefined;
    throw new Error('analytics_unavailable');
  });
  return pool;
}

export async function closeAnalyticsPool(): Promise<void> {
  const current = pool;
  pool = undefined;
  if (current) await (await current).end();
}

/** Preserve the existing ledger encoding so identical historical retries remain no-ops. */
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
async function writeBatch(current: AnalyticsPool, events: readonly MetricEvent[]): Promise<void> {
  const client = await current.connect();
  let discard = false;
  try {
    await client.query('BEGIN');
    // Consistent ledger lock order prevents deadlocks between reversed replays.
    const ordered = [...events].sort((a, b) => a.run_id.localeCompare(b.run_id) || a.script_id.localeCompare(b.script_id));
    for (const event of ordered) {
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
          throw new EventConflictError(event.run_id, event.script_id);
        }
        // Identical replay: no-op.
      }
    }
    await client.query('COMMIT');
  } catch (error) {
    // A failed rollback leaves transaction state uncertain; discard that socket.
    await client.query('ROLLBACK').catch(() => { discard = true; });
    throw error;
  } finally {
    client.release(discard);
  }
}

/** Direct SQL summary; cross-checked against the pure summarize() oracle. */
async function querySummary(current: AnalyticsPool, runId: string): Promise<AccessSummary> {

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
  const recovered = numberFromSql(fillRow.recovered);
  const medianRaw = fillRow.median_ttff_seconds;
  const median = medianRaw === null || medianRaw === undefined
    ? null
    : Math.round(numberFromSql(medianRaw));
  if (!Number.isSafeInteger(recovered) || (recovered === 0) !== (median === null)) throw new Error('analytics_unavailable');

  const reasonTally: Partial<Record<ReasonKey, number>> = {};
  for (const row of reasons.rows as Array<{ reason: string; count: number }>) {
    if (!Object.hasOwn(reasonCatalog.reasons, row.reason)) throw new Error('analytics_unavailable');
    const count = numberFromSql(row.count);
    if (!Number.isSafeInteger(count)) throw new Error('analytics_unavailable');
    reasonTally[row.reason as ReasonKey] = count;
  }

  // Validate response keys; never return raw rows.
  return {
    recovered,
    median_ttff_seconds: median,
    reason_tally: reasonTally,
  };
}

function numberFromSql(value: unknown): number {
  if ((typeof value !== 'string' && typeof value !== 'number') || (typeof value === 'string' && !value.trim())) throw new Error('analytics_unavailable');
  const number = Number(value);
  if (!Number.isFinite(number) || number < 0) throw new Error('analytics_unavailable');
  return number;
}

type AnalyticsPool = Pick<import('pg').Pool, 'connect' | 'query'>;

export function createAnalyticsStore(current: AnalyticsPool) {
  return {
    writeMetricBatch: (events: readonly MetricEvent[]) => writeBatch(current, events),
    getAccessSummary: (runId: string) => querySummary(current, runId),
  };
}

export async function writeMetricBatch(events: readonly MetricEvent[]): Promise<void> {
  await writeBatch(await analyticsPool(), events);
}

export async function getAccessSummary(runId: string): Promise<AccessSummary> {
  return querySummary(await analyticsPool(), runId);
}
