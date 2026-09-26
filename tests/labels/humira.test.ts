import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import type { Label } from '@/components/data/types';
import { extractSections, SECTION_TITLES } from '@/lib/server/labels/extract';
import { assertSplIdentity, parseSplEvidence } from '@/lib/server/labels/identity';
import { verifyLabel, type LabelProvenance } from '@/lib/server/labels/verify';

// Task 1.10b: the Humira label must repeat the Otezla verification with the
// pen presentation (40 mg / 0.4 mL). Two RxNorm SBD concepts match
// "adalimumab 100 MG/ML Auto-Injector" (0.4 mL and 0.8 mL pens), so the
// selector disambiguates by volume and the SPL identity check proves the
// 40 mg / 0.4 mL presentation from the nested KIT structure. The boxed
// warning (34066-1) is present with real text — the before-visit card
// depends on it.

const bytes = readFileSync('data/labels/drug_humira/source.xml');
const raw = JSON.parse(readFileSync('data/labels/drug_humira/provenance.json', 'utf8'));
const rxnorm = JSON.parse(readFileSync('data/labels/drug_humira/rxnorm.json', 'utf8'));
const hash = (value: string | Uint8Array) => createHash('sha256').update(value).digest('hex');
const context = {
  rxnorm,
  expected: {
    drug_id: 'drug_humira',
    setid: '608d4f0d-b19f-46d3-749a-7159aa5f933d',
    brand: 'Humira',
    ingredient: 'adalimumab',
    strength: '40 mg',
    form: 'INJECTION',
    labeler: 'AbbVie',
    volume: '0.4 mL',
    rxnorm_form: 'Auto-Injector',
  },
};

function candidate() {
  const sections: Label['sections'] = extractSections(bytes.toString('utf8')).map(result => {
    if (result.status === 'present') return result.section;
    throw new Error('Invalid test source');
  });
  const label: Label = { drug_id: raw.drug_id, setid: raw.setid, fetched_at: raw.fetched_at, byte_exact: true, sections };
  const provenance = { ...raw, source_sha256: hash(bytes), extraction_method: 'spl-section-text-v1', section_sha256: Object.fromEntries(sections.map(s => [s.loinc, s.text === null ? null : hash(s.text)])) } as LabelProvenance;
  return { label, provenance };
}

describe('Humira SPL evidence (committed artifact)', () => {
  it('parses and proves the 40 mg / 0.4 mL pen presentation from the nested KIT structure', () => {
    const evidence = parseSplEvidence(bytes.toString('utf8'));
    expect(evidence.setid).toBe(context.expected.setid);
    expect(evidence.labeler).toContain('AbbVie');
    expect(() => assertSplIdentity(evidence, context.expected)).not.toThrow();
  });

  it('rejects a volume the document does not contain', () => {
    // Note: the SPL legitimately also contains a 40 mg / 0.8 mL prefilled
    // syringe, so "0.8 mL" is a valid document presentation; only a volume
    // that is absent (e.g. 0.9 mL) must fail the identity proof.
    const evidence = parseSplEvidence(bytes.toString('utf8'));
    expect(() => assertSplIdentity(evidence, { ...context.expected, volume: '0.9 mL' })).toThrow(/presentation/i);
  });

  it('extracts all four sections with the boxed warning present and real', () => {
    const results = extractSections(bytes.toString('utf8'));
    expect(results.map(r => r.status)).toEqual(['present', 'present', 'present', 'present']);
    const boxed = results[0];
    if (boxed.status !== 'present') throw new Error('boxed missing');
    expect(boxed.section.title).toBe(SECTION_TITLES['34066-1']);
    // The headline lives in the section <title> element, which the extractor
    // deliberately excludes from the rendered narrative text.
    expect(bytes.toString('utf8')).toContain('<content styleCode="bold">WARNING: SERIOUS INFECTIONS AND MALIGNANCY</content>');
    // The rendered boxed narrative is verbatim SPL text with real sentences.
    expect(boxed.section.text?.startsWith('SERIOUS INFECTIONS')).toBe(true);
    expect(boxed.section.text).toContain('Patients treated with HUMIRA are at increased risk for developing serious infections that may lead to hospitalization or death');
    expect(boxed.section.text).toContain('MALIGNANCY');
  });

  it('verifies the committed Humira artifact end-to-end', () => {
    const { label, provenance } = candidate();
    const result = verifyLabel(label, bytes, provenance, context);
    expect(result).toEqual({ ok: true, errors: [] });
  });
});