// Live source: fill_events from Vinh's lib/realtime.ts (an EventSource), read
// with useSyncExternalStore. Loaded lazily so mock builds never run his module.
//
// Realtime is insert-only, so a reset from another device can't be seen as an
// event. The list is re-synced from load() when the tab becomes visible and
// every RESYNC_MS, which also drops rows that were deleted and retries a failed
// import or subscription.
//
// Ordering rules:
// - A load() response replaces the list, but rows that arrived through Realtime
//   while that load was in flight are merged back in, so a slow snapshot can't
//   erase newer beats.
// - An older load() response that lands after a newer one is ignored.
// - reset() starts a new generation; anything still in flight from the old one
//   (loads, summaries) is dropped when it lands.
//
// Failures never throw into a screen. They become `error.sync` (load, import,
// subscribe; cleared only when that same thing succeeds) or `error.action`
// (act/fire/reset; cleared by the next good command or Dismiss).
import { CATALOG } from "./catalog";
import { atSeconds, canActOn, deriveCases } from "./derive";
import type { AccessSummary, EventSource, FillEvent, ScreenAction } from "./types";

const RESYNC_MS = 15_000;
const ACCESS_DEBOUNCE_MS = 500;
/** How long a sent command blocks a repeat while its event hasn't arrived yet. */
const PENDING_TTL_MS = 10_000;
const EMPTY: readonly FillEvent[] = [];
const NO_PENDING: ReadonlySet<string> = new Set();

export type LiveError = { sync: string | null; action: string | null } | null;

let events: readonly FillEvent[] = EMPTY;
/** Null until the summary endpoint answers; the hook then derives it from `events`. */
let access: AccessSummary | null = null;
let started = false;
let subscribed = false;
let generation = 0;
let accessTimer: ReturnType<typeof setTimeout> | undefined;
const listeners = new Set<() => void>();

// Errors, kept apart so one kind never hides or clears another.
let loadError: string | null = null;
let subscribeError: string | null = null;
let actionError: string | null = null;
let errorSnapshot: LiveError = null;

// Inserts seen while loads are in flight, so a load response can merge them back.
let insertSeq = 0;
let insertLog: { seq: number; event: FillEvent }[] = [];
const loadsInFlight = new Map<number, number>(); // load id → insertSeq when it started
let loadSeq = 0;
let appliedLoad = 0;

// Commands sent whose events haven't arrived: `${action}:${caseId}` and fired ids.
const pendingActions = new Map<string, number>(); // key → expiry (ms)
const pendingFires = new Map<string, number>(); // event id → expiry (ms)
let pendingSnapshot: ReadonlySet<string> = NO_PENDING;

let sourcePromise: Promise<EventSource> | null = null;
function source() {
  // A failed import (e.g. flaky Wi-Fi when the page opened) is retried next time.
  sourcePromise ??= import("@/lib/realtime")
    .then((m) => m.default as EventSource)
    .catch((err) => {
      sourcePromise = null;
      throw err;
    });
  return sourcePromise;
}

function emit() {
  for (const listener of listeners) listener();
}

function describe(err: unknown) {
  return err instanceof Error ? err.message : String(err);
}

function updateErrors() {
  const sync = subscribeError ?? loadError;
  const next: LiveError = sync || actionError ? { sync, action: actionError } : null;
  if (next?.sync !== errorSnapshot?.sync || next?.action !== errorSnapshot?.action) {
    errorSnapshot = next;
    emit();
  }
}

/** Sort by time; unparseable timestamps go last. Ties keep their existing order. */
function sorted(list: readonly FillEvent[]) {
  const key = (e: FillEvent) => {
    const s = atSeconds(e.at);
    return Number.isFinite(s) ? s : Number.MAX_SAFE_INTEGER;
  };
  return [...list].sort((a, b) => key(a) - key(b));
}

function sameIds(a: readonly FillEvent[], b: readonly FillEvent[]) {
  return a.length === b.length && a.every((e, i) => e.id === b[i].id);
}

/** Drops pending commands whose effect has arrived (or that expired). */
function settlePending() {
  const now = Date.now();
  const cases = deriveCases(CATALOG, [...events]);
  const ids = new Set(events.map((e) => e.id));
  for (const [key, expires] of pendingActions) {
    const [action, caseId] = key.split(":") as [ScreenAction, string];
    const c = cases.find((x) => x.id === caseId);
    if (expires <= now || !c || !canActOn(action, c)) pendingActions.delete(key);
  }
  for (const [id, expires] of pendingFires) {
    if (expires <= now || ids.has(id)) pendingFires.delete(id);
  }
  const next = new Set(pendingActions.keys());
  if (next.size !== pendingSnapshot.size || [...next].some((k) => !pendingSnapshot.has(k))) {
    pendingSnapshot = next.size ? next : NO_PENDING;
    emit();
  }
}

function setEvents(next: readonly FillEvent[]) {
  if (sameIds(next, events)) return;
  events = next;
  emit();
  settlePending();
  refreshAccess();
}

function refreshAccess() {
  clearTimeout(accessTimer);
  const gen = generation;
  accessTimer = setTimeout(async () => {
    try {
      const next = await (await source()).accessSummary();
      if (gen !== generation) return;
      if (JSON.stringify(next) === JSON.stringify(access)) return;
      access = next;
      emit();
    } catch (err) {
      // Until the summary endpoint exists, /access shows totals derived from the
      // live events instead. Not worth a banner on every screen.
      console.warn("FirstDose: accessSummary() failed; using totals from live events", err);
    }
  }, ACCESS_DEBOUNCE_MS);
}

let subscribing: Promise<void> | null = null;
/** Subscribes once; after a failure, the next resync tries again. */
function ensureSubscribed() {
  if (subscribed) return Promise.resolve();
  subscribing ??= (async () => {
    try {
      (await source()).subscribe(add);
      subscribed = true;
      subscribeError = null;
    } catch (err) {
      subscribeError = describe(err);
    } finally {
      subscribing = null;
      updateErrors();
    }
  })();
  return subscribing;
}

async function resync() {
  const gen = generation;
  const id = ++loadSeq;
  loadsInFlight.set(id, insertSeq);
  try {
    void ensureSubscribed();
    const rows = await (await source()).load();
    if (gen !== generation || id < appliedLoad) return; // reset since, or a newer load already applied
    appliedLoad = id;
    const since = loadsInFlight.get(id)!;
    const seen = new Set(rows.map((e) => e.id));
    const late = insertLog.filter((x) => x.seq > since && !seen.has(x.event.id)).map((x) => x.event);
    loadError = null;
    updateErrors();
    setEvents(sorted([...rows, ...late]));
  } catch (err) {
    loadError = describe(err);
    updateErrors();
  } finally {
    loadsInFlight.delete(id);
    const oldest = Math.min(...loadsInFlight.values());
    insertLog = loadsInFlight.size ? insertLog.filter((x) => x.seq > oldest) : [];
  }
}

function add(e: FillEvent) {
  if (events.some((x) => x.id === e.id)) return;
  insertSeq += 1;
  if (loadsInFlight.size) insertLog.push({ seq: insertSeq, event: e });
  setEvents(sorted([...events, e]));
}

function start() {
  if (started || typeof window === "undefined") return;
  started = true;
  void resync();
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") void resync();
  });
  setInterval(() => {
    void resync();
    settlePending(); // lets expired pending commands unblock their buttons
  }, RESYNC_MS);
}

/** Runs a command; a failure becomes a visible action error instead of a rejection. */
async function command(run: () => Promise<void>): Promise<boolean> {
  try {
    await run();
    actionError = null;
    updateErrors();
    return true;
  } catch (err) {
    actionError = describe(err);
    updateErrors();
    return false;
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
  return errorSnapshot;
}

/** Keys (`${action}:${caseId}`) of commands sent whose events haven't arrived yet. */
export function getLivePending() {
  start();
  return pendingSnapshot;
}

export function dismissLiveError() {
  actionError = null;
  updateErrors();
}

export async function liveAct(action: ScreenAction, caseId: string) {
  // Same guard as the button, checked at tap time; the route guards again. The
  // command stays pending until its event arrives (or PENDING_TTL_MS), so a
  // second tap in between does nothing instead of surfacing the server's 409.
  const key = `${action}:${caseId}`;
  const pendingUntil = pendingActions.get(key);
  if (pendingUntil !== undefined && pendingUntil > Date.now()) return;
  const c = deriveCases(CATALOG, [...events]).find((x) => x.id === caseId);
  if (!c || !canActOn(action, c)) return;

  pendingActions.set(key, Date.now() + PENDING_TTL_MS);
  settlePending();
  const ok = await command(async () => (await source()).act(action, c.rx, c.fix));
  if (!ok) pendingActions.delete(key);
  settlePending();
}

export async function liveFire(ids: string[]) {
  const now = Date.now();
  const have = new Set(events.map((e) => e.id));
  const todo = ids.filter((id) => !have.has(id) && !((pendingFires.get(id) ?? 0) > now));
  if (todo.length === 0) return;
  for (const id of todo) pendingFires.set(id, now + PENDING_TTL_MS);
  const ok = await command(async () => (await source()).fire(todo));
  if (!ok) for (const id of todo) pendingFires.delete(id);
}

export async function liveReset() {
  await command(async () => {
    await (await source()).reset();
    generation += 1;
    clearTimeout(accessTimer);
    insertLog = [];
    pendingActions.clear();
    pendingFires.clear();
    events = EMPTY;
    access = null;
    settlePending();
    emit();
  });
}
