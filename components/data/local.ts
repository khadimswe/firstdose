"use client";

// UI state that isn't an event yet: prescriber approvals made on the doctor's
// Profile tab (PLAN C7), the coordinator's contact marks (C2) and extra link
// requests. Kept in localStorage and synced across tabs like the mock store.
// Live mode keeps it on this device only until Vinh's events exist; the demo's
// approval also travels as the handoff event, so the desktop still sees it.
import { useEffect, useSyncExternalStore } from "react";

import { useEvents } from "./useEvents";

const KEY = "firstdose:local";

export type ContactMark = { kind: "reached" | "left_message"; at: number };
export type LinkRequest = { id: string; npiLast4: string; at: number };
export type LocalState = {
  /** prescriber_label → when the prescriber approved (ms). */
  approved: Record<string, number>;
  /** case id → the latest contact mark. */
  marks: Record<string, ContactMark>;
  /** Link requests the coordinator started for other prescribers. */
  requests: LinkRequest[];
};

const EMPTY: LocalState = { approved: {}, marks: {}, requests: [] };

let state: LocalState = EMPTY;
let started = false;
const listeners = new Set<() => void>();

function isRecord(x: unknown): x is Record<string, unknown> {
  return typeof x === "object" && x !== null && !Array.isArray(x);
}

function read(): LocalState {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(KEY) ?? "null");
    if (!isRecord(parsed)) return EMPTY;
    return {
      approved: isRecord(parsed.approved) ? (parsed.approved as Record<string, number>) : {},
      marks: isRecord(parsed.marks) ? (parsed.marks as Record<string, ContactMark>) : {},
      requests: Array.isArray(parsed.requests) ? (parsed.requests as LinkRequest[]) : [],
    };
  } catch {
    return EMPTY;
  }
}

function emit() {
  for (const listener of listeners) listener();
}

function start() {
  if (started || typeof window === "undefined") return;
  started = true;
  state = read();
  window.addEventListener("storage", (e) => {
    if (e.key !== KEY && e.key !== null) return;
    state = read();
    emit();
  });
}

function write(next: LocalState) {
  state = next;
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // storage blocked: this tab still updates
  }
  emit();
}

function subscribeLocal(listener: () => void) {
  start();
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getLocal() {
  start();
  return state;
}

const getServerLocal = () => EMPTY;

function isEmpty(s: LocalState) {
  return Object.keys(s.approved).length === 0 && Object.keys(s.marks).length === 0 && s.requests.length === 0;
}

export const local = {
  approve(prescriber: string) {
    if (prescriber in state.approved) return;
    write({ ...state, approved: { ...state.approved, [prescriber]: Date.now() } });
  },
  mark(caseId: string, kind: ContactMark["kind"]) {
    write({ ...state, marks: { ...state.marks, [caseId]: { kind, at: Date.now() } } });
  },
  request(npiLast4: string) {
    const at = Date.now();
    write({ ...state, requests: [...state.requests, { id: `req_${at}`, npiLast4, at }] });
  },
  clear() {
    if (!isEmpty(state)) write(EMPTY);
  },
};

/** Local UI state for this run. A reset (no events) forgets it on every tab. */
export function useLocal(): LocalState {
  const s = useSyncExternalStore(subscribeLocal, getLocal, getServerLocal);
  const { ready, fired, override } = useEvents();
  const newRun = ready && fired.length === 0 && override === null;
  useEffect(() => {
    if (newRun) local.clear();
  }, [newRun]);
  return s;
}
