// The only module that imports mock data (templates.json is copy, see components/copy).
import eventsJson from "@/mock/events.json";
import labelsJson from "@/mock/labels.json";
import patientsJson from "@/mock/patients.json";
import reasonsJson from "@/mock/reasons.json";

import { deriveCases, queueBucket } from "./derive";
import type { Catalog, FillEvent } from "./types";
import { WEEK_ACTIONS, WEEK_CASES, WEEK_EVENTS, WEEK_PATIENTS } from "@/lib/demo-week";
import { fill, money } from "@/components/copy/fill";
import { templates } from "@/components/copy/templates";

export const CATALOG = {
  // Maria and James, then the seeded week (6.1): fictional background cases.
  patients: [...patientsJson.patients, ...WEEK_PATIENTS],
  drugs: patientsJson.drugs,
  cases: [...patientsJson.cases, ...WEEK_CASES],
  labels: labelsJson.labels,
  reasons: reasonsJson.reasons,
  fixes: reasonsJson.fixes,
  rejectCodes: reasonsJson.status_vocabulary.ncpdp_reject_codes,
} as Catalog;

// Offline preview uses the same truthful copy as the live planner. Legacy
// synthetic milestones/provider notes remain in the source fixture for audit,
// but are not displayed as evidence that a service ran or treatment started.
const quotes = new Map<string, number>();
export const SCRIPT: FillEvent[] = (eventsJson.events as FillEvent[])
  .filter(e => e.type !== "started" && e.type !== "recovered")
  .map(event => {
    if (event.type === "claim_run" && event.amount_usd !== null) quotes.set(event.case_id, event.amount_usd);
    let wrist: string | null = null;
    if (event.type === "alert_sent" && event.reason) {
      const rx = CATALOG.cases.find(c => c.id === event.case_id)!;
      const patient = CATALOG.patients.find(p => p.id === rx.patient_id)!;
      const drug = CATALOG.drugs.find(d => d.id === rx.drug_id)!;
      wrist = fill(templates.wrist.stuck, {
        patient_short: patient.display_short, drug: drug.brand,
        reason_short: fill(templates.reason_short[event.reason], { quote: money(quotes.get(event.case_id) ?? 0) }),
      });
    }
    return { ...event, wrist, note: event.actor === "pharmacy" || event.actor === "hub" ? event.note : "" };
  });

/** The seeded week's case ids. Background only: never on the doctor's phone or the board. */
export const WEEK_CASE_IDS: ReadonlySet<string> = new Set(WEEK_CASES.map((c) => c.id));
export const isWeekCase = (caseId: string) => WEEK_CASE_IDS.has(caseId);

/** The seeded history's ids, fired by "Seed the week" in mock mode. */
export const WEEK_EVENT_IDS: readonly string[] = WEEK_EVENTS.map((e) => e.id);

/**
 * Every event the mock store can hold, in the order derive expects: the seeded
 * history (negative offsets, before demo time zero), the seeded cases' action
 * templates, then Maria and James's script. Ids are unique.
 */
export const ALL_EVENTS: FillEvent[] = (() => {
  const seen = new Set<string>();
  return [...WEEK_EVENTS, ...WEEK_ACTIONS, ...SCRIPT].filter((e) => !seen.has(e.id) && seen.add(e.id));
})();

/** The case the patient QR opens: the scripted case whose savings card is issued. It's also the only case with a patient message (C3). */
export const QR_CASE_ID: string =
  SCRIPT.find((e) => e.type === "copay_card_sent")?.case_id ?? CATALOG.cases[0].id;

/** What "Seed the week" adds, counted from the fixture (never typed into the UI). */
export const WEEK_SUMMARY = (() => {
  const week = deriveCases(CATALOG, WEEK_EVENTS).filter((c) => isWeekCase(c.id));
  const n = (b: string) => week.filter((c) => queueBucket(c) === b).length;
  return { cases: WEEK_CASES.length, needsYou: n("needs_you"), waiting: n("waiting"), confirmed: n("confirmed") };
})();
