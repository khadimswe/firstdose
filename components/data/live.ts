// Live source: fill_events from Vinh's lib/realtime.ts (an EventSource), read
// with useSyncExternalStore. Loaded lazily so mock builds never run his module.
//
// Realtime is insert-only, so a reset from another device can't be seen as an
// event. The list is re-synced from load() when the tab becomes visible and
// every RESYNC_MS, which also drops rows that were deleted.
//
// Failures never throw into a screen. They become `error`, which the error
// banner shows: sync errors clear on the next good load(); action errors clear
// on the next good action or when dismissed.
import { CATALOG } from "./catalog";
import { atSeconds, canActOn, deriveCases } from "./derive";
import type { AccessSummary, EventSource, FillEvent, ScreenAction } from "./types";

const RESYNC_MS = 15_000;
const ACCESS_DEBOUNCE_MS = 500;
const EMPTY: readonly FillEvent[] = [];

export type LiveError = { kind: "sync" | "action"; message: string } | null;

let events: readonly FillEvent[] = EMPTY;
/** Null until the summary endpoint answers; the hook then derives it from `events`. */
let access: AccessSummary | null = null;
let error: LiveError = null;
let started = false;
let accessTimer: ReturnType<typeof setTimeout> | undefined;
const listeners = new Set<() => void>();
/** `${action}:${caseId}` of commands still waiting for their response. */
const inFlight = new Set<string>();

let sourcePromise: Promise<EventSource> | null = null;
function source() {
  sourcePromise ??= import("@/lib/realtime").then((m) => m.default as EventSource);
  return sourcePromise;
}

function emit() {
  for (const listener of listeners) listener();
}

function describe(err: unknown) {
  return err instanceof Error ? err.message : String(err);
}

function setError(next: LiveError) {
  error = next;
  emit();
}

function clearError(kind: "sync" | "action") {
  if (error?.kind === kind) setError(null);
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
      // Until the summary endpoint exists, /access shows totals derived from the
      // live events instead. Not worth a banner on every screen.
      console.warn("FirstDose: accessSummary() failed; using totals from live events", err);
    }
  }, ACCESS_DEBOUNCE_MS);
}

async function resync() {
  try {
    events = sorted(await (await source()).load());
    clearError("sync");
    emit();
    refreshAccess();
  } catch (err) {
    setError({ kind: "sync", message: describe(err) });
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
  source()
    .then((s) => s.subscribe(add))
    .catch((err) => setError({ kind: "sync", message: describe(err) }));
  void resync();
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") void resync();
  });
  setInterval(() => void resync(), RESYNC_MS);
}

/** Runs a command; a failure becomes a visible action error instead of a rejection. */
async function command(run: () => Promise<void>) {
  try {
    await run();
    clearError("action");
  } catch (err) {
    setError({ kind: "action", message: describe(err) });
  }
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

export function getLiveError() {
  start();
  return error;
}

export function dismissLiveError() {
  setError(null);
}

export async function liveAct(action: ScreenAction, caseId: string) {
  // Same guard as the button, checked at tap time; the route guards again. A
  // second tap while the first request is out does nothing, so a double tap
  // can't produce a server 409 on screen.
  const key = `${action}:${caseId}`;
  if (inFlight.has(key)) return;
  const c = deriveCases(CATALOG, [...events]).find((x) => x.id === caseId);
  if (!c || !canActOn(action, c)) return;
  inFlight.add(key);
  try {
    await command(async () => (await source()).act(action, c.rx, c.fix));
  } finally {
    inFlight.delete(key);
  }
}

export async function liveFire(ids: string[]) {
  await command(async () => (await source()).fire(ids));
}

export async function liveReset() {
  await command(async () => {
    await (await source()).reset();
    events = EMPTY;
    access = null;
    emit();
  });
}
