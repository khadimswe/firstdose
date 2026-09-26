// GET /api/access/summary?run_id=<run UUID> — run-scoped Tiger aggregate
// (task 2.3 / C3). Missing/invalid run id -> 400. Missing config or DB failure
// -> 503 { error: "analytics_unavailable" }, never success-shaped mock data.
// A valid run returns the exact { recovered, median_ttff_seconds,
// reason_tally } with Cache-Control: no-store and no identifying fields.
//
// The active run id is supplied by Vinh's adapter; the EventSource
// accessSummary() signature keeps taking no arguments, so this query
// parameter is the server-facing form only.

import { getAccessSummary } from '@/lib/server/tiger';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(request: Request) {
  const runId = new URL(request.url).searchParams.get('run_id');
  if (runId === null || runId.length === 0) {
    return Response.json({ error: 'run_id_required' }, { status: 400, headers: { 'Cache-Control': 'no-store' } });
  }
  // Synthetic smoke runs use their own prefix; accept UUIDs (the workflow's
  // run identity) without constraining the adapter to one format.
  if (!UUID_RE.test(runId) && !runId.startsWith('smoke-')) {
    return Response.json({ error: 'run_id_invalid' }, { status: 400, headers: { 'Cache-Control': 'no-store' } });
  }
  try {
    const summary = await getAccessSummary(runId);
    return Response.json(summary, { headers: { 'Cache-Control': 'no-store' } });
  } catch {
    // Missing config/DB failure: never success-shaped mock data, never
    // credential details.
    return Response.json({ error: 'analytics_unavailable' }, { status: 503, headers: { 'Cache-Control': 'no-store' } });
  }
}