import { afterEach, describe, expect, it, vi } from 'vitest';

import { GET } from '@/app/api/access/summary/route';

// Route behaviour: 400 for missing/invalid run id, 503 { error:
// "analytics_unavailable" } on missing config/DB failure (never success-shaped
// mock data or credential details), 200 with the exact summary shape and
// Cache-Control: no-store for a valid configured run, and no identifying
// fields anywhere.

const RUN = '0b3a507-2bc3-89b7-4d16-a532f68e5d21';
const VALID_UUID = '123e4567-e89b-12d3-a456-426614174000';

function requestFor(runId: string | null): Request {
  const url = runId === null
    ? 'http://localhost:3000/api/access/summary'
    : `http://localhost:3000/api/access/summary?run_id=${encodeURIComponent(runId)}`;
  return new Request(url);
}

afterEach(() => {
  vi.restoreAllMocks();
  vi.resetModules();
});

describe('GET /api/access/summary', () => {
  it('returns 400 for a missing run id', async () => {
    const response = await GET(requestFor(null));
    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: 'run_id_required' });
    expect(response.headers.get('cache-control')).toBe('no-store');
  });

  it('returns 400 for an invalid run id', async () => {
    const response = await GET(requestFor('not-a-uuid'));
    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: 'run_id_invalid' });
  });

  it('returns 503 analytics_unavailable when the store throws (missing config or DB failure)', async () => {
    vi.doMock('@/lib/server/tiger', () => ({
      getAccessSummary: async () => {
        throw new Error('analytics_unavailable');
      },
    }));
    const { GET: mockedGet } = await import('@/app/api/access/summary/route');
    const response = await mockedGet(requestFor(VALID_UUID));
    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({ error: 'analytics_unavailable' });
  });

  it('returns the exact summary shape with no-store and no identifying fields', async () => {
    vi.doMock('@/lib/server/tiger', () => ({
      getAccessSummary: async () => ({
        recovered: 2,
        median_ttff_seconds: 90,
        reason_tally: { DECLINED_AT_PRICE: 1, UNABLE_TO_REACH: 1 },
      }),
    }));
    const { GET: mockedGet } = await import('@/app/api/access/summary/route');
    const response = await mockedGet(requestFor(VALID_UUID));
    expect(response.status).toBe(200);
    expect(response.headers.get('cache-control')).toBe('no-store');
    const body = (await response.json()) as Record<string, unknown>;
    expect(Object.keys(body).sort()).toEqual(['median_ttff_seconds', 'reason_tally', 'recovered']);
    const serialized = JSON.stringify(body);
    for (const forbidden of ['case_id', 'patient', 'name', 'prescriber', 'note', 'rx_']) {
      expect(serialized).not.toContain(forbidden);
    }
  });

  it('a valid run with no projected events returns zeros/null', async () => {
    vi.doMock('@/lib/server/tiger', () => ({
      getAccessSummary: async () => ({ recovered: 0, median_ttff_seconds: null, reason_tally: {} }),
    }));
    const { GET: mockedGet } = await import('@/app/api/access/summary/route');
    const response = await mockedGet(requestFor(VALID_UUID));
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ recovered: 0, median_ttff_seconds: null, reason_tally: {} });
  });
});

void RUN;