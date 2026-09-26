import { describe, expect, it } from 'vitest';

import { assertSplIdentity, parseSplEvidence } from '@/lib/server/labels/identity';

// SPL documents are untrusted source bytes. Evidence extraction must find the
// document identity fields, the labeler and the manufactured products, and
// reject malformed XML, DTDs and external entities outright.

const OTEZLA_SPL = `<?xml version="1.0" encoding="UTF-8"?>
<document xmlns="urn:hl7-org:v3">
  <id root="8d1d49ca-6dc1-4580-b2d5-f69ccb4f1c8e"/>
  <effectiveTime value="20260902"/>
  <setId root="f6b1f516-4972-4d82-bced-113e47b41cc5"/>
  <versionNumber value="38"/>
  <author>
    <assignedEntity>
      <representedOrganization>
        <name>Amgen, Inc</name>
      </representedOrganization>
    </assignedEntity>
  </author>
  <component>
    <structuredBody>
      <component>
        <section>
          <code code="48780-1"/>
          <subject>
            <manufacturedProduct>
              <manufacturedProduct>
                <name>Otezla</name>
                <formCode code="C42931" displayName="TABLET, FILM COATED"/>
                <asEntityWithGeneric><genericMedicine><name>apremilast</name></genericMedicine></asEntityWithGeneric>
                <ingredient classCode="ACTIB">
                  <quantity><numerator value="30" unit="mg"/></quantity>
                  <ingredientSubstance><name>APREMILAST</name></ingredientSubstance>
                </ingredient>
              </manufacturedProduct>
            </manufacturedProduct>
          </subject>
        </section>
      </component>
    </structuredBody>
  </component>
</document>`;

const EXPECTED = {
  setid: 'f6b1f516-4972-4d82-bced-113e47b41cc5',
  brand: 'Otezla',
  ingredient: 'apremilast',
  strength: '30 mg',
  form: 'TABLET, FILM COATED',
  labeler: 'Amgen',
};

describe('parseSplEvidence', () => {
  it('extracts document id, setid, version, effective time, labeler and products', () => {
    const evidence = parseSplEvidence(OTEZLA_SPL);
    expect(evidence.document_id).toBe('8d1d49ca-6dc1-4580-b2d5-f69ccb4f1c8e');
    expect(evidence.setid).toBe('f6b1f516-4972-4d82-bced-113e47b41cc5');
    expect(evidence.version).toBe('38');
    expect(evidence.effective_time).toBe('20260902');
    expect(evidence.labeler).toBe('Amgen, Inc');
    expect(evidence.products).toContainEqual({
      brand: 'Otezla',
      generic: 'apremilast',
      form: 'TABLET, FILM COATED',
      active_ingredient: 'APREMILAST',
      strength_value: '30',
      strength_unit: 'mg',
    });
  });

  it('rejects malformed XML', () => {
    expect(() => parseSplEvidence('<document><unclosed>')).toThrow(/malformed xml/i);
  });

  it('rejects DTD declarations', () => {
    const dtd = '<!DOCTYPE document [<!ENTITY x "y">]>' + OTEZLA_SPL;
    expect(() => parseSplEvidence(dtd)).toThrow(/dtd|entity/i);
  });

  it('rejects a document missing identity fields', () => {
    const stripped = OTEZLA_SPL.replace(/<setId[^>]*\/>/, '');
    expect(() => parseSplEvidence(stripped)).toThrow(/setid/i);
  });
});

describe('assertSplIdentity', () => {
  it('accepts the Otezla document for the catalog presentation', () => {
    const evidence = parseSplEvidence(OTEZLA_SPL);
    expect(() => assertSplIdentity(evidence, EXPECTED)).not.toThrow();
  });

  it('rejects a setid mismatch', () => {
    const evidence = parseSplEvidence(OTEZLA_SPL);
    expect(() => assertSplIdentity(evidence, { ...EXPECTED, setid: '00000000-0000-0000-0000-000000000000' })).toThrow(/setid/i);
  });

  it('rejects a labeler mismatch', () => {
    const evidence = parseSplEvidence(OTEZLA_SPL);
    expect(() => assertSplIdentity(evidence, { ...EXPECTED, labeler: 'Someone Else' })).toThrow(/labeler/i);
  });

  it('rejects a document that never states the selected strength (starter-pack style)', () => {
    const evidence = parseSplEvidence(OTEZLA_SPL.replace('value="30" unit="mg"', 'value="10" unit="mg"'));
    expect(() => assertSplIdentity(evidence, EXPECTED)).toThrow(/presentation|strength|product/i);
  });

  it('rejects a document without any manufactured product', () => {
    const evidence = parseSplEvidence(OTEZLA_SPL.replace(/<subject>[\s\S]*<\/subject>/, ''));
    expect(() => assertSplIdentity(evidence, EXPECTED)).toThrow(/presentation|strength|product/i);
  });
});