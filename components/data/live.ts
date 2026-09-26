// Live source: fill_events from Vihn's lib/realtime.ts (an EventSource), read
// with useSyncExternalStore. Loaded lazily so mock builds never run his module.
//
// Realtime is insert-only, so a reset from another device can't be seen as an
// event. The list is re-synced from load() when the tab becomes visible and
// every RESYNC_MS, which also drops rows that were deleted.
import { CATALOG } from "./catalog";
import { atSeconds, canActOn, deriveCases } from "./derive";
import type { AccessSummary, EventSource, FillEvent, ScreenAction } from "./types";

const RESYNC_MS = 15_000;
const ACCESS_DEBOUNCE_MS = 500;
const EMPTY: readonly FillEvent[] = [];
const NO_ACCESS: AccessSummary = { recovered: 0, median_ttff_seconds: null, reason_tally: {} };

let events: readonly FillEvent[] = EMPTY;
let access: AccessSummary = NO_ACCESS;
let started = false;
let accessTimer: ReturnType<typeof setTimeout> | undefined;
const listeners = new Set<() => void>();

let sourcePromise: Promise<EventSource> | null = null;
function source() {
  sourcePromise ??= import("@/lib/realtime").then((m) => m.default as EventSource);
  return sourcePromise;
}

function emit() {
  for (const listener of listeners) listener();
}

function sorted(list: readonly FillEvent[]) {
  return [...list].sort((a, b) => atSeconds(a.at) - atSeconds(b.at));
}

function refreshAccess() {
  clearTimeout(accessTimer);
  accessTimer = setTimeout(async () => {
    try {
      access = await (await source()).accessSummary();
      emit();
    } catch (err) {
      console.error("FirstDose: accessSummary() failed", err);
    }
  }, ACCESS_DEBOUNCE_MS);
}

async function resync() {
  try {
    events = sorted(await (await source()).load());
    emit();
    refreshAccess();
  } catch (err) {
    console.error("FirstDose: load() failed", err);
  }
}

function add(e: FillEvent) {
  if (events.some((x) => x.id === e.id)) return;
  events = sorted([...events, e]);
  emit();
  refreshAccess();
}

function start() {
  if (started || typeof window === "undefined") return;
  started = true;
  void source().then((s) => s.subscribe(add));
  void resync();
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") void resync();
  });
  setInterval(() => void resync(), RESYNC_MS);
}

export function subscribeLive(listener: () => void) {
  start();
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getLiveEvents() {
  start();
  return events;
}

export function getLiveAccess() {
  start();
  return access;
}

export async function liveAct(action: ScreenAction, caseId: string) {
  // Same guard as the button, checked at tap time; the route guards again.
  const c = deriveCases(CATALOG, [...events]).find((x) => x.id === caseId);
  if (!c || !canActOn(action, c)) return;
  await (await source()).act(action, c.rx, c.fix);
}

export async function liveFire(ids: string[]) {
  await (await source()).fire(ids);
}

export async function liveReset() {
  await (await source()).reset();
  events = EMPTY;
  access = NO_ACCESS;
  emit();
}
