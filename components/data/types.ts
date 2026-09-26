// Types for the frozen contract in mock/*.json. Field names match the JSON
// exactly so the Supabase tables (rx_cases, fill_events) can use the same rows.

export type Actor =
  | "pharmacy"
  | "hub"
  | "system"
  | "doctor"
  | "coordinator"
  | "patient"
  | "ascend";

export type EventType =
  | "prescribed"
  | "label_shown"
  | "copay_card_sent"
  | "claim_run"
  | "status"
  | "reason_classified"
  | "alert_sent"
  | "handoff"
  | "fix_chosen"
  | "fix_sent"
  | "copay_card_used"
  | "dispensed"
  | "started"
  | "before_visit_card"
  | "recovered";

export type Side = "practice" | "ascend";

export type ReasonKey =
  | "DECLINED_AT_PRICE"
  | "COPAY_NOT_APPLIED"
  | "UNABLE_TO_REACH"
  | "PA_REQUIRED"
  | "NOT_COVERED"
  | "NOT_PICKED_UP_48H";

export type FixKey = "RESEND_COPAY_CARD" | "BRIDGE_SAMPLE" | "ACCESS_SUPPORT";

export type CaseStatus =
  | "prescribed"
  | "stuck"
  | "handed_off"
  | "fix_sent"
  | "dispensed"
  | "started"
  | "never_started";

/** One row of fill_events. `id` is the mock event id (ev_01...). */
export type FillEvent = {
  id: string;
  case_id: string;
  /** Seconds from demo start in mock; ISO string in Supabase. */
  at: number | string;
  actor: Actor;
  type: EventType;
  status_text: string | null;
  reject_code: string | null;
  note: string;
  reason: ReasonKey | null;
  fix: FixKey | null;
  amount_usd: number | null;
  wrist: string | null;
  side: Side;
};

export type Patient = {
  id: string;
  name: string;
  display_short: string;
  age: number;
  insurance: {
    type: string;
    plan_label: string;
    copay_card_eligible: boolean;
  };
  state: string;
  condition_label: string;
  phone_label: string;
};

export type Drug = {
  id: string;
  brand: string;
  generic: string;
  strength: string;
  qty_label: string;
  channel: "retail" | "specialty";
  rxcui: string;
  dailymed_setid: string;
  manufacturer: string;
  wac_usd: number;
  wac_source: string;
  copay_program: {
    name: string;
    patient_pays_label: string;
    max_benefit_label: string;
    excludes: string[];
  };
  demo_quote_usd: number | null;
  demo_quote_label: string | null;
  has_boxed_warning: boolean;
  boxed_warning_title?: string;
};

/** One row of rx_cases. */
export type RxCase = {
  id: string;
  patient_id: string;
  drug_id: string;
  prescriber_label: string;
  prescribed_at: string;
  status: CaseStatus;
  reason: ReasonKey | null;
  fix: FixKey | null;
  started_at: string | null;
  followup_at: string;
};

export type LabelSection = {
  loinc: string;
  title: string;
  /** Verbatim DailyMed SPL text. Render as-is; never edit. */
  text: string | null;
};

export type Label = {
  drug_id: string;
  setid: string;
  fetched_at: string | null;
  byte_exact: boolean;
  sections: LabelSection[];
};

export type Reason = {
  label: string;
  channel: string[];
  source: string;
  standard: boolean;
  reject_code?: string;
};

export type Fix = {
  label: string;
  via: string;
  needs_commercial_insurance: boolean;
};

export type Catalog = {
  patients: Patient[];
  drugs: Drug[];
  cases: RxCase[];
  labels: Label[];
  reasons: Record<ReasonKey, Reason>;
  fixes: Record<FixKey, Fix>;
};

/** Events fired together: a burst in mock/events.json whose `at` values are <= 2 s apart. */
export type Beat = {
  id: string;
  case_id: string;
  events: FillEvent[];
};

/** A case as the screens see it, worked out from the events fired so far. */
export type CaseView = {
  id: string;
  rx: RxCase;
  patient: Patient;
  drug: Drug;
  label: Label | undefined;
  /** The doctor has signed the order (a `prescribed` event has fired). */
  ordered: boolean;
  status: CaseStatus;
  /** From `reason_classified` only. */
  reason: ReasonKey | null;
  /** From `fix_chosen` only. The frontend never routes. */
  fix: FixKey | null;
  /** Latest pharmacy/hub status, verbatim. */
  statusText: string | null;
  rejectCode: string | null;
  /** Any pharmacy or hub event has fired for this case. */
  atPharmacy: boolean;
  /** First claim amount (the quote) and latest claim amount. Always labelled demo. */
  quoteUsd: number | null;
  amountUsd: number | null;
  /** Latest text sent to the watch, verbatim. */
  wrist: string | null;
  cardUsed: boolean;
  beforeVisit: boolean;
  recovered: boolean;
  events: FillEvent[];
};

/** Aggregate only. No patient, case or prescriber fields, by design. */
export type AccessSummary = {
  recovered: number;
  median_ttff_seconds: number | null;
  reason_tally: Partial<Record<ReasonKey, number>>;
};

/**
 * The buttons on the screens. Live, each one is an API route in
 * docs/architecture.md; on mock, each fires the same events that route writes.
 */
export type ScreenAction =
  | "prescribe" // /doctor → POST /api/rx { patient_id, drug_id }: prescribed, label_shown, copay_card_sent
  | "handoff" // /doctor → POST /api/handoff { case_id }: handoff, fix_chosen
  | "fix" // /coordinator → POST /api/fix { case_id, fix }: fix_sent
  | "use_card"; // /patient → POST /api/patient/use { case_id }: copay_card_used … recovered

/**
 * Supabase mode. Vihn implements this in lib/realtime.ts; useEvents() calls it
 * when NEXT_PUBLIC_DATA_SOURCE=supabase. Rows keep the mock event `id` so /sim
 * can tell which beats have fired.
 */
export interface EventSource {
  /** Rows already in fill_events, oldest first. */
  load(): Promise<FillEvent[]>;
  /** Calls onInsert for every new fill_events row. Returns an unsubscribe function. */
  subscribe(onInsert: (event: FillEvent) => void): () => void;
  /** A screen button. `rx` gives the route its body (patient_id, drug_id, fix). */
  act(action: ScreenAction, rx: RxCase, fix: FixKey | null): Promise<void>;
  /** /sim only: replays these mock/events.json ids, in order (POST /api/sim/fire per id). */
  fire(ids: string[]): Promise<void>;
  /** Clears fill_events for a fresh run (POST /api/sim/reset). */
  reset(): Promise<void>;
  /** From Tiger daily_ttff (GET /api/access/summary). */
  accessSummary(): Promise<AccessSummary>;
}
