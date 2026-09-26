import { createHash } from 'node:crypto';
import type { Label } from '@/components/data/types';
import { extractSections, SECTION_CODES, SECTION_TITLES } from './extract';
import { assertSplIdentity, parseSplEvidence, selectRxConcept, type LabelIdentity, type SplExpectation } from './identity';

export type LabelProvenance = LabelIdentity & {
  extraction_method: 'spl-section-text-v1';
  section_sha256: Record<string, string | null>;
};
export type VerificationContext = {
  rxnorm: unknown;
  expected: SplExpectation & { drug_id: string; rxnorm_form: string };
};
export type VerifyResult = { ok: boolean; errors: string[] };
export const sha256Hex = (bytes: Uint8Array): string => createHash('sha256').update(bytes).digest('hex');
export const jsonHash = (value: unknown): string => sha256Hex(new TextEncoder().encode(JSON.stringify(value)));
const record = (value: unknown): value is Record<string, unknown> => !!value && typeof value === 'object' && !Array.isArray(value);

/** Verify saved display text, original bytes, recorded provenance, and independently selected identity. */
export function verifyLabel(label: Label, xmlBytes: Uint8Array, provenance: LabelProvenance, context: VerificationContext): VerifyResult {
  const errors: string[] = [];
  if (!record(label) || !Array.isArray(label.sections) || !record(provenance) || !record(provenance.section_sha256) || !context?.expected) {
    return { ok: false, errors: ['malformed label or provenance evidence'] };
  }
  if (label.byte_exact !== true) errors.push('label is not marked byte_exact');
  if (provenance.extraction_method !== 'spl-section-text-v1') errors.push('unrecognized extraction_method');
  if (sha256Hex(xmlBytes) !== provenance.source_sha256) errors.push('source hash mismatch');
  const expected = context.expected;
  if (label.drug_id !== expected.drug_id || provenance.drug_id !== expected.drug_id) errors.push('identity mismatch: drug_id');
  if (label.setid !== expected.setid || provenance.setid !== expected.setid) errors.push('identity mismatch: setid');
  if (typeof provenance.fetched_at !== 'string' || !/^\d{4}-\d{2}-\d{2}T.*Z$/.test(provenance.fetched_at) || !Number.isFinite(Date.parse(provenance.fetched_at)) || label.fetched_at !== provenance.fetched_at) errors.push('identity mismatch: fetched_at');
  if (provenance.source_url !== `https://dailymed.nlm.nih.gov/dailymed/services/v2/spls/${expected.setid}.xml`) errors.push('identity mismatch: source_url');

  let xml: string;
  try { xml = new TextDecoder('utf-8', { fatal: true }).decode(xmlBytes); }
  catch { return { ok: false, errors: [...errors, 'source is not valid UTF-8'] }; }
  try {
    const evidence = parseSplEvidence(xml);
    assertSplIdentity(evidence, expected);
    for (const key of ['setid', 'document_id', 'version', 'effective_time'] as const) {
      if (provenance[key] !== evidence[key]) errors.push(`source identity mismatch: ${key}`);
    }
    const selected = selectRxConcept(context.rxnorm, {
      brand: expected.brand, ingredient: expected.ingredient, strength: expected.strength, form: expected.rxnorm_form,
      ...(expected.volume === undefined ? {} : { volume: expected.volume }),
    });
    if (provenance.rxcui !== selected.rxcui || provenance.rxnorm_name !== selected.name || provenance.rxnorm_tty !== selected.tty) errors.push('RxNorm identity mismatch');
  } catch { errors.push('source or RxNorm product identity could not be verified'); }

  if (label.sections.length !== SECTION_CODES.length || label.sections.some((s, i) => !record(s) || s.loinc !== SECTION_CODES[i])) errors.push('section count/order mismatch');
  const keys = Object.keys(provenance.section_sha256);
  if (keys.length !== SECTION_CODES.length || SECTION_CODES.some(code => !Object.hasOwn(provenance.section_sha256, code))) errors.push('missing or extra section hashes');
  const fresh = extractSections(xml);
  for (const [index, code] of SECTION_CODES.entries()) {
    const section = label.sections[index];
    const extracted = fresh[index];
    if (!record(section) || section.loinc !== code) { errors.push(`missing or misplaced section ${code}`); continue; }
    if (section.title !== SECTION_TITLES[code]) errors.push(`section ${code} title mismatch`);
    const text = extracted.status === 'present' ? extracted.section.text : extracted.status === 'absent' && code === '34066-1' ? null : undefined;
    if (text === undefined) { errors.push(`source section ${code} is missing or invalid`); continue; }
    if (section.text !== text) errors.push(`section ${code} text does not byte-match the extracted source section`);
    const hash = text === null ? null : sha256Hex(new TextEncoder().encode(text));
    if (provenance.section_sha256[code] !== hash) errors.push(`section ${code} hash mismatch`);
  }
  return { ok: errors.length === 0, errors };
}
