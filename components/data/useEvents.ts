"use client";

// The one hook every screen reads data through.
import { useMemo, useSyncExternalStore } from "react";

import { CATALOG, SCRIPT } from "./catalog";
import { accessSummary, beats, deriveCases } from "./derive";
import { DATA_MODE, REQUESTED_MODE, type DataMode } from "./mode";
import { getServerSnapshot, getSnapshot, setFired, subscribe } from "./store";
import type {
  AccessSummary,
  Beat,
  Catalog,
  CaseView,
  EventType,
  FillEvent,
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

/** Fires the whole beat holding the next unfired event of `type` for this case. */
async function fireNext(caseId: string, type: EventType) {
  const next = nextEvent(new Set(getSnapshot()), caseId, type);
  if (!next) return;
  const beat = BEATS.find((b) => b.events.some((e) => e.id === next.id))!;
  await fire(beat.events.map((e) => e.id));
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
  fire: (ids: string[]) => Promise<void>;
  fireNext: (caseId: string, type: EventType) => Promise<void>;
  /** True when fireNext(caseId, type) would fire something. */
  canFire: (caseId: string, type: EventType) => boolean;
  reset: () => Promise<void>;
};

export function useEvents(): EventsApi {
  const ids = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  return useMemo(() => {
    const firedIds = new Set(ids);
    const fired = SCRIPT.filter((e) => firedIds.has(e.id));
    return {
      mode: DATA_MODE,
      script: SCRIPT,
      beats: BEATS,
      fired,
      firedIds,
      cases: deriveCases(CATALOG, fired),
      catalog: CATALOG,
      access: accessSummary(fired),
      fire,
      fireNext,
      canFire: (caseId, type) => nextEvent(firedIds, caseId, type) !== undefined,
      reset,
    };
  }, [ids]);
}
