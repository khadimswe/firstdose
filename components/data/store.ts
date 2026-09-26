// Mock source: the ids of events fired so far, kept in localStorage. Other tabs
// on the same machine pick changes up through the `storage` event, so /sim in
// one tab drives any screen in another. Read with useSyncExternalStore.

const KEY = "firstdose:fired";
const EMPTY: readonly string[] = [];

let fired: readonly string[] = EMPTY;
let started = false;
const listeners = new Set<() => void>();

function read(): readonly string[] {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(KEY) ?? "[]");
    return Array.isArray(parsed)
      ? parsed.filter((x): x is string => typeof x === "string")
      : EMPTY;
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
  fired = read();
  window.addEventListener("storage", (e) => {
    // key is null when another tab calls localStorage.clear()
    if (e.key !== KEY && e.key !== null) return;
    fired = read();
    emit();
  });
}

export function subscribe(listener: () => void) {
  start();
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getSnapshot() {
  start();
  return fired;
}

export function getServerSnapshot() {
  return EMPTY;
}

export function setFired(ids: readonly string[]) {
  start();
  fired = ids;
  try {
    localStorage.setItem(KEY, JSON.stringify(ids));
  } catch {
    // private mode or storage blocked: this tab still updates
  }
  emit();
}
