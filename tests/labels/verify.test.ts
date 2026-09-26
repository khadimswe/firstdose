import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import type { Label } from '@/components/data/types';
import { extractSections, SECTION_TITLES } from '@/lib/server/labels/extract';
import { verifyLabel, type LabelProvenance } from '@/lib/server/labels/verify';

const bytes = readFileSync('data/labels/drug_otezla/source.xml');
const raw = JSON.parse(readFileSync('data/labels/drug_otezla/provenance.json', 'utf8'));
const rxnorm = JSON.parse(readFileSync('data/labels/drug_otezla/rxnorm.json', 'utf8'));
const hash = (value: string | Uint8Array) => createHash('sha256').update(value).digest('hex');
const context = { rxnorm, expected: { drug_id: 'drug_otezla', setid: 'f6b1f516-4972-4d82-bced-113e47b41cc5', brand: 'Otezla', ingredient: 'apremilast', strength: '30 mg', form: 'TABLET, FILM COATED', labeler: 'Amgen', rxnorm_form: 'Oral Tablet' } };
function candidate() {
  const sections: Label['sections'] = extractSections(bytes.toString('utf8')).map(result => {
    if (result.status === 'present') return result.section;
    if (result.status === 'absent' && result.loinc === '34066-1') return { loinc: result.loinc, title: SECTION_TITLES[result.loinc], text: null };
    throw new Error('Invalid test source');
  });
  const label: Label = { drug_id: raw.drug_id, setid: raw.setid, fetched_at: raw.fetched_at, byte_exact: true, sections };
  const provenance = { ...raw, source_sha256: hash(bytes), extraction_method: 'spl-section-text-v1', section_sha256: Object.fromEntries(sections.map(s => [s.loinc, s.text === null ? null : hash(s.text)])) } as LabelProvenance;
  return { label, provenance };
}

describe('complete label evidence verification', () => {
  it('accepts full extracted sections with complete source and identity evidence', () => {
    const { label, provenance } = candidate();
    expect(verifyLabel(label, bytes, provenance, context)).toEqual({ ok: true, errors: [] });
  });

  it.each(['extra', 'reversed', 'missing', 'text', 'title', 'null', 'unverified'])('rejects altered saved label: %s', mutation => {
    const { label, provenance } = candidate();
    if (mutation === 'extra') label.sections.push({ loinc: '99999-9', title: 'fabricated', text: 'fabricated' });
    if (mutation === 'reversed') label.sections.reverse();
    if (mutation === 'missing') label.sections.pop();
    if (mutation === 'text') label.sections[1].text += 'X';
    if (mutation === 'title') label.sections[1].title = 'fabricated';
    if (mutation === 'null') label.sections[1].text = null;
    if (mutation === 'unverified') label.byte_exact = false;
    expect(verifyLabel(label, bytes, provenance, context).ok).toBe(false);
  });

  it.each(['setid', 'document_id', 'version', 'effective_time', 'rxcui', 'rxnorm_name', 'rxnorm_tty', 'source_url', 'extraction_method'])('rejects altered provenance: %s', field => {
    const { label, provenance } = candidate();
    const changed = { ...provenance, [field]: 'fabricated' };
    if (field === 'setid') label.setid = 'fabricated';
    expect(verifyLabel(label, bytes, changed as LabelProvenance, context).ok).toBe(false);
  });

  it.each(['missing', 'null', 'wrong', 'extra'])('rejects incomplete or forged section hashes: %s', mutation => {
    const { label, provenance } = candidate();
    if (mutation === 'missing') delete provenance.section_sha256['34067-9'];
    if (mutation === 'null') provenance.section_sha256['34067-9'] = null;
    if (mutation === 'wrong') provenance.section_sha256['34067-9'] = '0'.repeat(64);
    if (mutation === 'extra') provenance.section_sha256['99999-9'] = null;
    expect(verifyLabel(label, bytes, provenance, context).ok).toBe(false);
  });

  it('rejects changed source bytes and malformed evidence without throwing', () => {
    const { label, provenance } = candidate();
    expect(verifyLabel(label, Buffer.concat([bytes, Buffer.from(' ')]), provenance, context).ok).toBe(false);
    expect(verifyLabel(label, bytes, provenance, { ...context, rxnorm: {} }).ok).toBe(false);
    expect(verifyLabel(null as unknown as Label, bytes, provenance, context).ok).toBe(false);
  });

  it('verifies the actual saved artifact rather than regenerating its displayed text', () => {
    const label = JSON.parse(readFileSync('data/labels/drug_otezla/label.json', 'utf8'));
    const provenance = JSON.parse(readFileSync('data/labels/drug_otezla/provenance.json', 'utf8'));
    const result = verifyLabel(label, bytes, provenance, context);
    expect(result.errors).toEqual([]);
    expect(result.ok).toBe(true);
  });
});
