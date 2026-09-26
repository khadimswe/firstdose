// Fidelity verification for cached labels (task 1.10 / A2).
//
// verifyLabel proves the whole chain for a committed artifact: the saved XML
// bytes hash to the recorded source hash, the label identity matches the
// provenance record, and every displayed section text is byte-equal to a fresh
// deterministic extraction of that section from the saved XML. A vacuous
// all-empty or all-null label must never verify, and an unverified label
// (byte_exact false) never verifies true.

import { createHash } from 'node:crypto';

import type { Label } from '@/components/data/types';
import { extractSections, SECTION_CODES } from '@/lib/server/labels/extract';
import type { LabelIdentity } from '@/lib/server/labels/identity';

export type LabelProvenance = LabelIdentity & {
  extraction_method: 'spl-section-text-v1';
  section_sha256: Record<string, string | null>;
};

export type VerifyResult = { ok: boolean; errors: string[] };

export function sha256Hex(bytes: Uint8Array): string {
  return createHash('sha256').update(bytes).digest('hex');
}

export function verifyLabel(
  label: Label,
  xmlBytes: Uint8Array,
  provenance: LabelProvenance,
): VerifyResult {
  const errors: string[] = [];

  // An unverified label must never pass verification.
  if (label.byte_exact !== true) {
    errors.push('label is not marked byte_exact');
  }

  // Saved bytes must match the recorded source hash.
  const sourceHash = sha256Hex(xmlBytes);
  if (sourceHash !== provenance.source_sha256) {
    errors.push(
      `source hash mismatch: saved bytes hash ${sourceHash} != provenance ${provenance.source_sha256}`,
    );
  }

  // Identity fields must agree with the provenance record.
  if (label.drug_id !== provenance.drug_id) errors.push('identity mismatch: drug_id');
  if (label.setid !== provenance.setid) errors.push('identity mismatch: setid');
  if (label.fetched_at !== provenance.fetched_at) errors.push('identity mismatch: fetched_at');

  const xml = new TextDecoder().decode(xmlBytes);
  const fresh = extractSections(xml);
  const freshByLoinc = new Map<string, string | null>();
  for (const result of fresh) {
    if (result.status === 'present') freshByLoinc.set(result.section.loinc, result.section.text);
    else if (result.status === 'absent') freshByLoinc.set(result.loinc, null);
    else if (result.status === 'invalid') freshByLoinc.set(result.loinc, undefined);
  }

  // Every committed section record must exist, be in order, and byte-match.
  const committed = new Map<string, string | null>();
  for (const section of label.sections) {
    if (committed.has(section.loinc)) {
      errors.push(`duplicate section ${section.loinc}`);
      continue;
    }
    committed.set(section.loinc, section.text);
  }

  for (const loinc of SECTION_CODES) {
    const displayed = committed.get(loinc);
    const freshText = freshByLoinc.get(loinc);
    if (displayed === undefined) {
      errors.push(`missing section record ${loinc}`);
      continue;
    }
    if (freshText === undefined) {
      errors.push(`source section ${loinc} is invalid in the saved XML`);
      continue;
    }
    if (displayed === null) {
      if (loinc === '34066-1' && freshText === null) continue; // verified absence
      errors.push(`section ${loinc} is null but the source has content`);
      continue;
    }
    if (freshText === null) {
      errors.push(`section ${loinc} has text but the source section is absent`);
      continue;
    }
    // Byte-equality against a fresh deterministic extraction.
    if (new TextEncoder().encode(displayed).length !== new TextEncoder().encode(freshText).length
      || displayed !== freshText) {
      errors.push(`section ${loinc} text does not byte-match the extracted source section`);
    }
  }

  // A vacuous every() must never pass: the label must actually carry content.
  const nonNullCount = label.sections.filter((s) => s.text !== null).length;
  if (nonNullCount === 0) {
    errors.push('label has no non-null section content (empty label)');
  }

  // Per-section hashes, when recorded, must match the fresh extraction.
  for (const [loinc, recorded] of Object.entries(provenance.section_sha256)) {
    if (recorded === null) continue;
    const freshText = freshByLoinc.get(loinc);
    if (typeof freshText === 'string') {
      const hash = sha256Hex(new TextEncoder().encode(freshText));
      if (hash !== recorded) errors.push(`section ${loinc} recorded hash does not match fresh extraction`);
    }
  }

  return { ok: errors.length === 0, errors };
}