// Apply the analytics schema to Tiger (task 2.3 / C2).
//
// Usage: node --env-file-if-exists=.env --import tsx scripts/analytics/init.ts
//
// Idempotent: running twice must preserve data. Never drops tables or resets
// the service to make tests pass. Exits nonzero when the database is not
// configured or unreachable — never silently skips.

import { readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { stripSslParams, tigerSsl } from '@/lib/server/analytics/store';

async function main(): Promise<void> {
  const url = process.env.TIGER_DATABASE_URL;
  if (typeof url !== 'string' || url.length === 0) {
    console.error('TIGER_DATABASE_URL is not set; schema init skipped. This is not a pass.');
    process.exit(1);
  }
  const { default: pg } = await import('pg');
  const client = new pg.Client({
    connectionString: stripSslParams(url),
    ssl: tigerSsl(),
    connectionTimeoutMillis: 5_000,
    statement_timeout: 10_000,
    query_timeout: 15_000,
  });
  const schemaPath = resolve(dirname(fileURLToPath(import.meta.url)), 'schema.sql');
  try {
    await client.connect();
    // by_range()/create_hypertable need the extension available; the plain-SQL
    // run executes the statements in order and fails loudly otherwise.
    const sql = await readFile(schemaPath, 'utf8');
    await client.query('CREATE EXTENSION IF NOT EXISTS timescaledb');
    await client.query(sql);
    console.log('Analytics schema applied (idempotent).');
  } catch (error) {
    // Never print the connection string or raw error details containing it.
    console.error(`Schema init failed: ${error instanceof Error ? error.message : 'unknown error'}`);
    process.exitCode = 1;
  } finally {
    await client.end().catch(() => undefined);
  }
}

main().catch((error: unknown) => {
  console.error(String(error instanceof Error ? error.message : error));
  process.exit(1);
});
