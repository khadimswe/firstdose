// The only module that imports mock data (templates.json is copy, see components/copy).
import eventsJson from "@/mock/events.json";
import labelsJson from "@/mock/labels.json";
import patientsJson from "@/mock/patients.json";
import reasonsJson from "@/mock/reasons.json";

import type { Catalog, FillEvent } from "./types";
import { fill, money } from "@/components/copy/fill";
import { templates } from "@/components/copy/templates";

export const CATALOG = {
  patients: patientsJson.patients,
  drugs: patientsJson.drugs,
  cases: patientsJson.cases,
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
