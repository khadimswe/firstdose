// Pure functions: events in, views out. No data access, no routing, no classifying.
import type {
  AccessSummary,
  Beat,
  Catalog,
  CaseView,
  FillEvent,
  ReasonKey,
} from "./types";

const BEAT_GAP_SECONDS = 2;

export function atSeconds(at: number | string): number {
  return typeof at === "number" ? at : Date.parse(at) / 1000;
}

/** Whole calendar days between two ISO timestamps, by their own local dates. */
export function calendarDaysBetween(fromIso: string, toIso: string): number {
  const day = (iso: string) => Date.parse(iso.slice(0, 10) + "T00:00:00Z");
  return Math.round((day(toIso) - day(fromIso)) / 86_400_000);
}

function isDispensedClaim(e: FillEvent) {
  return e.type === "claim_run" && e.status_text === "Dispensed";
}

/** Groups the script into bursts: same case, `at` values <= 2 s apart. */
export function beats(script: FillEvent[]): Beat[] {
  const out: Beat[] = [];
  let prev: FillEvent | undefined;
  for (const e of script) {
    const current = out[out.length - 1];
    const joins =
      current &&
      prev &&
      prev.case_id === e.case_id &&
      atSeconds(e.at) - atSeconds(prev.at) <= BEAT_GAP_SECONDS;
    if (joins) current.events.push(e);
    else out.push({ id: e.id, case_id: e.case_id, events: [e] });
    prev = e;
  }
  return out;
}

/** `fired` must be in script order. */
export function deriveCases(catalog: Catalog, fired: FillEvent[]): CaseView[] {
  return catalog.cases.map((rx) => {
    const patient = catalog.patients.find((p) => p.id === rx.patient_id)!;
    const drug = catalog.drugs.find((d) => d.id === rx.drug_id)!;
    const view: CaseView = {
      id: rx.id,
      rx,
      patient,
      drug,
      label: catalog.labels.find((l) => l.drug_id === rx.drug_id),
      ordered: false,
      status: rx.status,
      reason: null,
      fix: null,
      statusText: null,
      rejectCode: null,
      atPharmacy: false,
      quoteUsd: null,
      amountUsd: null,
      wrist: null,
      cardUsed: false,
      beforeVisit: false,
      recovered: false,
      events: fired.filter((e) => e.case_id === rx.id),
    };

    for (const e of view.events) {
      if (e.actor === "pharmacy" || e.actor === "hub") {
        view.atPharmacy = true;
        if (e.status_text !== null) view.statusText = e.status_text;
        if (e.reject_code !== null) view.rejectCode = e.reject_code;
      }
      if (e.type === "claim_run" && e.amount_usd !== null) {
        if (view.quoteUsd === null) view.quoteUsd = e.amount_usd;
        view.amountUsd = e.amount_usd;
      }
      if (e.wrist !== null) view.wrist = e.wrist;

      switch (e.type) {
        case "prescribed":
          view.ordered = true;
          view.status = "prescribed";
          break;
        case "reason_classified":
          view.reason = e.reason;
          view.status = "stuck";
          break;
        case "handoff":
          view.status = "handed_off";
          break;
        case "fix_chosen":
          view.fix = e.fix;
          break;
        case "fix_sent":
          view.status = "fix_sent";
          break;
        case "copay_card_used":
          view.cardUsed = true;
          break;
        case "dispensed":
          view.status = "dispensed";
          break;
        case "started":
          view.status = "started";
          break;
        case "before_visit_card":
          view.beforeVisit = true;
          break;
        case "recovered":
          view.recovered = true;
          break;
      }
      if (isDispensedClaim(e)) view.status = "dispensed";
    }
    return view;
  });
}

/** Board stops: 0 Doctor · 1 Pharmacy · 2 Patient · 3 Started. */
export function boardStop(c: CaseView): 0 | 1 | 2 | 3 {
  if (c.status === "started") return 3;
  if (c.status === "dispensed") return 2;
  if (c.atPharmacy) return 1;
  return 0;
}

function median(xs: number[]): number | null {
  if (xs.length === 0) return null;
  const s = [...xs].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}

/** Same shape as Vihn's /api/access/summary. Counts only. */
export function accessSummary(fired: FillEvent[]): AccessSummary {
  const recoveredCases = fired
    .filter((e) => e.type === "recovered")
    .map((e) => e.case_id);

  const ttffs: number[] = [];
  for (const caseId of recoveredCases) {
    const prescribed = fired.find((e) => e.case_id === caseId && e.type === "prescribed");
    const dispensed = fired.find((e) => e.case_id === caseId && isDispensedClaim(e));
    if (prescribed && dispensed) {
      ttffs.push(atSeconds(dispensed.at) - atSeconds(prescribed.at));
    }
  }

  const reason_tally: Partial<Record<ReasonKey, number>> = {};
  for (const e of fired) {
    if (e.type === "reason_classified" && e.reason) {
      reason_tally[e.reason] = (reason_tally[e.reason] ?? 0) + 1;
    }
  }

  return {
    recovered: recoveredCases.length,
    median_ttff_seconds: median(ttffs),
    reason_tally,
  };
}
