"use client";

// The one hook every screen reads data through.
import { useMemo, useSyncExternalStore } from "react";

import { CATALOG, SCRIPT } from "./catalog";
import { accessSummary, beats, canActOn, deriveCases } from "./derive";
import {
  dismissLiveError,
  getLiveAccess,
  getLiveError,
  getLiveEvents,
  getLivePending,
  liveAct,
  liveFire,
  liveReset,
  subscribeLive,
  type LiveError,
} from "./live";
import { DATA_MODE, type DataMode } from "./mode";
import {
  getOverride,
  getServerOverride,
  getSnapshot,
  setFired,
  subscribe,
  type Override,
} from "./store";
import type {
  AccessSummary,
  Beat,
  Catalog,
  CaseView,
  EventType,
  FillEvent,
  ScreenAction,
} from "./types";

const BEATS = beats(SCRIPT);
const LIVE = DATA_MODE === "supabase";

function nextEvent(firedIds: ReadonlySet<string>, caseId: string, type: EventType) {
  return SCRIPT.find(
    (e) => e.case_id === caseId && e.type === type && !firedIds.has(e.id),
  );
}

async function fire(ids: string[]) {
  const all = new Set([...getSnapshot(), ...ids]);
  setFired(SCRIPT.filter((e) => all.has(e.id)).map((e) => e.id));
}

// On mock, each screen button fires the beats holding the same events its live
// API route writes (docs/architecture.md). use_card also runs the claim re-run.
const ACTION_EVENTS: Record<ScreenAction, EventType[]> = {
  prescribe: ["prescribed"],
  handoff: ["handoff"],
  fix: ["fix_sent"],
  use_card: ["copay_card_used", "started"],
};

function currentCase(caseId: string) {
  const ids = new Set(getSnapshot());
  const fired = SCRIPT.filter((e) => ids.has(e.id));
  return deriveCases(CATALOG, fired).find((c) => c.id === caseId);
}

async function act(action: ScreenAction, caseId: string) {
  // Same guard the button uses, checked again at tap time: a double tap is a no-op.
  const c = currentCase(caseId);
  if (!c || !canActOn(action, c)) return;
  for (const type of ACTION_EVENTS[action]) {
    const next = nextEvent(new Set(getSnapshot()), caseId, type);
    if (!next) return;
    const beat = BEATS.find((b) => b.events.some((e) => e.id === next.id))!;
    await fire(beat.events.map((e) => e.id));
  }
}

async function reset() {
  setFired([]);
}

// Mock: fired ids → events, cached per snapshot so useSyncExternalStore sees a stable value.
let cachedIds: readonly string[] | null = null;
let cachedEvents: readonly FillEvent[] = [];
function getMockEvents(): readonly FillEvent[] {
  const ids = getSnapshot();
  if (ids !== cachedIds) {
    const set = new Set(ids);
    cachedEvents = SCRIPT.filter((e) => set.has(e.id));
    cachedIds = ids;
  }
  return cachedEvents;
}

const NO_EVENTS: readonly FillEvent[] = [];
const getNoEvents = () => NO_EVENTS;
const getNoAccess = (): AccessSummary | null => null;
const getNoError = (): LiveError => null;
const NO_PENDING: ReadonlySet<string> = new Set();
const getNoPending = () => NO_PENDING;
const noop = () => {};

// One source per build: NEXT_PUBLIC_DATA_SOURCE is inlined at build time.
const SOURCE = LIVE
  ? {
      subscribe: subscribeLive,
      events: getLiveEvents,
      access: getLiveAccess,
      error: getLiveError,
      pending: getLivePending,
      dismissError: dismissLiveError,
      override: getServerOverride,
      fire: liveFire,
      act: liveAct,
      reset: liveReset,
    }
  : {
      subscribe,
      events: getMockEvents,
      access: getNoAccess,
      error: getNoError,
      pending: getNoPending,
      dismissError: noop,
      override: getOverride,
      fire,
      act,
      reset,
    };

export type EventsApi = {
  mode: DataMode;
  /** This tab is frozen (?upto=) or replaying (?replay=1), and ignores other tabs. Mock only. */
  override: Override;
  /** Every event in mock/events.json. Only /sim should need this. */
  script: FillEvent[];
  beats: Beat[];
  /** Events that have happened so far, oldest first. */
  fired: FillEvent[];
  firedIds: ReadonlySet<string>;
  cases: CaseView[];
  catalog: Catalog;
  /** Live: from Tiger via /api/access/summary. Mock: worked out from `fired`. */
  access: AccessSummary;
  /** /sim only: fire these script events. */
  fire: (ids: string[]) => Promise<void>;
  /** A screen button (prescribe, handoff, fix, use_card) for one case. */
  act: (action: ScreenAction, caseId: string) => Promise<void>;
  /** True when act(action, caseId) has something left to do. */
  canAct: (action: ScreenAction, caseId: string) => boolean;
  reset: () => Promise<void>;
  /** Live only: why live data isn't updating (`sync`) and the last failed command (`action`). Mock never fails. */
  error: LiveError;
  dismissError: () => void;
};

export function useEvents(): EventsApi {
  const events = useSyncExternalStore(SOURCE.subscribe, SOURCE.events, getNoEvents);
  const liveAccess = useSyncExternalStore(SOURCE.subscribe, SOURCE.access, getNoAccess);
  const override = useSyncExternalStore(SOURCE.subscribe, SOURCE.override, getServerOverride);
  const error = useSyncExternalStore(SOURCE.subscribe, SOURCE.error, getNoError);
  const pending = useSyncExternalStore(SOURCE.subscribe, SOURCE.pending, getNoPending);

  return useMemo(() => {
    const fired = [...events];
    const firedIds = new Set(fired.map((e) => e.id));
    const cases = deriveCases(CATALOG, fired);
    return {
      mode: DATA_MODE,
      override,
      script: SCRIPT,
      beats: BEATS,
      fired,
      firedIds,
      cases,
      catalog: CATALOG,
      access: liveAccess ?? accessSummary(fired),
      fire: SOURCE.fire,
      act: SOURCE.act,
      canAct: (action, caseId) => {
        // Live: a command already sent for this case stays disabled until its event arrives.
        if (pending.has(`${action}:${caseId}`)) return false;
        const c = cases.find((x) => x.id === caseId);
        return c !== undefined && canActOn(action, c);
      },
      reset: SOURCE.reset,
      error,
      dismissError: SOURCE.dismissError,
    };
  }, [events, liveAccess, override, error, pending]);
}
