// Mock source: the ids of events fired so far, kept in localStorage. Other tabs
// on the same machine pick changes up through the `storage` event, so /sim in
// one tab drives any screen in another. Read with useSyncExternalStore.
//
// Two URL overrides make a tab independent (and read-only):
//   ?upto=ev_06            freeze this tab at that event (stills)
//   ?replay=1[&speed=N]    loop events.json in this tab on its own clock
//                          (the board's fallback if the network dies)

import { SCRIPT } from "./catalog";
import { beats } from "./derive";
import { playBeats } from "./replay";

const KEY = "firstdose:fired";
const EMPTY: readonly string[] = [];
const REPLAY_START_MS = 1000;
const REPLAY_PAUSE_MS = 8000;

export type Override = { kind: "upto"; id: string } | { kind: "replay"; speed: number } | null;

let fired: readonly string[] = EMPTY;
let override: Override = null;
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

function readOverride(): Override {
  const q = new URLSearchParams(window.location.search);
  const upto = q.get("upto");
  if (upto && SCRIPT.some((e) => e.id === upto)) return { kind: "upto", id: upto };
  if (q.get("replay") === "1") {
    const speed = Number(q.get("speed"));
    return { kind: "replay", speed: speed > 0 ? speed : 1 };
  }
  return null;
}

/** Loops the whole script in this tab only; never touches localStorage. */
function startReplay(speed: number) {
  const all = beats(SCRIPT);
  const loop = () => {
    fired = EMPTY;
    emit();
    playBeats(
      all,
      speed,
      (b) => {
        fired = [...fired, ...b.events.map((e) => e.id)];
        emit();
      },
      () => setTimeout(loop, REPLAY_PAUSE_MS),
    );
  };
  setTimeout(loop, REPLAY_START_MS);
}

function start() {
  if (started || typeof window === "undefined") return;
  started = true;
  override = readOverride();

  if (override?.kind === "upto") {
    const id = override.id;
    fired = SCRIPT.slice(0, SCRIPT.findIndex((e) => e.id === id) + 1).map((e) => e.id);
    return;
  }
  if (override?.kind === "replay") {
    startReplay(override.speed);
    return;
  }

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

export function getOverride(): Override {
  start();
  return override;
}

export function getServerOverride(): Override {
  return null;
}

export function setFired(ids: readonly string[]) {
  start();
  if (override) return; // frozen and replay tabs are read-only
  fired = ids;
  try {
    localStorage.setItem(KEY, JSON.stringify(ids));
  } catch {
    // private mode or storage blocked: this tab still updates
  }
  emit();
}
