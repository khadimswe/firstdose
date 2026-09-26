"use client";

// The one hook every screen reads data through.
import { useMemo, useSyncExternalStore } from "react";

import { ALL_EVENTS, CATALOG, SCRIPT, WEEK_EVENT_IDS } from "./catalog";
import { accessSummary, beats, canActOn, deriveCases } from "./derive";
import {
  dismissLiveError,
  getLiveAccess,
  getLiveAccessError,
  getLiveError,
  getLiveEvents,
  getLivePending,
  getLiveReady,
  liveAct,
  liveFire,
  liveReset,
  liveSeedWeek,
  subscribeLive,
  type LiveError,
} from "./live";
import { DATA_MODE, type DataMode } from "./mode";
import { canFireLive, liveBeats } from "./simulator";
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

// Lookups use ALL_EVENTS so the seeded week's action templates resolve too.
function nextEvent(firedIds: ReadonlySet<string>, caseId: string, type: EventType) {
  return ALL_EVENTS.find(
    (e) => e.case_id === caseId && e.type === type && !firedIds.has(e.id),
  );
}

async function fire(ids: string[]) {
  const all = new Set([...getSnapshot(), ...ids]);
  setFired(ALL_EVENTS.filter((e) => all.has(e.id)).map((e) => e.id));
}

// Mock "Seed the week" (6.1): the prepared history lands before demo time zero.
async function seedWeek() {
  const ids = new Set(getSnapshot());
  if (WEEK_EVENT_IDS.some((id) => ids.has(id))) return;
  await fire([...WEEK_EVENT_IDS]);
}

// On mock, each screen button fires the beats holding the same events its live
// API route writes. Patient acknowledgment must not fire the pharmacy beat.
const ACTION_EVENTS: Record<ScreenAction, EventType[]> = {
  prescribe: ["prescribed"],
  handoff: ["handoff"],
  fix: ["fix_sent"],
  use_card: ["copay_card_used"],
};

function currentCase(caseId: string) {
  const ids = new Set(getSnapshot());
  const fired = ALL_EVENTS.filter((e) => ids.has(e.id));
  return deriveCases(CATALOG, fired).find((c) => c.id === caseId);
}

async function act(action: ScreenAction, caseId: string) {
  // Same guard the button uses, checked again at tap time: a double tap is a no-op.
  const c = currentCase(caseId);
  if (!c || !canActOn(action, c)) return;
  for (const type of ACTION_EVENTS[action]) {
    const next = nextEvent(new Set(getSnapshot()), caseId, type);
    if (!next) return;
    // Seeded cases have single action templates, not scripted beats.
    const beat = BEATS.find((b) => b.events.some((e) => e.id === next.id));
    await fire(action === "use_card" || !beat ? [next.id] : beat.events.map((e) => e.id));
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
    cachedEvents = ALL_EVENTS.filter((e) => set.has(e.id));
    cachedIds = ids;
  }
  return cachedEvents;
}

const NO_EVENTS: readonly FillEvent[] = [];
const getNoEvents = () => NO_EVENTS;
const getNoAccess = (): AccessSummary | null => null;
const getNoAccessError = (): string | null => null;
const getReady = () => true;
const getNotReady = () => false;
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
      accessError: getLiveAccessError,
      ready: getLiveReady,
      error: getLiveError,
      pending: getLivePending,
      dismissError: dismissLiveError,
      override: getServerOverride,
      fire: liveFire,
      act: liveAct,
      reset: liveReset,
      seedWeek: liveSeedWeek,
    }
  : {
      subscribe,
      events: getMockEvents,
      access: getNoAccess,
      accessError: getNoAccessError,
      ready: getReady,
      error: getNoError,
      pending: getNoPending,
      dismissError: noop,
      override: getOverride,
      fire,
      act,
      reset,
      seedWeek,
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
  accessSource: "mock" | "practice" | "tiger";
  accessError: string | null;
  ready: boolean;
  busy: boolean;
  canFire: (ids: string[]) => boolean;
  /** /sim only: fire these script events. */
  fire: (ids: string[]) => Promise<void>;
  /** A screen button (prescribe, handoff, fix, use_card) for one case. */
  act: (action: ScreenAction, caseId: string) => Promise<void>;
  /** True when act(action, caseId) has something left to do. */
  canAct: (action: ScreenAction, caseId: string) => boolean;
  reset: () => Promise<void>;
  /** /sim only: add the prepared fictional week (6.1) to an empty run. */
  seedWeek: () => Promise<void>;
  /** True when the run has no seeded week yet and nothing else is in flight. */
  canSeed: boolean;
  /** Live only: why live data isn't updating (`sync`) and the last failed command (`action`). Mock never fails. */
  error: LiveError;
  dismissError: () => void;
};

export function useEvents(): EventsApi {
  const events = useSyncExternalStore(SOURCE.subscribe, SOURCE.events, getNoEvents);
  const liveAccess = useSyncExternalStore(SOURCE.subscribe, SOURCE.access, getNoAccess);
  const accessError = useSyncExternalStore(SOURCE.subscribe, SOURCE.accessError, getNoAccessError);
  const ready = useSyncExternalStore(SOURCE.subscribe, SOURCE.ready, getNotReady);
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
      beats: LIVE ? liveBeats(SCRIPT) : BEATS,
      fired,
      firedIds,
      cases,
      catalog: CATALOG,
      access: liveAccess ?? accessSummary(fired),
      accessSource: LIVE ? (liveAccess ? "tiger" : "practice") : "mock",
      accessError,
      ready,
      busy: pending.size > 0,
      canFire: (ids) => ready && pending.size === 0 && (!LIVE || canFireLive(ids, firedIds)),
      fire: SOURCE.fire,
      act: SOURCE.act,
      canAct: (action, caseId) => {
        // Live: a command already sent for this case stays disabled until its event arrives.
        if (!ready || pending.has("reset") || pending.has(`${action}:${caseId}`)) return false;
        const c = cases.find((x) => x.id === caseId);
        return c !== undefined && canActOn(action, c);
      },
      reset: SOURCE.reset,
      seedWeek: SOURCE.seedWeek,
      canSeed:
        ready && pending.size === 0 && override === null && !WEEK_EVENT_IDS.some((id) => firedIds.has(id)),
      error,
      dismissError: SOURCE.dismissError,
    };
  }, [events, liveAccess, accessError, ready, override, error, pending]);
}
