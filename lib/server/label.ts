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

// Fixed allowlist: request input is only ever compared against these keys,
// never interpolated into a path or URL.
const LABELS: ReadonlyMap<string, Label> = new Map<string, Label>([
  ['drug_otezla', otezla as unknown as Label],
]);

export async function getLabel(drugId: string): Promise<Label | null> {
  return LABELS.get(drugId) ?? null;
}