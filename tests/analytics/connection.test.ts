import pg from 'pg';
import { describe, expect, it } from 'vitest';

import { stripSslParams, tigerSsl } from '@/lib/server/analytics/store';

const URL_BASE = 'postgres://demo:p%23%3F%40%26%2F%25@localhost:5432/tsdb';

describe('Tiger TLS connection options', () => {
  it('uses the default trust store with certificate and hostname verification', () => {
    const ssl = tigerSsl();
    expect(ssl.rejectUnauthorized).toBe(true);
    // An explicit Timescale-only CA replaces Node trust and rejects public CAs.
    expect(ssl).not.toHaveProperty('ca');
    expect(ssl).not.toHaveProperty('checkServerIdentity');
  });

  it.each([
    'sslmode=require',
    'sslmode=no-verify',
    'ssl=false',
    'ssl=no-verify',
    'sslcert=/missing/cert&sslkey=/missing/key&sslrootcert=/missing/root',
    'sslmode=require&uselibpqcompat=true',
    'sslnegotiation=direct',
    '%73slmode=disable&sslmode=no-verify',
  ])('prevents URL options from replacing verified TLS: %s', (query) => {
    const client = new pg.Client({
      connectionString: stripSslParams(`${URL_BASE}?${query}`),
      ssl: tigerSsl(),
    });
    // Exercise pg's actual connection-string merge without opening a socket.
    expect(client.ssl).toEqual({ rejectUnauthorized: true });
  });

  it('preserves encoded credentials and non-SSL options exactly', () => {
    const query = 'application_name=firstdose%20analytics&connect_timeout=5';
    expect(stripSslParams(`${URL_BASE}?sslmode=require&${query}&sslrootcert=x`))
      .toBe(`${URL_BASE}?${query}`);
    expect(stripSslParams(URL_BASE)).toBe(URL_BASE);
  });
});
