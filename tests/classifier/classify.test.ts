import { describe, expect, it, vi } from 'vitest';

import { makeClassifier, type ClassifierTransport } from '@/lib/server/classify';

// makeClassifier wraps an injected transport with the production contract:
// a default 4,000 ms deadline, abort of the underlying request on timeout,
// blank or overlength input rejected without a call, UNKNOWN mapped to null,
// and never a fix, drug suggestion or advice in the result. Tests use a short
// explicit timeout and a transport that settles on abort.

const VALID_NOTE = 'pt came in, saw 410.00 OOP on HDHP, said she would think about it. copay card not presented.';

function transportReturning(raw: string): ClassifierTransport {
  return async () => raw;
}

describe('makeClassifier with an injected transport', () => {
  it('returns the parsed reason for a valid reply', async () => {
    const classify = makeClassifier(transportReturning('{"reason":"DECLINED_AT_PRICE"}'));
    expect(await classify(VALID_NOTE)).toBe('DECLINED_AT_PRICE');
  });

  it('maps the UNKNOWN sentinel to null', async () => {
    const classify = makeClassifier(transportReturning('{"reason":"UNKNOWN"}'));
    expect(await classify(VALID_NOTE)).toBeNull();
  });

  it('returns null when the transport throws', async () => {
    const failing: ClassifierTransport = async () => {
      throw new Error('provider unavailable');
    };
    const classify = makeClassifier(failing);
    expect(await classify(VALID_NOTE)).toBeNull();
  });

  it('returns null for a malformed reply', async () => {
    const classify = makeClassifier(transportReturning('PA_REQUIRED, probably'));
    expect(await classify(VALID_NOTE)).toBeNull();
  });

  it('aborts the underlying request on timeout and returns null', async () => {
    let observedSignal: AbortSignal | null = null;
    const slow: ClassifierTransport = (_note, signal) =>
      new Promise<string>((_resolve, reject) => {
        observedSignal = signal ?? null;
        signal?.addEventListener('abort', () => reject(new Error('aborted')));
      });
    const classify = makeClassifier(slow, 25);
    expect(await classify(VALID_NOTE)).toBeNull();
    expect((observedSignal as AbortSignal | null)?.aborted).toBe(true);
  });

  it('returns null for blank input without calling the transport', async () => {
    const spy = vi.fn(async () => '{"reason":"PA_REQUIRED"}');
    const classify = makeClassifier(spy as unknown as ClassifierTransport);
    expect(await classify('')).toBeNull();
    expect(await classify('   \n  ')).toBeNull();
    expect(spy).not.toHaveBeenCalled();
  });

  it('returns null for input over 140 Unicode code points without truncating', async () => {
    const spy = vi.fn(async () => '{"reason":"PA_REQUIRED"}');
    const classify = makeClassifier(spy as unknown as ClassifierTransport);
    const overlength = 'x'.repeat(141);
    expect(await classify(overlength)).toBeNull();
    expect(spy).not.toHaveBeenCalled();
    // Exactly 140 is still allowed through.
    expect(await classify('x'.repeat(140))).toBe('PA_REQUIRED');
  });

  it('never returns a fix, label, drug suggestion or advice', async () => {
    for (const raw of [
      '{"reason":"PA_REQUIRED","fix":"BRIDGE_SAMPLE"}',
      '{"reason":"PA_REQUIRED","drug":"Otezla"}',
      '{"reason":"PA_REQUIRED","advice":"Call the pharmacy"}',
    ]) {
      const classify = makeClassifier(transportReturning(raw));
      expect(await classify(VALID_NOTE)).toBeNull();
    }
  });
});