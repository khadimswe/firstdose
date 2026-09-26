import type { Beat, FillEvent } from "./types";

// Screen actions and derived alerts are never simulator inputs.
const prerequisites: Record<string, string> = {
  ev_04: "ev_01", ev_05: "ev_04", ev_11: "ev_10",
  ev_16: "ev_14", ev_17: "ev_16", ev_18: "ev_17",
};
export function liveBeats(script: FillEvent[]): Beat[] {
  return script.filter(e => Object.hasOwn(prerequisites, e.id)).map(e => ({
    id: e.id, case_id: e.case_id,
    events: [{ ...e, note: e.actor === "pharmacy" || e.actor === "hub" ? e.note : "", wrist: null }],
  }));
}
export function canFireLive(ids: string[], fired: ReadonlySet<string>): boolean {
  const available = new Set(fired);
  if (!ids.length) return false;
  for (const id of ids) {
    if (!Object.hasOwn(prerequisites, id) || available.has(id) || !available.has(prerequisites[id])) return false;
    available.add(id);
  }
  return true;
}
