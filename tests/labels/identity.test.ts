import { describe, expect, it } from 'vitest';

import { selectRxConcept } from '@/lib/server/labels/identity';

// Raw responses are untrusted input: the selector must never assume the first
// concept found is the right product (starter packs, other strengths, other
// brands, relabeler rows must all be filtered out or rejected).

function rxnormResponse(conceptGroups: unknown) {
  return { drugGroup: { name: null, conceptGroup: conceptGroups } };
}

function concept(tty: string, rxcui: string, name: string) {
  return { rxcui, name, tty, language: 'ENG', suppress: 'N', umlscui: '' };
}

const EXPECTED = {
  brand: 'Otezla',
  ingredient: 'apremilast',
  strength: '30 MG',
  form: 'Oral Tablet',
};

describe('selectRxConcept', () => {
  it('selects the single SBD concept matching ingredient, strength, form and brand', () => {
    const response = rxnormResponse([
      { tty: 'BPCK', conceptProperties: [concept('BPCK', '1492748', '{4 (apremilast 10 MG Oral Tablet [Otezla]) / ... } Pack [Otezla 14-Day 10/20/30 Starter Pack]')] },
      { tty: 'SBD', conceptProperties: [
        concept('SBD', '1492738', 'apremilast 10 MG Oral Tablet [Otezla]'),
        concept('SBD', '1492746', 'apremilast 30 MG Oral Tablet [Otezla]'),
      ] },
    ]);
    expect(selectRxConcept(response, EXPECTED)).toEqual({
      rxcui: '1492746',
      name: 'apremilast 30 MG Oral Tablet [Otezla]',
      tty: 'SBD',
    });
  });

  it('rejects when no concept group exists', () => {
    expect(() => selectRxConcept(rxnormResponse([]), EXPECTED)).toThrow(/no concept|no matching/i);
  });

  it('rejects a strength mismatch (10 MG when 30 MG expected)', () => {
    const response = rxnormResponse([
      { tty: 'SBD', conceptProperties: [concept('SBD', '1492738', 'apremilast 10 MG Oral Tablet [Otezla]')] },
    ]);
    expect(() => selectRxConcept(response, EXPECTED)).toThrow(/ambiguous|no matching/i);
  });

  it('rejects a form mismatch (Extended Release when plain tablet expected)', () => {
    const response = rxnormResponse([
      { tty: 'SBD', conceptProperties: [concept('SBD', '2723452', '24HR apremilast 75 MG Extended Release Oral Tablet [Otezla]')] },
    ]);
    expect(() => selectRxConcept(response, EXPECTED)).toThrow(/ambiguous|no matching/i);
  });

  it('rejects a brand-only name match (BN) — brand alone does not identify a product', () => {
    // A BN row ("Otezla") has no strength/form to check; it must never be selected.
    const response = rxnormResponse([
      { tty: 'BN', conceptProperties: [concept('BN', '1478192', 'Otezla')] },
    ]);
    expect(() => selectRxConcept(response, EXPECTED)).toThrow(/ambiguous|no matching/i);
  });

  it('rejects multiple matching branded product concepts (ambiguous)', () => {
    const response = rxnormResponse([
      { tty: 'SBD', conceptProperties: [
        concept('SBD', '1492746', 'apremilast 30 MG Oral Tablet [Otezla]'),
        concept('SBD', '9999999', 'apremilast 30 MG Oral Tablet [Otezla] (duplicated)'),
      ] },
    ]);
    expect(() => selectRxConcept(response, EXPECTED)).toThrow(/ambiguous/i);
  });

  it('never selects a pack/starter-pack row even when the brand text matches', () => {
    const response = rxnormResponse([
      { tty: 'BPCK', conceptProperties: [concept('BPCK', '1492748', '{4 (apremilast 30 MG Oral Tablet [Otezla]) ... } Pack [Otezla 28-Day 10/20/30 Starter Pack]')] },
    ]);
    expect(() => selectRxConcept(response, EXPECTED)).toThrow(/ambiguous|no matching/i);
  });

  it('rejects malformed input: null, missing drugGroup, non-array groups, non-object properties', () => {
    expect(() => selectRxConcept(null, EXPECTED)).toThrow(/no concept|no matching/i);
    expect(() => selectRxConcept({ drugGroup: null }, EXPECTED)).toThrow(/no concept|no matching/i);
    expect(() => selectRxConcept({ drugGroup: { conceptGroup: [null, 5, 'x'] } }, EXPECTED)).toThrow(/no concept|no matching/i);
    expect(() => selectRxConcept({ drugGroup: { conceptGroup: [{ tty: 'SBD', conceptProperties: [null] }] } }, EXPECTED)).toThrow(/no concept|no matching/i);
  });
});