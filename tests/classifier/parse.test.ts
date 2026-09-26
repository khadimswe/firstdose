import { describe, expect, it } from 'vitest';

import { parseReason } from '@/lib/server/classifier/parse';

// The model's reply is untrusted input. The parser accepts exactly one
// allowlisted reason from a strict single-key JSON object and nothing else:
// no extra fields, no prose, no fenced JSON, no invented reasons. The model
// sentinel "UNKNOWN" maps to null (insufficient evidence), and a provider
// failure also surfaces as null — the workflow stays unclassified.

describe('parseReason', () => {
  it('accepts one allowed reason and rejects extra behavior', () => {
    expect(parseReason('{"reason":"PA_REQUIRED"}')).toBe('PA_REQUIRED');
    expect(parseReason('{"reason":"UNKNOWN"}')).toBeNull();
    expect(parseReason('{"reason":"PA_REQUIRED","fix":"BRIDGE_SAMPLE"}')).toBeNull();
    expect(parseReason('{"reason":"INVENTED"}')).toBeNull();
    expect(parseReason('not JSON')).toBeNull();
  });

  it('accepts every allowlisted reason key', () => {
    for (const reason of [
      'DECLINED_AT_PRICE',
      'COPAY_NOT_APPLIED',
      'UNABLE_TO_REACH',
      'PA_REQUIRED',
      'NOT_COVERED',
      'NOT_PICKED_UP_48H',
    ]) {
      expect(parseReason(`{"reason":"${reason}"}`)).toBe(reason);
    }
  });

  it('rejects non-object JSON: arrays, null, scalars', () => {
    expect(parseReason('[]')).toBeNull();
    expect(parseReason('null')).toBeNull();
    expect(parseReason('42')).toBeNull();
    expect(parseReason('"PA_REQUIRED"')).toBeNull();
    expect(parseReason('true')).toBeNull();
  });

  it('rejects missing reason, empty strings and whitespace-only values', () => {
    expect(parseReason('{}')).toBeNull();
    expect(parseReason('{"reason":""}')).toBeNull();
    expect(parseReason('{"reason":"   "}')).toBeNull();
  });

  it('rejects non-string reason values', () => {
    expect(parseReason('{"reason":42}')).toBeNull();
    expect(parseReason('{"reason":null}')).toBeNull();
    expect(parseReason('{"reason":["PA_REQUIRED"]}')).toBeNull();
  });

  it('rejects fenced JSON and explanatory prose', () => {
    expect(parseReason('```json\n{"reason":"PA_REQUIRED"}\n```')).toBeNull();
    expect(parseReason('The reason is PA_REQUIRED.')).toBeNull();
    expect(parseReason('Based on the note, I would classify this as PA_REQUIRED because...')).toBeNull();
  });

  it('rejects additional keys even when reason itself is valid', () => {
    expect(parseReason('{"reason":"PA_REQUIRED","confidence":0.9}')).toBeNull();
    expect(parseReason('{"reason":"PA_REQUIRED","label":"Prior authorization required"}')).toBeNull();
    expect(parseReason('{"fix":"BRIDGE_SAMPLE","reason":"PA_REQUIRED"}')).toBeNull();
  });

  it('rejects empty or non-JSON input', () => {
    expect(parseReason('')).toBeNull();
    expect(parseReason('   ')).toBeNull();
    expect(parseReason(undefined as unknown as string)).toBeNull();
  });

  it('never repairs a malformed reply into a confident answer', () => {
    // A stray reason word inside broken JSON must not be extracted.
    expect(parseReason('{"reason": "PA_REQUIRED')).toBeNull();
    expect(parseReason('reason: PA_REQUIRED}')).toBeNull();
  });
});