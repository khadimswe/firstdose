"use client";

// The one hook every screen reads data through.
import { useMemo, useSyncExternalStore } from "react";

import { CATALOG, SCRIPT } from "./catalog";
import { accessSummary, beats, canActOn, deriveCases } from "./derive";
import { DATA_MODE, REQUESTED_MODE, type DataMode } from "./mode";
import { getServerSnapshot, getSnapshot, setFired, subscribe } from "./store";
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

if (REQUESTED_MODE === "supabase" && typeof window !== "undefined") {
  console.warn(
    "NEXT_PUBLIC_DATA_SOURCE=supabase, but lib/realtime.ts isn't wired yet. Running on mock data.",
  );
}

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

export type EventsApi = {
  mode: DataMode;
  /** Every event in mock/events.json. Only /sim should need this. */
  script: FillEvent[];
  beats: Beat[];
  /** Events that have happened so far, in script order. */
  fired: FillEvent[];
  firedIds: ReadonlySet<string>;
  cases: CaseView[];
  catalog: Catalog;
  access: AccessSummary;
  /** /sim only: fire these script events. */
  fire: (ids: string[]) => Promise<void>;
  /** A screen button (prescribe, handoff, fix, use_card) for one case. */
  act: (action: ScreenAction, caseId: string) => Promise<void>;
  /** True when act(action, caseId) has something left to do. */
  canAct: (action: ScreenAction, caseId: string) => boolean;
  reset: () => Promise<void>;
};

export function useEvents(): EventsApi {
  const ids = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  return useMemo(() => {
    const firedIds = new Set(ids);
    const fired = SCRIPT.filter((e) => firedIds.has(e.id));
    const cases = deriveCases(CATALOG, fired);
    return {
      mode: DATA_MODE,
      script: SCRIPT,
      beats: BEATS,
      fired,
      firedIds,
      cases,
      catalog: CATALOG,
      access: accessSummary(fired),
      fire,
      act,
      canAct: (action, caseId) => {
        const c = cases.find((x) => x.id === caseId);
        return c !== undefined && canActOn(action, c);
      },
      reset,
    };
  }, [ids]);
}
