"use client";

import { useSyncExternalStore } from "react";
import { CATALOG, isWeekCase } from "./catalog";
import { isLinked } from "./links";
import { DATA_MODE } from "./mode";
import { createCoordinatorLiveStore, EMPTY_COORDINATOR, type CoordinatorState } from "./coordinator-live";
import type { CaseView } from "./types";

export const DEMO_PRESCRIBER = CATALOG.cases.find(row => !isWeekCase(row.id))!.prescriber_label;
const live = DATA_MODE === "supabase";
const sharedSource = () => import("@/lib/realtime").then(module => module.default);
export const coordinatorLive = createCoordinatorLiveStore({ monitor: onRun => {
  let disposed = false; let stop: (() => void) | undefined;
  void sharedSource().then(source => { if (!disposed) stop = source.subscribe(() => {}, onRun); }).catch(() => {});
  const refresh = () => { void coordinatorLive.refresh(); };
  window.addEventListener("online", refresh); window.addEventListener("focus", refresh);
  return () => { disposed = true; stop?.(); window.removeEventListener("online", refresh); window.removeEventListener("focus", refresh); };
} });
const empty = () => EMPTY_COORDINATOR;
const noopSubscribe = () => () => {};

/** Live never consults local approvals or infers a link from a handoff. */
export function coordinatorLinked(prescriber: string, cases: CaseView[], approved: Record<string, number>, state: CoordinatorState, isLive: boolean) {
  if (!isLive) return isLinked(prescriber, cases, approved);
  const owned = cases.filter(row => row.rx.prescriber_label === prescriber);
  if (owned.length && owned.every(row => isWeekCase(row.id))) return true; // Prepared background prescriber, not the demo API identity.
  return prescriber === DEMO_PRESCRIBER && state.ready && state.snapshot?.links[0]?.status === "linked";
}

export function useCoordinator() {
  const state = useSyncExternalStore(live ? coordinatorLive.subscribe : noopSubscribe, live ? coordinatorLive.getSnapshot : empty, empty);
  return { ...state, live, refresh: coordinatorLive.refresh, request: () => coordinatorLive.command("request"), approve: coordinatorLive.approve,
    linked: (prescriber: string, cases: CaseView[], approved: Record<string, number>) => coordinatorLinked(prescriber, cases, approved, state, live),
    handoff: (c: CaseView) => coordinatorLive.approveAndHandoff(c.id, async runId => {
      const source = await sharedSource();
      const current = coordinatorLive.getSnapshot();
      if (!current.ready || current.snapshot?.run_id !== runId) throw new Error("The run changed. Review the new run before sending.");
      await source.act("handoff", c.rx, c.fix);
    }),
  };
}
