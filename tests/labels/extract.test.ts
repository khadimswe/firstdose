import { describe, expect, it } from 'vitest';

import { extractSections } from '@/lib/server/labels/extract';

// Extraction semantics (handoff A2):
// - text nodes in document order; `A <content>B</content> C` -> `A B C` (never reordered)
// - XML entities decoded once; CRLF -> LF; inline whitespace collapsed to one space
// - newline between paragraphs/list items/table rows; tab between table cells
// - inline tags (content/sup/sub/linkHtml) add no spaces of their own
// - section matched by its own code, not by any nested code

const SECTION_CODES = ['34066-1', '34067-9', '43685-7', '34068-7'] as const;

// SectionResult is a union: 'present' carries the loinc inside section, the
// other variants carry it at the top level.
function byLoinc(results: ReturnType<typeof extractSections>, loinc: string) {
  return results.find(
    (r) => ('section' in r && r.section.loinc === loinc) || ('loinc' in r && r.loinc === loinc),
  );
}

function splDocument(sections: string): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<document xmlns="urn:hl7-org:v3">
  <component><structuredBody><component>
${sections}
  </component></structuredBody></component>
</document>`;
}

function sectionXml(code: string, body: string): string {
  return `<section>
      <code code="${code}" codeSystem="2.16.840.1.113883.6.1" displayName="X"/>
      <title>T</title>
      <text>${body}</text>
    </section>`;
}

describe('extractSections', () => {
  it('extracts mixed content in document order: A <content>B</content> C -> A B C', () => {
    const xml = splDocument(sectionXml('34067-9', '<paragraph>A <content>B</content> C</paragraph>'));
    const results = extractSections(xml);
    const indications = byLoinc(results, '34067-9');
    expect(indications).toBeDefined();
    expect(indications && indications.status === 'present' && indications.section.text).toBe('A B C');
  });

  it('decodes XML entities exactly once', () => {
    const xml = splDocument(sectionXml('34067-9', '<paragraph>&amp; &lt; &gt; &quot;</paragraph>'));
    const results = extractSections(xml);
    const found = byLoinc(results, '34067-9');
    expect(found && found.status === 'present' && found.section.text).toBe('& < > "');
  });

  it('converts CRLF to LF and collapses inline whitespace to a single space', () => {
    const xml = splDocument(sectionXml('34067-9', '<paragraph>Col1   value\r\nCol2  value</paragraph>'));
    const results = extractSections(xml);
    const found = byLoinc(results, '34067-9');
    expect(found && found.status === 'present' && found.section.text).toBe('Col1 value\nCol2 value');
  });

  it('puts a newline between paragraphs, list items and table rows; tab between cells', () => {
    const xml = splDocument(sectionXml(
      '34068-7',
      '<paragraph>First para.</paragraph><paragraph>Second para.</paragraph>' +
        '<list><item>Item one</item><item>Item two</item></list>' +
        '<table><thead><tr><th>A</th><th>B</th></tr></thead><tbody><tr><td>1</td><td>2</td></tr></tbody></table>',
    ));
    const results = extractSections(xml);
    const found = byLoinc(results, '34068-7');
    const text = found && found.status === 'present' && found.section.text;
    expect(text).toBe(
      'First para.\nSecond para.\nItem one\nItem two\nA\tB\n1\t2',
    );
  });

  it('leaves inline emphasis tags without adding spaces: <content styleCode="italics">x</content>: rest', () => {
    const xml = splDocument(sectionXml(
      '43685-7',
      '<list><item><content styleCode="underline">Depression</content>: Weigh risks (<linkHtml href="#S5.3">5.3</linkHtml>)</item></list>',
    ));
    const results = extractSections(xml);
    const found = byLoinc(results, '43685-7');
    const text = found && found.status === 'present' && found.section.text;
    expect(text).toBe('Depression: Weigh risks (5.3)');
  });

  it('reports an absent boxed-warning section as absent, not invalid', () => {
    const xml = splDocument(sectionXml('34067-9', '<paragraph>Only indications.</paragraph>'));
    const results = extractSections(xml);
    const boxed = byLoinc(results, '34066-1');
    expect(boxed && boxed.status).toBe('absent');
  });

  it('rejects duplicate target sections as invalid (ambiguous match)', () => {
    const xml = splDocument(
      sectionXml('34067-9', '<paragraph>One</paragraph>') + sectionXml('34067-9', '<paragraph>Two</paragraph>'),
    );
    const results = extractSections(xml);
    const found = byLoinc(results, '34067-9');
    expect(found && found.status).toBe('invalid');
    expect(found && found.status === 'invalid' && /ambiguous/i.test(found.detail)).toBe(true);
  });

  it('rejects an empty mandatory section as invalid', () => {
    const xml = splDocument(sectionXml('34067-9', ''));
    const results = extractSections(xml);
    const found = byLoinc(results, '34067-9');
    expect(found && found.status).toBe('invalid');
    expect(found && found.status === 'invalid' && /empty/i.test(found.detail)).toBe(true);
  });

  it('rejects malformed XML with an invalid result for every target code', () => {
    const results = extractSections('<document><text><b>');
    expect(results.length).toBe(SECTION_CODES.length);
    for (const result of results) {
      expect(result.status).toBe('invalid');
      expect(result.status === 'invalid' && /malformed/i.test(result.detail)).toBe(true);
    }
  });

  it('extracts a real-style boxed warning with its heading', () => {
    const xml = splDocument(sectionXml(
      '34066-1',
      '<paragraph><content styleCode="bold">WARNING: SERIOUS INFECTIONS AND MALIGNANCY</content></paragraph>' +
        '<paragraph>Serious infections. Do not start.</paragraph>',
    ));
    const results = extractSections(xml);
    const boxed = byLoinc(results, '34066-1');
    const text = boxed && boxed.status === 'present' && boxed.section.text;
    expect(text).toBe('WARNING: SERIOUS INFECTIONS AND MALIGNANCY\nSerious infections. Do not start.');
  });

  it('matches the section by its own code, not a code nested inside the text', () => {
    const xml = splDocument(sectionXml(
      '43685-7',
      '<paragraph>See <linkHtml href="#x">34067-9</linkHtml> section.</paragraph>',
    ));
    const results = extractSections(xml);
    const warnings = byLoinc(results, '43685-7');
    const indications = byLoinc(results, '34067-9');
    expect(warnings && warnings.status).toBe('present');
    expect(indications && indications.status).toBe('absent');
  });

  it('reports table structure through thead/tbody rows in document order', () => {
    const xml = splDocument(sectionXml(
      '34068-7',
      '<table><caption>Table 1</caption><thead><tr><th>Day</th><th>Dose</th></tr></thead>' +
        '<tbody><tr><td>1-5</td><td>10 mg</td></tr><tr><td>6+</td><td>30 mg</td></tr></tbody></table>',
    ));
    const results = extractSections(xml);
    const found = byLoinc(results, '34068-7');
    const text = found && found.status === 'present' && found.section.text;
    expect(text).toBe('Table 1\nDay\tDose\n1-5\t10 mg\n6+\t30 mg');
  });

  it('rejects a highlights-only section instead of presenting it as the full section', () => {
    const xml = splDocument(
      `<section>
        <code code="34067-9" codeSystem="2.16.840.1.113883.6.1" displayName="X"/>
        <title>T</title>
        <excerpt><highlight><text><paragraph>Deep para.</paragraph></text></highlight></excerpt>
      </section>`,
    );
    const results = extractSections(xml);
    const found = byLoinc(results, '34067-9');
    expect(found && found.status).toBe('invalid');
  });

  it('extracts nested full subsections once and excludes the highlights excerpt', () => {
    const xml = splDocument(`<section><code code="34067-9"/>
      <excerpt><highlight><text><paragraph>Short highlight.</paragraph></text></highlight></excerpt>
      <component><section><title>1.1 Full indication</title><text><paragraph>Full narrative.</paragraph></text>
        <component><section><title>Detail</title><text><paragraph>Nested detail.</paragraph></text></section></component>
      </section></component></section>`);
    const found = byLoinc(extractSections(xml), '34067-9');
    expect(found && found.status === 'present' && found.section.text).toBe('1.1 Full indication\nFull narrative.\nDetail\nNested detail.');
  });

  it('preserves meaningful whitespace between adjacent inline elements', () => {
    const found = byLoinc(extractSections(splDocument(sectionXml('34067-9', '<paragraph><content>First</content> <content>second</content>.</paragraph>'))), '34067-9');
    expect(found && found.status === 'present' && found.section.text).toBe('First second.');
  });

  it('rejects unresolved footnote references instead of dropping them', () => {
    const found = byLoinc(extractSections(splDocument(sectionXml('34067-9', '<paragraph>Text<footnoteRef IDREF="missing"/>.</paragraph>'))), '34067-9');
    expect(found && found.status).toBe('invalid');
  });
});
