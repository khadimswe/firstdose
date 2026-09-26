// Pure functions: events in, views out. No data access, no routing, no classifying.
import type {
  AccessSummary,
  Beat,
  Catalog,
  CaseView,
  FillEvent,
  ReasonKey,
  ScreenAction,
} from "./types";

const BEAT_GAP_SECONDS = 2;

/**
 * Seconds for an event's `at`: mock seconds as-is, or a timestamp string.
 * Postgres-style strings ("2026-09-26 05:00:00+00") are normalized to ISO first,
 * because Safari won't parse the space or the short offset. NaN if unparseable.
 */
export function atSeconds(at: number | string): number {
  if (typeof at === "number") return at;
  const iso = at.trim().replace(" ", "T").replace(/([+-]\d{2})$/, "$1:00");
  return Date.parse(iso) / 1000;
}

/** Whole calendar days between two ISO timestamps, by their own local dates. */
export function calendarDaysBetween(fromIso: string, toIso: string): number {
  const day = (iso: string) => Date.parse(iso.slice(0, 10) + "T00:00:00Z");
  return Math.round((day(toIso) - day(fromIso)) / 86_400_000);
}

export function isConfirmedFill(e: FillEvent) {
  return e.actor === "pharmacy" && e.type === "claim_run" && e.status_text === "Dispensed";
}

export function hasConfirmedFill(c: CaseView) {
  const prescribedIndex = c.events.findIndex((event) => event.type === "prescribed");
  return c.ordered && prescribedIndex >= 0 && c.events.slice(prescribedIndex + 1).some(isConfirmedFill);
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
        case "before_visit_card":
          view.beforeVisit = true;
          break;
      }
    }
    // Legacy scripted milestones are not evidence of filling or taking a dose.
    view.recovered = hasConfirmedFill(view);
    if (view.recovered) view.status = "dispensed";
    return view;
  });
}

/**
 * Whether a screen button may act on this case right now. Mirrors the guarded
 * transitions on Vihn's API routes (IMPLEMENTATION 1.11), so a double tap does
 * nothing and buttons disable correctly whatever ids the live routes write.
 */
export function canActOn(action: ScreenAction, c: CaseView): boolean {
  switch (action) {
    case "prescribe":
      return !c.ordered;
    case "handoff":
      return c.status === "stuck";
    case "fix":
      return c.status === "handed_off" && c.fix !== null;
    case "use_card":
      return c.status === "fix_sent" && c.fix === "RESEND_COPAY_CARD" && !c.cardUsed;
  }
}

/** Board stops: 0 Doctor · 1 Pharmacy · 2 Patient resource · 3 Fill confirmed. */
export function boardStop(c: CaseView): 0 | 1 | 2 | 3 {
  if (hasConfirmedFill(c)) return 3;
  if (c.events.some((e) => e.type === "fix_sent" || e.type === "copay_card_used")) return 2;
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
  const prescribed = new Map<string, FillEvent>();
  const confirmed = new Map<string, FillEvent>();
  const reasons = new Map<string, ReasonKey | null>();
  for (const event of fired) {
    if (event.type === "prescribed" && !prescribed.has(event.case_id)) prescribed.set(event.case_id, event);
    if (prescribed.has(event.case_id) && isConfirmedFill(event) && !confirmed.has(event.case_id)) confirmed.set(event.case_id, event);
    if (event.type === "reason_classified") reasons.set(event.case_id, event.reason);
  }
  const confirmedCases = [...confirmed.keys()];
  const ttffs: number[] = [];
  for (const caseId of confirmedCases) {
    const seconds = atSeconds(confirmed.get(caseId)!.at) - atSeconds(prescribed.get(caseId)!.at);
    if (Number.isFinite(seconds) && seconds >= 0) ttffs.push(seconds);
  }

  const reason_tally: Partial<Record<ReasonKey, number>> = {};
  for (const [caseId, reason] of reasons) {
    if (prescribed.has(caseId) && reason) reason_tally[reason] = (reason_tally[reason] ?? 0) + 1;
  }

  return {
    recovered: confirmedCases.length,
    median_ttff_seconds: median(ttffs),
    reason_tally,
  };
}
