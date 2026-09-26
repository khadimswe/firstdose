import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

import type { Label } from '@/components/data/types';
import { extractSections } from '@/lib/server/labels/extract';
import type { LabelIdentity } from '@/lib/server/labels/identity';
import { verifyLabel, type LabelProvenance } from '@/lib/server/labels/verify';

// Verification must prove the whole chain: saved XML bytes -> identity ->
// per-section hashes -> each displayed text byte-equal to a fresh extraction.
// Any mutation (one text character, a section code, raw source bytes, an all-
// empty label) must fail verification, and an empty label can never pass a
// vacuous check.

const SECTION_CODES = ['34066-1', '34067-9', '43685-7', '34068-7'] as const;

const XML = `<?xml version="1.0" encoding="UTF-8"?>
<document xmlns="urn:hl7-org:v3">
  <id root="doc-1"/>
  <setId root="set-1"/>
  <versionNumber value="1"/>
  <effectiveTime value="20260902"/>
  <component><structuredBody><component>
    <section>
      <code code="34067-9"/>
      <title>T</title>
      <text><paragraph>Indicated for plaque psoriasis.</paragraph></text>
    </section>
    <section>
      <code code="43685-7"/>
      <title>T</title>
      <text><paragraph>Monitor depression.</paragraph></text>
    </section>
    <section>
      <code code="34068-7"/>
      <title>T</title>
      <text><paragraph>30 mg twice daily.</paragraph></text>
    </section>
  </component></structuredBody></component>
</document>`;

function identity(): LabelIdentity {
  return {
    drug_id: 'drug_test',
    rxcui: '123456',
    rxnorm_name: 'test 30 MG Oral Tablet [Test]',
    rxnorm_tty: 'SBD',
    setid: 'set-1',
    document_id: 'doc-1',
    version: '1',
    effective_time: '20260902',
    source_url: 'https://example.invalid/spls/set-1.xml',
    fetched_at: '2026-09-26T00:00:00.000Z',
    source_sha256: sha256(XML),
  };
}
void identity;

function sha256(value: string): string {
  return createHash('sha256').update(value, 'utf8').digest('hex');
}

function labelFromXml(xml: string, over: Partial<Label> = {}): Label {
  const results = extractSections(xml);
  const sections: Label['sections'] = results
    .filter((r): r is Extract<typeof r, { status: 'present' }> => r.status === 'present')
    .map((r) => ({ ...r.section }));
  const boxed = results.find((r) => 'loinc' in r && r.loinc === '34066-1' && r.status === 'absent');
  if (boxed !== undefined) {
    sections.push({ loinc: '34066-1', title: 'BOXED WARNING', text: null });
  }
  return {
    drug_id: 'drug_test',
    setid: 'set-1',
    fetched_at: '2026-09-26T00:00:00.000Z',
    byte_exact: true,
    sections: sections.sort((a, b) => SECTION_CODES.indexOf(a.loinc as (typeof SECTION_CODES)[number]) - SECTION_CODES.indexOf(b.loinc as (typeof SECTION_CODES)[number])),
    ...over,
  };
}

function provenance(over: Partial<LabelProvenance> = {}): LabelProvenance {
  return {
    drug_id: 'drug_test',
    rxcui: '123456',
    rxnorm_name: 'test 30 MG Oral Tablet [Test]',
    rxnorm_tty: 'SBD',
    setid: 'set-1',
    document_id: 'doc-1',
    version: '1',
    effective_time: '20260902',
    source_url: 'https://example.invalid/spls/set-1.xml',
    fetched_at: '2026-09-26T00:00:00.000Z',
    source_sha256: sha256(XML),
    extraction_method: 'spl-section-text-v1',
    section_sha256: {},
    ...over,
  };
}

const XML_BYTES = new TextEncoder().encode(XML);

describe('verifyLabel', () => {
  it('accepts a label whose sections byte-match a fresh extraction of the saved XML', () => {
    const result = verifyLabel(labelFromXml(XML), XML_BYTES, provenance());
    expect(result.ok).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it('rejects when one displayed text character is altered', () => {
    const mutated = labelFromXml(XML);
    const section = mutated.sections.find((s) => s.loinc === '34067-9');
    if (section === undefined || section.text === null) throw new Error('setup');
    section.text = section.text.replace('plaque', 'plaquE');
    const result = verifyLabel(mutated, XML_BYTES, provenance());
    expect(result.ok).toBe(false);
    expect(result.errors.some((e) => /34067-9/.test(e))).toBe(true);
  });

  it('rejects when a section code is swapped between sections', () => {
    const mutated = labelFromXml(XML);
    const a = mutated.sections.find((s) => s.loinc === '34067-9');
    if (a === undefined) throw new Error('setup');
    a.loinc = '34068-7';
    const result = verifyLabel(mutated, XML_BYTES, provenance());
    expect(result.ok).toBe(false);
  });

  it('rejects when raw source bytes differ from the provenance hash', () => {
    const tampered = XML.replace('plaque psoriasis', 'different content');
    const result = verifyLabel(labelFromXml(XML), new TextEncoder().encode(tampered), provenance());
    expect(result.ok).toBe(false);
    expect(result.errors.some((e) => /hash/i.test(e))).toBe(true);
  });

  it('rejects an all-empty label (a vacuous every() must never pass)', () => {
    const empty: Label = {
      drug_id: 'drug_test',
      setid: 'set-1',
      fetched_at: '2026-09-26T00:00:00.000Z',
      byte_exact: true,
      sections: [],
    };
    const result = verifyLabel(empty, XML_BYTES, provenance());
    expect(result.ok).toBe(false);
    expect(result.errors.some((e) => /missing|empty/i.test(e))).toBe(true);
  });

  it('rejects when identity fields disagree with the provenance record', () => {
    const result = verifyLabel(labelFromXml(XML, { setid: 'other-set' }), XML_BYTES, provenance());
    expect(result.ok).toBe(false);
    expect(result.errors.some((e) => /setid/i.test(e))).toBe(true);
  });

  it('rejects a null mandatory section but allows an absent boxed warning', () => {
    const nullMandatory = labelFromXml(XML);
    const s = nullMandatory.sections.find((x) => x.loinc === '34068-7');
    if (s === undefined) throw new Error('setup');
    s.text = null;
    const bad = verifyLabel(nullMandatory, XML_BYTES, provenance());
    expect(bad.ok).toBe(false);

    // Otezla-style document: no 34066-1 section anywhere; null boxed warning is correct.
    const result = verifyLabel(labelFromXml(XML), XML_BYTES, provenance());
    expect(result.ok).toBe(true);
  });

  it('rejects byte_exact=false claims: an unverified label must never verify true', () => {
    const result = verifyLabel(labelFromXml(XML, { byte_exact: false }), XML_BYTES, provenance());
    expect(result.ok).toBe(false);
  });

  it('verifies the committed Otezla artifact end-to-end', () => {
    const xml = readFileSync('data/labels/drug_otezla/source.xml', 'utf8');
    const identityJson = JSON.parse(readFileSync('data/labels/drug_otezla/provenance.json', 'utf8')) as LabelIdentity;
    const results = extractSections(xml);
    const sections: Label['sections'] = [];
    for (const r of results) {
      if (r.status === 'present') {
        sections.push({ loinc: r.section.loinc, title: r.section.title, text: r.section.text });
      } else if (r.status === 'absent' && r.loinc === '34066-1') {
        sections.push({ loinc: r.loinc, title: 'BOXED WARNING', text: null });
      }
    }
    const label: Label = {
      drug_id: 'drug_otezla',
      setid: identityJson.setid,
      fetched_at: identityJson.fetched_at,
      byte_exact: true,
      sections,
    };
    const bytes = new TextEncoder().encode(xml);
    const prov: LabelProvenance = {
      ...identityJson,
      extraction_method: 'spl-section-text-v1',
      section_sha256: {},
    };
    const result = verifyLabel(label, bytes, prov);
    if (!result.ok) console.error(result.errors);
    expect(result.ok).toBe(true);
  });
});