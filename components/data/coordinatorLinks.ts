// Pure helpers for Vinh's persisted coordinator links (#19, GET/POST /api/coordinator).
// The server knows one fictional pair: coord_demo ↔ prescriber_demo. On screen,
// prescriber_demo is whoever prescribes the live (non-seeded) cases; nothing
// here hard-codes a prescriber's name.
import { isWeekCase } from "./catalog";
import type { CaseView } from "./types";

export const COORDINATOR_ID = "coord_demo";
export const PRESCRIBER_ID = "prescriber_demo";

export type LinkAction = "invite" | "request" | "approve" | "assign";
export type LinkStatus = "none" | "pending" | "linked";

export type CoordinatorEvent = {
  id: string;
  type: "coordinator_invited" | "coordinator_link_requested" | "coordinator_linked" | "coordinator_assigned";
  coordinator_id: string;
  prescriber_id: string;
  case_id: string | null;
  actor: "doctor" | "coordinator";
  at: string;
};

export type CoordinatorSnapshot = {
  run_id: string;
  revision: number;
  events: CoordinatorEvent[];
  links: { coordinator_id: string; prescriber_id: string; status: "pending" | "linked" }[];
  cases: { case_id: string; coordinator_id: string | null }[];
};

const RUN_ID = /^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i;
const record = (v: unknown): v is Record<string, unknown> => !!v && typeof v === "object" && !Array.isArray(v);

/** Validates a /api/coordinator response. Throws on anything unexpected rather than guessing. */
export function parseCoordinatorSnapshot(value: unknown): CoordinatorSnapshot {
  const ok =
    record(value) &&
    typeof value.run_id === "string" &&
    RUN_ID.test(value.run_id) &&
    Number.isSafeInteger(value.revision) &&
    Number(value.revision) >= 0 &&
    Array.isArray(value.events) &&
    value.events.every((e) => record(e) && typeof e.id === "string" && typeof e.type === "string" && typeof e.at === "string") &&
    Array.isArray(value.links) &&
    value.links.every(
      (l) =>
        record(l) &&
        typeof l.coordinator_id === "string" &&
        typeof l.prescriber_id === "string" &&
        (l.status === "pending" || l.status === "linked"),
    ) &&
    Array.isArray(value.cases) &&
    value.cases.every((c) => record(c) && typeof c.case_id === "string");
  if (!ok) throw new Error("invalid_coordinator_snapshot");
  return value as CoordinatorSnapshot;
}

/** The server's link status for the demo pair. No snapshot yet reads as "none". */
export function serverLinkStatus(snapshot: CoordinatorSnapshot | null): LinkStatus {
  const link = snapshot?.links.find((l) => l.coordinator_id === COORDINATOR_ID && l.prescriber_id === PRESCRIBER_ID);
  return link?.status ?? "none";
}

/** When the prescriber approved (ms), from the server's coordinator_linked event. */
export function linkedAt(snapshot: CoordinatorSnapshot | null): number | null {
  const event = snapshot?.events.find((e) => e.type === "coordinator_linked" && e.prescriber_id === PRESCRIBER_ID);
  const ms = event ? Date.parse(event.at) : NaN;
  return Number.isFinite(ms) ? ms : null;
}

/** Whether the server has already assigned this case to the coordinator. */
export function isAssigned(snapshot: CoordinatorSnapshot | null, caseId: string): boolean {
  return snapshot?.cases.some((c) => c.case_id === caseId && c.coordinator_id === COORDINATOR_ID) ?? false;
}

/** What the approve tap still has to write before the handoff. Idempotent: an approved link needs nothing. */
export function approvalSteps(status: LinkStatus): ("request" | "approve")[] {
  if (status === "linked") return [];
  if (status === "pending") return ["approve"];
  return ["request", "approve"];
}

/** The prescriber that prescriber_demo stands for: the one on the live (non-seeded) cases. */
export function interactivePrescriber(cases: CaseView[]): string | null {
  return cases.find((c) => !isWeekCase(c.id))?.rx.prescriber_label ?? null;
}

/**
 * Run fencing for snapshots. A reset starts a new run: accept it and retire the
 * old one, so a late response from the old run can never overwrite the new
 * state. Within a run, never go back to an older revision.
 */
export type SnapshotFence = { current: CoordinatorSnapshot | null; retired: ReadonlySet<string> };

export function acceptSnapshot(
  fence: SnapshotFence,
  next: CoordinatorSnapshot,
): { accepted: boolean; fence: SnapshotFence } {
  if (fence.retired.has(next.run_id)) return { accepted: false, fence };
  const current = fence.current;
  if (!current) return { accepted: true, fence: { current: next, retired: fence.retired } };
  if (next.run_id !== current.run_id) {
    return { accepted: true, fence: { current: next, retired: new Set([...fence.retired, current.run_id]) } };
  }
  if (next.revision < current.revision) return { accepted: false, fence };
  return { accepted: true, fence: { current: next, retired: fence.retired } };
}
