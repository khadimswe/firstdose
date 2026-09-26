// GET /api/label/[drug_id] — serve a verified cached label (task 1.10 / A3).
// Reads the bundled artifact only: no network, no Supabase, no provider keys.
// 404 for an unknown drug; 503 when the cached artifact is not verified yet.

import { getLabel } from '@/lib/server/label';

export async function GET(
  _request: Request,
  context: { params: Promise<{ drug_id: string }> },
) {
  const { drug_id } = await context.params;
  const label = await getLabel(drug_id);
  if (label === null) {
    return Response.json({ error: 'label_not_found' }, { status: 404 });
  }
  if (!label.byte_exact) {
    return Response.json({ error: 'label_unverified' }, { status: 503 });
  }
  return Response.json(label, { headers: { 'Cache-Control': 'no-store' } });
}