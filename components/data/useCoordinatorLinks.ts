"use client";

// Who the coordinator works for, on every device (C7, 6.12).
// Live: the server's persisted links via GET/POST /api/coordinator (#19), polled
// like the fill-event store, with run fencing. Mock: the local approvals plus
// handoff-derived links, exactly as before (components/data/links.ts).
import { useSyncExternalStore } from "react";

import {
  acceptSnapshot,
  approvalSteps,
  COORDINATOR_ID,
  interactivePrescriber,
  isAssigned,
  linkedAt,
  parseCoordinatorSnapshot,
  PRESCRIBER_ID,
  serverLinkStatus,
  type CoordinatorSnapshot,
  type LinkAction,
  type LinkStatus,
  type SnapshotFence,
} from "./coordinatorLinks";
import { isLinked } from "./links";
import { local, useLocal } from "./local";
import { DATA_MODE } from "./mode";
import { useEvents } from "./useEvents";

const LIVE = DATA_MODE === "supabase";
const POLL_MS = 2_000;

type LinksState = {
  snapshot: CoordinatorSnapshot | null;
  /** Why the last read or write failed; cleared by the next good snapshot. */
  error: string | null;
  loginPath: string | null;
  pending: ReadonlySet<string>;
};

const NO_PENDING: ReadonlySet<string> = new Set();
const INITIAL: LinksState = { snapshot: null, error: null, loginPath: null, pending: NO_PENDING };

let state: LinksState = INITIAL;
let fence: SnapshotFence = { current: null, retired: new Set() };
let inflight: Promise<void> | null = null;
let timer: ReturnType<typeof setInterval> | undefined;
const listeners = new Set<() => void>();

function set(next: Partial<LinksState>) {
  state = { ...state, ...next };
  for (const listener of listeners) listener();
}

type HttpFailure = Error & { status?: number; code?: string };

async function call(init?: RequestInit): Promise<CoordinatorSnapshot> {
  const response = await fetch("/api/coordinator", { credentials: "same-origin", cache: "no-store", ...init });
  let body: unknown = null;
  try {
    body = await response.json();
  } catch {
    // Non-JSON failures still report their status below.
  }
  if (!response.ok) {
    const code = body && typeof body === "object" && "error" in body ? String((body as { error: unknown }).error) : "unavailable";
    throw Object.assign(new Error(code), { status: response.status, code }) as HttpFailure;
  }
  return parseCoordinatorSnapshot(body);
}

function accept(snapshot: CoordinatorSnapshot) {
  const result = acceptSnapshot(fence, snapshot);
  if (!result.accepted) return;
  fence = result.fence;
  set({ snapshot, error: null, loginPath: null });
}

function fail(error: unknown) {
  const status = (error as HttpFailure)?.status;
  set({
    error: status === 401 ? "Sign in to the demo to continue." : "Couldn't reach the coordinator link service. Try again.",
    loginPath: status === 401 ? "/api/demo-login" : null,
  });
}

function refresh(): Promise<void> {
  if (inflight) return inflight;
  inflight = (async () => {
    try {
      accept(await call());
    } catch (error) {
      fail(error);
    } finally {
      inflight = null;
    }
  })();
  return inflight;
}

function onVisible() {
  if (document.visibilityState === "visible") void refresh();
}

function subscribeLinks(listener: () => void) {
  listeners.add(listener);
  if (listeners.size === 1) {
    void refresh();
    timer = setInterval(() => void refresh(), POLL_MS);
    document.addEventListener("visibilitychange", onVisible);
  }
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
    }
  };
}

const getLinks = () => state;
const getInitial = () => INITIAL;
const subscribeNothing = () => () => {};

/** One write. Uses the latest snapshot's run; a stale run (409) refreshes and is never replayed. */
async function command(action: LinkAction, caseId?: string): Promise<boolean> {
  const key = caseId ? `${action}:${caseId}` : action;
  if (state.pending.has(key)) return false;
  if (!fence.current) await refresh();
  const run = fence.current?.run_id;
  if (!run) return false;
  set({ pending: new Set([...state.pending, key]) });
  try {
    const snapshot = await call({
      method: "POST",
      headers: { "Content-Type": "application/json", "X-FirstDose-Run": run },
      body: JSON.stringify({
        action,
        coordinator_id: COORDINATOR_ID,
        prescriber_id: PRESCRIBER_ID,
        ...(caseId ? { case_id: caseId } : {}),
      }),
    });
    accept(snapshot);
    return true;
  } catch (error) {
    fail(error);
    if ((error as HttpFailure)?.status === 409) void refresh();
    return false;
  } finally {
    set({ pending: new Set([...state.pending].filter((k) => k !== key)) });
  }
}

export type CoordinatorLinks = {
  live: boolean;
  /** The prescriber the demo link stands for (from the live cases), or null. */
  prescriber: string | null;
  /** Link status for the demo pair: none / pending / linked. */
  status: LinkStatus;
  /** Whether the coordinator works for this prescriber. */
  linked: (prescriber: string) => boolean;
  /** When the prescriber approved (ms), if known. */
  since: (prescriber: string) => number | null;
  /** Request (if needed) and approve the coordinator. Resolves false if a write failed. */
  approve: () => Promise<boolean>;
  /** Attribute a prescribed case to the coordinator. Live only; idempotent. */
  assign: (caseId: string) => Promise<boolean>;
  pending: boolean;
  error: string | null;
  loginPath: string | null;
};

export function useCoordinatorLinks(): CoordinatorLinks {
  const { cases } = useEvents();
  const { approved } = useLocal();
  const links = useSyncExternalStore(LIVE ? subscribeLinks : subscribeNothing, LIVE ? getLinks : getInitial, getInitial);
  const prescriber = interactivePrescriber(cases);

  if (!LIVE) {
    return {
      live: false,
      prescriber,
      status: prescriber && isLinked(prescriber, cases, approved) ? "linked" : "none",
      linked: (p) => isLinked(p, cases, approved),
      since: (p) => approved[p] ?? null,
      approve: async () => {
        if (prescriber) local.approve(prescriber);
        return true;
      },
      assign: async () => true,
      pending: false,
      error: null,
      loginPath: null,
    };
  }

  const status = serverLinkStatus(links.snapshot);
  return {
    live: true,
    prescriber,
    status,
    // Server approval is the source of truth for the demo pair; a committed
    // handoff (e.g. from the watch) still counts, so handed-off work never hides.
    linked: (p) => (p === prescriber && status === "linked") || isLinked(p, cases, {}),
    since: (p) => (p === prescriber ? linkedAt(links.snapshot) : null),
    approve: async () => {
      for (const step of approvalSteps(serverLinkStatus(state.snapshot))) {
        if (!(await command(step))) return false;
      }
      return true;
    },
    assign: async (caseId) => (isAssigned(state.snapshot, caseId) ? true : command("assign", caseId)),
    pending: links.pending.size > 0,
    error: links.error,
    loginPath: links.loginPath,
  };
}
