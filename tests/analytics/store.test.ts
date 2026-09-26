import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Pool } from 'pg';
import * as storage from '@/lib/server/analytics/store';
import type { MetricEvent } from '@/lib/server/analytics/project';

const poolState = vi.hoisted(() => ({ created: 0, ended: 0 }));
vi.mock('pg', async importOriginal => {
  const actual = await importOriginal<typeof import('pg')>();
  return { ...actual, Pool: class {
    constructor() { poolState.created++; }
    on() { return this; }
    async query(sql: string) { return { rows: sql.includes('PERCENTILE_CONT') ? [{ recovered: '0', median_ttff_seconds: null }] : [] }; }
    async end() { poolState.ended++; }
  } };
});

const event: MetricEvent = { run_id: 'run', script_id: 'p1', case_hash: 'hash', at: '2026-09-26T10:00:00.000Z', kind: 'prescribed', reason: null };

afterEach(async () => {
  if (storage.closeAnalyticsPool) await storage.closeAnalyticsPool();
  vi.unstubAllEnvs();
});

describe('Tiger connection configuration', () => {
  it.each(['sslmode=disable', 'sslmode=no-verify', 'ssl=0', 'uselibpqcompat=true&sslmode=require', 'query_timeout=0&statement_timeout=0&options=-c%20statement_timeout%3D0'])('cannot weaken verified TLS or timeouts via URL: %s', async query => {
    const { Client } = await vi.importActual<typeof import('pg')>('pg');
    const config = storage.analyticsConnectionConfig(`postgresql://u:p@example.com:5432/db?${query}`);
    const client = new Client(config) as unknown as { ssl: unknown; connectionParameters: Record<string, unknown> };
    expect(client.ssl).toEqual({ rejectUnauthorized: true });
    expect(config.connectionTimeoutMillis).toBeGreaterThan(0);
    expect(config.query_timeout).toBeGreaterThan(0);
    expect(client.connectionParameters.statement_timeout).toBeGreaterThan(0);
  });

  it('creates one lazy pool for concurrent cold requests', async () => {
    vi.stubEnv('TIGER_DATABASE_URL', 'postgresql://u:p@example.com/db');
    const before = poolState.created;
    await Promise.all([storage.getAccessSummary('run'), storage.getAccessSummary('run')]);
    expect(poolState.created - before).toBe(1);
  });
});

describe('Tiger payload and summary boundary', () => {
  it('retains the payload checksum used by existing immutable ledgers', () => {
    expect(storage.payloadHash(event)).toBe(createHash('sha256').update([event.run_id, event.script_id, event.case_hash, event.at, event.kind, ''].join('\u0000')).digest('hex'));
  });

  it('preserves fractional seconds from SQL and normalizes numeric strings', async () => {
    const query = vi.fn().mockResolvedValueOnce({ rows: [{ recovered: '2', median_ttff_seconds: '0.495' }] }).mockResolvedValueOnce({ rows: [{ reason: 'PA_REQUIRED', count: '1' }] });
    const store = storage.createAnalyticsStore({ query } as unknown as Pick<Pool, 'connect' | 'query'>);
    expect(await store.getAccessSummary('run')).toEqual({ recovered: 2, median_ttff_seconds: 0.495, reason_tally: { PA_REQUIRED: 1 } });
  });

  it.each([
    { reason: 'secret note', count: 1 },
    { reason: 'PA_REQUIRED', count: 'NaN' },
    { reason: 'PA_REQUIRED', count: -1 },
  ])('rejects untrusted SQL summary rows: %j', async row => {
    const query = vi.fn().mockResolvedValueOnce({ rows: [{ recovered: 0, median_ttff_seconds: null }] }).mockResolvedValueOnce({ rows: [row] });
    const store = storage.createAnalyticsStore({ query } as unknown as Pick<Pool, 'connect' | 'query'>);
    await expect(store.getAccessSummary('run')).rejects.toThrow('analytics_unavailable');
  });

  it('rolls back a conflicting replay and releases the client', async () => {
    const calls: string[] = [];
    const release = vi.fn();
    const query = vi.fn(async (sql: string) => {
      calls.push(sql);
      return sql.startsWith('SELECT payload_hash') ? { rows: [{ payload_hash: 'different' }] } : { rowCount: 0, rows: [] };
    });
    const store = storage.createAnalyticsStore({ connect: async () => ({ query, release }) } as unknown as Pick<Pool, 'connect' | 'query'>);
    await expect(store.writeMetricBatch([event])).rejects.toBeInstanceOf(storage.EventConflictError);
    expect(calls).toContain('ROLLBACK');
    expect(calls).not.toContain('COMMIT');
    expect(release).toHaveBeenCalledOnce();
  });

  it('discards a connection when rollback cannot complete', async () => {
    const release = vi.fn();
    const query = vi.fn(async (sql: string) => {
      if (sql === 'BEGIN') return { rows: [] };
      throw new Error('connection lost');
    });
    const store = storage.createAnalyticsStore({ connect: async () => ({ query, release }) } as unknown as Pick<Pool, 'connect' | 'query'>);
    await expect(store.writeMetricBatch([event])).rejects.toThrow('connection lost');
    expect(release).toHaveBeenCalledWith(true);
  });
});

describe('Tiger operational script failures', () => {
  it.each(['init', 'smoke'])('%s exits nonzero without printing provider connection details', script => {
    const marker = 'private-provider-detail-do-not-print';
    const result = spawnSync(process.execPath, ['--import', 'tsx', `scripts/analytics/${script}.ts`], {
      encoding: 'utf8', timeout: 10_000,
      env: { ...process.env, TIGER_DATABASE_URL: `postgresql://u:p@127.0.0.1:1/db?sslrootcert=${marker}` },
    });
    expect(result.status).toBe(1);
    expect(result.stdout + result.stderr).not.toContain(marker);
  }, 12_000);
});
