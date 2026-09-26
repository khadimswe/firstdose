import { describe, expect, it, vi } from 'vitest';

// The facade serves bundled cache only: no runtime DailyMed request, no
// Supabase dependency, no provider keys, and no filesystem paths built from
// request input. Unknown drugs return null; an unverified artifact keeps
// byte_exact false and returns 503 through the route.

describe('getLabel (bundled cache facade)', () => {
  it('returns the verified Otezla label from the committed artifact', async () => {
    const { getLabel } = await import('@/lib/server/label');
    const label = await getLabel('drug_otezla');
    expect(label).not.toBeNull();
    expect(label?.drug_id).toBe('drug_otezla');
    expect(label?.setid).toBe('f6b1f516-4972-4d82-bced-113e47b41cc5');
    expect(label?.byte_exact).toBe(true);
    const boxed = label?.sections.find((s) => s.loinc === '34066-1');
    expect(boxed?.text).toBeNull();
    const indications = label?.sections.find((s) => s.loinc === '34067-9');
    expect(indications?.text).toContain('OTEZLA');
    expect(indications?.text).toContain('phosphodiesterase 4');
  });

  it('returns null for an unknown drug id', async () => {
    const { getLabel } = await import('@/lib/server/label');
    expect(await getLabel('drug_nope')).toBeNull();
    // No filesystem path can be built from request input: an id with slashes
    // or dots must stay an allowlist miss, not a traversal.
    expect(await getLabel('../drug_otezla')).toBeNull();
    expect(await getLabel('a/b/c')).toBeNull();
    expect(await getLabel('')).toBeNull();
  });

  it('never performs network access at import or read time', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    await import('@/lib/server/label');
    const { getLabel } = await import('@/lib/server/label');
    await getLabel('drug_otezla');
    expect(fetchSpy).not.toHaveBeenCalled();
    fetchSpy.mockRestore();
  });
});