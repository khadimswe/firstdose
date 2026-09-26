// Pure analytics projection (task 2.3 / C1).
//
// projectEvent turns one committed workflow event into a pseudonymous metric
// row, or null. Fill evidence is only: an authoritative prescription, a
// validated reason classification, or an independent pharmacy dispensing.
// Patient acknowledgment, started/recovered milestones and partner-side
// events are never fill evidence. The output is an explicit allowlist: no raw
// case/patient ids, names, notes, drug, prescriber, insurance, wrist or price
// ever cross the boundary; the case identity survives only as an HMAC hash.

import { createHmac } from 'node:crypto';

import type { FillEvent, ReasonKey } from '@/components/data/types';
import reasons from '@/mock/reasons.json';

const REASON_KEYS = new Set<string>(Object.keys(reasons.reasons));

export type CommittedEvent = {
  run_id: string;
  script_id: string;
  /** `at` is the committed ISO timestamp, never a mock offset. */
  event: FillEvent & { at: string };
};

export type MetricEvent = {
  run_id: string;
  script_id: string;
  case_hash: string;
  /** Canonical UTC ISO. */
  at: string;
  kind: 'prescribed' | 'reason' | 'dispensed';
  reason: ReasonKey | null;
};

/** Same identity with different content is a conflict, not a second event. */
export function metricEventConflict(a: MetricEvent, b: MetricEvent): boolean {
  return a.run_id === b.run_id && a.script_id === b.script_id
    && (a.at !== b.at || a.kind !== b.kind || a.case_hash !== b.case_hash || a.reason !== b.reason);
}

function canonicalizeTime(value: string): string | null {
  // A timezone offset or Z must be present; bare local dates are ambiguous.
  if (!/(\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:?\d{2}))$/.test(value)) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
}

/**
 * HMAC-SHA256 of `run_id + ':' + case_id` with the server analytics key.
 * Pseudonymous internal data, not an anonymous partner export.
 */
export function caseHash(runId: string, caseId: string, hmacKey: string): string {
  return createHmac('sha256', hmacKey).update(`${runId}:${caseId}`).digest('hex');
}

export function projectEvent(input: CommittedEvent, hmacKey: string): MetricEvent | null {
  const { run_id: runId, script_id: scriptId, event } = input;
  if (runId.length === 0 || scriptId.length === 0 || hmacKey.length === 0) return null;

  let kind: MetricEvent['kind'];
  let reason: ReasonKey | null = null;
  switch (event.type) {
    case 'prescribed':
      kind = 'prescribed';
      break;
    case 'reason_classified':
      // Only a validated allowlisted reason is a metric; an unclassified
      // case stays out of the reason tally.
      if (typeof event.reason !== 'string' || !REASON_KEYS.has(event.reason)) return null;
      kind = 'reason';
      reason = event.reason as ReasonKey;
      break;
    case 'dispensed':
      kind = 'dispensed';
      break;
    default:
      // copay_card_used/started/recovered/... are not fill evidence.
      return null;
  }

  const at = canonicalizeTime(event.at);
  if (at === null) return null;

  // Explicit allowlist: never spread the input event into the metric row.
  return {
    run_id: runId,
    script_id: scriptId,
    case_hash: caseHash(runId, event.case_id, hmacKey),
    at,
    kind,
    reason,
  };
}