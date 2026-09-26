import { afterEach, describe, expect, it, vi } from 'vitest';

import { GET } from '@/app/api/label/[drug_id]/route';
import type { Label } from '@/components/data/types';

// Route behaviour: 200 with the verified payload, 404 for an unknown drug,
// 503 for a known but unverified artifact, and never a network call.

function request(drugId: string): Request {
  return new Request(`http://localhost:3000/api/label/${drugId}`);
}

async function callGet(drugId: string) {
  return GET(request(drugId), { params: Promise.resolve({ drug_id: drugId }) });
}

describe('GET /api/label/[drug_id]', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.resetModules();
  });

  it('returns 200 with the verified Otezla label', async () => {
    const response = await callGet('drug_otezla');
    expect(response.status).toBe(200);
    const label = (await response.json()) as { drug_id: string; byte_exact: boolean };
    expect(label.drug_id).toBe('drug_otezla');
    expect(label.byte_exact).toBe(true);
  });

  it('returns 404 for an unknown drug id', async () => {
    const response = await callGet('drug_nope');
    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({ error: 'label_not_found' });
  });

  it('returns 503 when the cached artifact is not verified (byte_exact false)', async () => {
    // The real facade returns a verified Otezla label; flip byte_exact to
    // false through a module mock so the route's 503 branch is exercised
    // against a faithful payload shape.
    const { getLabel: realGetLabel } = await import('@/lib/server/label');
    const original = await realGetLabel('drug_otezla');
    if (original === null) throw new Error('setup: expected a cached Otezla label');
    const unverified: Label = { ...original, byte_exact: false };
    vi.doMock('@/lib/server/label', () => ({ getLabel: async () => unverified }));
    try {
      const { GET: mockedGet } = await import('@/app/api/label/[drug_id]/route');
      const response = await mockedGet(request('drug_otezla'), {
        params: Promise.resolve({ drug_id: 'drug_otezla' }),
      });
      expect(response.status).toBe(503);
      expect(await response.json()).toEqual({ error: 'label_unverified' });
    } finally {
      vi.doUnmock('@/lib/server/label');
      vi.resetModules();
    }
  });

  it('never performs network access while serving', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    await callGet('drug_otezla');
    await callGet('drug_nope');
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});