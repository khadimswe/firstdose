import type { Label } from '@/components/data/types';
import { jsonHash, verifyLabel, type LabelProvenance, type VerificationContext } from './verify';

export type VerificationReceipt = {
  verification_version: 1;
  label_sha256: string;
  provenance_sha256: string;
  rxnorm_sha256: string;
  source_sha256: string;
};

/** A receipt can only be generated after the complete saved-source chain passes. */
export function createVerificationReceipt(label: Label, bytes: Uint8Array, provenance: LabelProvenance, context: VerificationContext): VerificationReceipt {
  const result = verifyLabel(label, bytes, provenance, context);
  if (!result.ok) throw new Error(`Label verification failed: ${result.errors.join('; ')}`);
  return { verification_version: 1, label_sha256: jsonHash(label), provenance_sha256: jsonHash(provenance),
    rxnorm_sha256: jsonHash(context.rxnorm), source_sha256: provenance.source_sha256 };
}

/** Runtime integrity only. The mandatory prebuild verifier independently checks saved XML. */
export function receiptMatches(label: Label, provenance: LabelProvenance, rxnorm: unknown, value: unknown): boolean {
  if (!value || typeof value !== 'object') return false;
  const receipt = value as VerificationReceipt;
  return label.byte_exact === true && provenance.extraction_method === 'spl-section-text-v1'
    && receipt.verification_version === 1 && receipt.label_sha256 === jsonHash(label)
    && receipt.provenance_sha256 === jsonHash(provenance) && receipt.rxnorm_sha256 === jsonHash(rxnorm)
    && /^[a-f0-9]{64}$/.test(receipt.source_sha256) && receipt.source_sha256 === provenance.source_sha256;
}
