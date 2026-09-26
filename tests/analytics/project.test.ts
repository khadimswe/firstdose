import { createHmac } from 'node:crypto';
import { describe, expect, it } from 'vitest';

import type { FillEvent } from '@/components/data/types';
import { projectEvent, type CommittedEvent, type MetricEvent } from '@/lib/server/analytics/project';

// projectEvent turns one committed workflow event into a pseudonymous metric
// row — or null when the event kind is not fill evidence. The output carries
// ONLY the allowlist: run/script ids, an HMAC case_hash, UTC time, kind and
// reason. Raw case/patient ids, names, notes, drug, prescriber, insurance,
// wrist and price never cross the boundary.

const HMAC_KEY = 'test-analytics-hmac-key';

function committed(over: Partial<CommittedEvent['event']> & { id?: string; at?: string; type?: FillEvent['type'] }): CommittedEvent {
  const id = over.id ?? 'ev_01';
  return {
    run_id: 'run-1',
    script_id: id,
    event: {
      id,
      case_id: 'rx_001',
      at: over.at ?? '2026-09-26T10:00:00.000Z',
      actor: 'doctor',
      type: over.type ?? 'prescribed',
      status_text: null,
      reject_code: null,
      note: 'note must not leak',
      reason: null,
      fix: null,
      amount_usd: null,
      wrist: null,
      side: 'practice',
      ...over,
    } as FillEvent & { at: string },
  };
}

function hashFor(runId: string, caseId: string): string {
  return createHmac('sha256', HMAC_KEY).update(`${runId}:${caseId}`).digest('hex');
}

describe('projectEvent — kind selection', () => {
  it('projects a prescribed event', () => {
    const result = projectEvent(committed({}), HMAC_KEY);
    expect(result).toEqual({
      run_id: 'run-1',
      script_id: 'ev_01',
      case_hash: hashFor('run-1', 'rx_001'),
      at: '2026-09-26T10:00:00.000Z',
      kind: 'prescribed',
      reason: null,
    } satisfies MetricEvent);
  });

  it('projects a validated reason_classified event', () => {
    const result = projectEvent(committed({ id: 'ev_05', type: 'reason_classified', reason: 'DECLINED_AT_PRICE' }), HMAC_KEY);
    expect(result?.kind).toBe('reason');
    expect(result?.reason).toBe('DECLINED_AT_PRICE');
  });

  it('projects an explicit dispensed event as fill evidence', () => {
    const result = projectEvent(committed({ id: 'ev_11', type: 'dispensed' }), HMAC_KEY);
    expect(result?.kind).toBe('dispensed');
  });

  it('ignores acknowledgment, started, recovered and partner-side events as fill evidence', () => {
    for (const type of ['copay_card_used', 'started', 'recovered'] as FillEvent['type'][]) {
      expect(projectEvent(committed({ type }), HMAC_KEY)).toBeNull();
    }
  });

  it('rejects a reason_classified event whose reason is not in the allowlist', () => {
    expect(projectEvent(committed({ type: 'reason_classified', reason: null }), HMAC_KEY)).toBeNull();
  });
});

describe('projectEvent — validation', () => {
  it('rejects numeric replay offsets instead of treating them as timestamps', () => {
    expect(projectEvent(committed({ at: 20 as unknown as string }), HMAC_KEY)).toBeNull();
  });

  it('rejects invalid dates', () => {
    expect(projectEvent(committed({ at: 'not-a-date' }), HMAC_KEY)).toBeNull();
  });

  it('rejects timestamps without timezone evidence', () => {
    expect(projectEvent(committed({ at: '2026-09-26T10:00:00' }), HMAC_KEY)).toBeNull();
    expect(projectEvent(committed({ at: '2026-09-26' }), HMAC_KEY)).toBeNull();
  });

  it('accepts a timezone-bearing ISO timestamp and canonicalizes to UTC', () => {
    const result = projectEvent(committed({ at: '2026-09-26T06:00:00-04:00' }), HMAC_KEY);
    expect(result?.at).toBe('2026-09-26T10:00:00.000Z');
  });

  it('rejects empty run/script ids and an empty HMAC key', () => {
    const base = committed({});
    expect(projectEvent({ ...base, run_id: '' }, HMAC_KEY)).toBeNull();
    expect(projectEvent({ ...base, script_id: '' }, HMAC_KEY)).toBeNull();
    expect(projectEvent(base, '')).toBeNull();
  });
});

describe('projectEvent — privacy boundary', () => {
  it('never leaks input fields into the output', () => {
    const result = projectEvent(committed({ note: 'secret note', wrist: 'Maria: Otezla', amount_usd: 410 }), HMAC_KEY);
    const serialized = JSON.stringify(result);
    expect(serialized).not.toContain('rx_001');
    expect(serialized).not.toContain('secret note');
    expect(serialized).not.toContain('Maria');
    expect(serialized).not.toContain('410');
  });

  it('derives the same case_hash for the same (run, case) and different hashes across runs', () => {
    const a = projectEvent(committed({}), HMAC_KEY);
    const b = projectEvent(committed({ id: 'ev_02', type: 'dispensed' }), HMAC_KEY);
    const otherRun = projectEvent({ ...committed({}), run_id: 'run-2' }, HMAC_KEY);
    expect(a?.case_hash).toBe(b?.case_hash);
    expect(a?.case_hash).not.toBe(otherRun?.case_hash);
  });
});