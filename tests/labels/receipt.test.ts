import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { createVerificationReceipt, receiptMatches } from '@/lib/server/labels/receipt';
import { labelContext } from '@/lib/server/labels/artifacts';

const json = (name: string) => JSON.parse(readFileSync(`data/labels/drug_otezla/${name}.json`, 'utf8'));
describe('bundled artifact receipt', () => {
  it('binds every published JSON artifact and the source hash', () => {
    const label = json('label'), provenance = json('provenance'), rxnorm = json('rxnorm'), receipt = json('verification');
    expect(receiptMatches(label, provenance, rxnorm, receipt)).toBe(true);
    for (const changed of [
      [{ ...label, setid: 'changed' }, provenance, rxnorm],
      [label, { ...provenance, version: 'changed' }, rxnorm],
      [label, provenance, { changed: true }],
    ]) expect(receiptMatches(changed[0], changed[1], changed[2], receipt)).toBe(false);
    expect(receiptMatches(label, provenance, rxnorm, {})).toBe(false);
  });

  it('refuses to issue a fresh receipt for altered displayed text', () => {
    const label = json('label'); label.sections[1].text += 'X';
    expect(() => createVerificationReceipt(label, readFileSync('data/labels/drug_otezla/source.xml'), json('provenance'), labelContext('drug_otezla', json('rxnorm')))).toThrow(/verification failed/i);
  });
});
