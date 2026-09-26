import week from "../data/demo-week.json";
import type { FillEvent, Patient, RxCase } from "../components/data/types";

// Shared offline/live input. No keys, I/O or runtime-generated patient content.
export const WEEK_PATIENTS = week.patients as Patient[];
export const WEEK_CASES = week.cases as RxCase[];
export const WEEK_EVENTS = week.events as FillEvent[];

/** Anchor the prepared simulation once; retries read the committed event times. */
export function seedWeekEvents(now: string): FillEvent[] {
  const anchor = Date.parse(now);
  if (!Number.isFinite(anchor)) throw new Error("Invalid seed time");
  return WEEK_EVENTS.map(event => ({ ...event, at: new Date(anchor + Number(event.at) * 1_000).toISOString() }));
}

export function weekActionIds(caseId: string) {
  return { prescribe: `ev_${caseId}_prescribed`, handoff: `ev_${caseId}_handoff`, choose: `ev_${caseId}_choose`, send: `ev_${caseId}_send` };
}

// Action templates let existing guarded commands operate on the background queue.
export const WEEK_ACTIONS: FillEvent[] = WEEK_CASES.flatMap(rx => {
  const ids = weekActionIds(rx.id);
  return ([
    [ids.prescribe, "doctor", "prescribed"], [ids.handoff, "doctor", "handoff"],
    [ids.choose, "system", "fix_chosen"], [ids.send, "coordinator", "fix_sent"],
  ] as const).map(([id, actor, type]) => ({
    id, case_id: rx.id, at: 0, actor, type, note: "", side: "practice",
    status_text: null, reject_code: null, reason: null, fix: null, amount_usd: null, wrist: null,
  }));
});
