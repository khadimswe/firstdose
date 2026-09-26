// Strict reason parser for the Gemini classifier (task 2.5 / B1).
//
// The model's reply is untrusted input. It must be a single-key JSON object
// `{"reason": <allowlisted key or "UNKNOWN">}` and nothing else. Malformed
// replies are never repaired into confident answers: any deviation returns
// null so the case stays visibly unclassified for human fallback.

import type { ReasonKey } from '@/components/data/types';
import reasons from '@/mock/reasons.json';

const ALLOWED = new Set<string>(Object.keys(reasons.reasons));
export const UNKNOWN_SENTINEL = 'UNKNOWN';

export function parseReason(raw: string): ReasonKey | null {
  if (typeof raw !== 'string' || raw.trim().length === 0) return null;
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }
  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) return null;
  const record = parsed as Record<string, unknown>;
  const keys = Object.keys(record);
  if (keys.length !== 1 || keys[0] !== 'reason') return null;
  const value = record['reason'];
  if (typeof value !== 'string') return null;
  if (value === UNKNOWN_SENTINEL) return null;
  return ALLOWED.has(value) ? (value as ReasonKey) : null;
}