// Cached label facade (task 1.10 / A3).
//
// Serves bundled, verified artifacts only. There is no runtime DailyMed
// request, no Supabase dependency and no provider key; drug ids are matched
// against a fixed allowlist (never used to build filesystem paths), and an
// unknown drug resolves to null. The route turns an unverified label into a
// 503 so the UI can keep showing its PLACEHOLDER badge instead of trusting
// stale text.

import type { Label } from '@/components/data/types';

import otezla from '@/data/labels/drug_otezla/label.json';
import provenance from '@/data/labels/drug_otezla/provenance.json';
import rxnorm from '@/data/labels/drug_otezla/rxnorm.json';
import receipt from '@/data/labels/drug_otezla/verification.json';
import { receiptMatches } from './labels/receipt';
import type { LabelProvenance } from './labels/verify';

// Fixed allowlist: request input is only ever compared against these keys,
// never interpolated into a path or URL.
const candidate = otezla as Label;
// The mandatory prebuild gate re-verifies XML and RxNorm. At runtime, only the
// immutable bundled JSON/receipt is needed; no filesystem or provider request.
const verified = receiptMatches(candidate, provenance as LabelProvenance, rxnorm, receipt);
const LABELS: ReadonlyMap<string, Label> = new Map([
  ['drug_otezla', { ...candidate, byte_exact: verified }],
]);

export async function getLabel(drugId: string): Promise<Label | null> {
  const label = LABELS.get(drugId);
  return label ? structuredClone(label) : null;
}
