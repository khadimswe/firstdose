// Deem's external-store seam, backed by the adapter's authoritative run lifecycle.
import { CATALOG } from "./catalog";
import { canActOn, deriveCases } from "./derive";
import type { AccessSummary, FillEvent, ScreenAction } from "./types";
import type { PollingEventSource } from "@/lib/realtime";

export type LiveError = { sync: string | null; action: string | null; loginPath: string | null } | null;
const EMPTY: readonly FillEvent[] = [];
const NO_PENDING: ReadonlySet<string> = new Set();

export function createLiveStore(options: { source: () => Promise<PollingEventSource> }) {
  let events: readonly FillEvent[] = EMPTY;
  let access: AccessSummary | null = null;
  let accessError: string | null = null;
  let ready = false;
  let generation = 0;
  let lifecycle = 0;
  let summaryVersion = 0;
  let needsSummary = false;
  let summaryRetryAt = 0;
  let source: PollingEventSource | undefined;
  let unsubscribe: (() => void) | undefined;
  let summaryTimer: ReturnType<typeof setTimeout> | undefined;
  let retryTimer: ReturnType<typeof setTimeout> | undefined;
  let syncError: string | null = null;
  let actionError: string | null = null;
  let loginPath: string | null = null;
  let error: LiveError = null;
  let pending: ReadonlySet<string> = NO_PENDING;
  const listeners = new Set<() => void>();
  const emit = () => { for (const listener of listeners) listener(); };

  function updateErrors() {
    const next = syncError || actionError ? { sync: syncError, action: actionError, loginPath } : null;
    if (next?.sync !== error?.sync || next?.action !== error?.action || next?.loginPath !== error?.loginPath) error = next;
  }
  function describe(value: unknown) {
    const e = value as { status?: number; code?: string } | undefined;
    if (e?.status === 401) { loginPath = "/api/demo-login"; return "Sign in to the demo to continue."; }
    if (e?.code === "stale_run") return "The demo was reset. Check the new run before trying again.";
    return value instanceof Error ? value.message : "The request could not be completed.";
  }
  function refreshAccess() {
    if (!needsSummary || !source || !listeners.size || Date.now() < summaryRetryAt) return;
    needsSummary = false;
    clearTimeout(summaryTimer);
    const epoch = generation;
    const version = ++summaryVersion;
    summaryTimer = setTimeout(async () => {
      try {
        const next = await source!.accessSummary();
        if (epoch !== generation || version !== summaryVersion || !listeners.size) return;
        access = next; accessError = null;
      } catch {
        if (epoch !== generation || version !== summaryVersion || !listeners.size) return;
        access = null; accessError = "Tiger analytics unavailable. Showing practice event counts.";
        needsSummary = true; summaryRetryAt = Date.now() + 15_000;
      }
      emit();
    }, 500);
  }
  function changedRun() {
    generation++;
    summaryVersion++;
    clearTimeout(summaryTimer);
    events = EMPTY; access = null; accessError = null; pending = NO_PENDING;
    ready = false; actionError = null; needsSummary = true;
    summaryRetryAt = 0;
    updateErrors(); emit();
  }
  async function start() {
    const life = ++lifecycle;
    const active = () => life === lifecycle && listeners.size > 0;
    try {
      const next = await options.source();
      if (!active()) return;
      source = next;
      unsubscribe = next.subscribe(event => {
        if (!active() || events.some(e => e.id === event.id)) return;
        // The adapter emits committed sequence order; never sort/replay fixture time.
        events = [...events, event]; access = null; needsSummary = true;
        summaryRetryAt = 0;
        emit();
      }, () => {
        if (active()) changedRun();
      }, failure => {
        if (!active()) return;
        ready = false; syncError = describe(failure); updateErrors(); emit();
      }, () => {
        if (!active()) return;
        ready = true; syncError = null; loginPath = null; updateErrors();
        refreshAccess(); emit();
      });
    } catch (failure) {
      if (!active()) return;
      ready = false; syncError = describe(failure); updateErrors(); emit();
      retryTimer = setTimeout(() => { if (active()) void start(); }, 1_500);
    }
  }
  async function command(key: string, run: (source: PollingEventSource) => Promise<void>) {
    if (!ready || !source || pending.has(key) || pending.has("reset")) return;
    const epoch = generation;
    pending = new Set([...pending, key]); emit();
    try {
      await run(source);
      if (epoch === generation) actionError = null;
    } catch (failure) {
      // A stale click must be visible, but cannot repopulate any old-run state.
      if (epoch === generation || (failure as { code?: string })?.code === "stale_run") actionError = describe(failure);
    } finally {
      if (epoch === generation) pending = new Set([...pending].filter(k => k !== key));
      updateErrors(); emit();
    }
  }
  return {
    subscribe(listener: () => void) {
      listeners.add(listener);
      if (listeners.size === 1) void start();
      return () => {
        listeners.delete(listener);
        if (!listeners.size) {
          lifecycle++; generation++; summaryVersion++;
          unsubscribe?.(); unsubscribe = undefined;
          clearTimeout(summaryTimer); clearTimeout(retryTimer);
          ready = false; pending = NO_PENDING;
        }
      };
    },
    events: () => events,
    access: () => access,
    accessError: () => accessError,
    error: () => error,
    pending: () => pending,
    ready: () => ready,
    dismissError() { actionError = null; updateErrors(); emit(); },
    async act(action: ScreenAction, caseId: string) {
      const c = deriveCases(CATALOG, [...events]).find(row => row.id === caseId);
      if (!c || !canActOn(action, c)) return;
      await command(`${action}:${caseId}`, source => source.act(action, c.rx, c.fix));
    },
    fire: (ids: string[]) => command("fire", source => source.fire(ids)),
    reset: () => command("reset", source => source.reset()),
  };
}

const store = createLiveStore({ source: async () => (await import("@/lib/realtime")).default });
export const subscribeLive = store.subscribe;
export const getLiveEvents = store.events;
export const getLiveAccess = store.access;
export const getLiveAccessError = store.accessError;
export const getLiveError = store.error;
export const getLivePending = store.pending;
export const getLiveReady = store.ready;
export const dismissLiveError = store.dismissError;
export const liveAct = store.act;
export const liveFire = store.fire;
export const liveReset = store.reset;
