import { describe, expect, it, vi } from 'vitest';

import type { CommittedEvent, MetricEvent } from '@/lib/server/analytics/project';
import { replayRun } from '@/lib/server/analytics/replay';

// replayRun reads the durable source, projects allowed events and writes the
// batch; a write failure rejects so the caller retries from the same source
// (identical immutable data then no-ops). Out-of-order input and other runs
// are handled by projection + the write seam.

const HMAC = 'test-key';

function committed(runId: string, scriptId: string, type: CommittedEvent['event']['type']): CommittedEvent {
  return {
    run_id: runId,
    script_id: scriptId,
    event: {
      id: scriptId,
      case_id: 'rx_001',
      at: '2026-09-26T10:00:00.000Z',
      actor: 'doctor',
      type,
      status_text: null,
      reject_code: null,
      note: '',
      reason: null,
      fix: null,
      amount_usd: null,
      wrist: null,
      side: 'practice',
    } as CommittedEvent['event'],
  };
}

describe('replayRun', () => {
  it('projects allowed events and writes exactly one batch', async () => {
    const source = [
      committed('run-1', 'p1', 'prescribed'),
      committed('run-1', 'd1', 'dispensed'),
      committed('run-1', 'x1', 'started'), // not fill evidence
    ];
    const writeBatch = vi.fn(async () => undefined);
    await replayRun('run-1', async () => source, writeBatch, HMAC);
    expect(writeBatch).toHaveBeenCalledTimes(1);
    const written = writeBatch.mock.calls[0]?.[0] as MetricEvent[];
    expect(written.map((e) => e.script_id)).toEqual(['p1', 'd1']);
  });

  it('rejects on write failure so the caller can retry from the source', async () => {
    const source = [committed('run-1', 'p1', 'prescribed')];
    const writeBatch = vi.fn(async () => {
      throw new Error('analytics_unavailable');
    });
    await expect(replayRun('run-1', async () => source, writeBatch, HMAC)).rejects.toThrow('analytics_unavailable');
  });

  it('a successful full-run retry then another replay leaves the summary unchanged', async () => {
    const source = [
      committed('run-1', 'p1', 'prescribed'),
      committed('run-1', 'd1', 'dispensed'),
    ];
    const writeBatch = vi.fn(async () => undefined);
    await replayRun('run-1', async () => source, writeBatch, HMAC);
    await replayRun('run-1', async () => source, writeBatch, HMAC);
    await replayRun('run-1', async () => [...source].reverse(), writeBatch, HMAC);
    expect(writeBatch).toHaveBeenCalledTimes(3);
    // The store's key ledger makes each retry a no-op; the seam must
    // guarantee identical projected CONTENT every time (order within the
    // batch is irrelevant to the (run, script) ledger).
    const canonical = (events: readonly MetricEvent[]) =>
      JSON.stringify([...events].sort((a, b) => (a.script_id < b.script_id ? -1 : 1)));
    const batches = writeBatch.mock.calls.map((call) => canonical(call[0] as readonly MetricEvent[]));
    expect(new Set(batches).size).toBe(1);
  });

  it('excludes other runs from the batch', async () => {
    const source = [
      committed('run-1', 'p1', 'prescribed'),
      committed('run-2', 'p2', 'prescribed'),
    ];
    const writeBatch = vi.fn(async () => undefined);
    await replayRun('run-1', async () => source, writeBatch, HMAC);
    const written = writeBatch.mock.calls[0]?.[0] as MetricEvent[];
    expect(written.every((e) => e.run_id === 'run-1')).toBe(true);
  });

  it('writes nothing for a run with no projectable events', async () => {
    const source = [committed('run-1', 'x1', 'started')];
    const writeBatch = vi.fn(async () => undefined);
    await replayRun('run-1', async () => source, writeBatch, HMAC);
    expect(writeBatch).not.toHaveBeenCalled();
  });
});