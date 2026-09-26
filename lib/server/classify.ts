// Reason classifier facade (task 2.5 / B1/B2).
//
// classify(note) maps a fictional pharmacy/hub note to exactly one allowlisted
// reason key, or null. It never returns a fix, drug suggestion or advice; the
// deterministic router stays the action authority. A missing key or model, a
// thrown provider error, a timeout or an unparsable reply all surface as null
// through the same lazy path — the module never throws at import/build time.

import type { ReasonKey } from '@/components/data/types';

import { parseReason } from './classifier/parse';
import type { ClassifierTransport } from './classifier/gemini';

export type { ClassifierTransport };

export function makeClassifier(
  transport: ClassifierTransport,
  timeoutMs: number = 4_000,
): (note: string) => Promise<ReasonKey | null> {
  return async (note: string): Promise<ReasonKey | null> => {
    // Reject blank and overlength notes without a provider call. More than 140
    // Unicode code points is a provider error, not a truncation opportunity.
    if (note.trim().length === 0) return null;
    if ([...note].length > 140) return null;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const raw = await transport(note, controller.signal);
      return parseReason(raw);
    } catch {
      // No retries in the interactive path; the case stays visibly unclassified.
      return null;
    } finally {
      clearTimeout(timer);
    }
  };
}

export async function classify(note: string): Promise<ReasonKey | null> {
  const { classifyWithGemini } = await import('./classifier/gemini');
  return classifyWithGemini(note);
}