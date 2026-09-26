import type { FillEvent } from "../components/data/types";

export type RxFillStatus = "Dispensed" | "PartiallyDispensed" | "NotDispensed" | "Transferred";
export type RxFillExample = {
  FillStatus: Partial<Record<RxFillStatus, { Note?: string }>>;
};

export type SimulatedRxFill = {
  simulated: true;
  label: "Simulated pharmacy · real RxFill vocabulary";
  wire_payload: false;
  source_event: FillEvent;
  source_kind: "claim" | "fill_status" | "other";
  /** Explicit simulation status only. Never an interpretation of claim payment. */
  dispensing_status: RxFillStatus | null;
  request_context: {
    simulated: true;
    message_type: "NewRx";
    SCRIPT_reference: "2023011";
    RxFillIndicator: "All"[];
  };
  RxFill: RxFillExample | null;
  synthetic_example: {
    simulated: true;
    basis: "legacy_status_text_only";
    RxFill: RxFillExample;
  } | null;
};

const STATUSES = new Map<string, RxFillStatus>([
  ["Dispensed", "Dispensed"],
  ["Partially dispensed", "PartiallyDispensed"],
  ["PartiallyDispensed", "PartiallyDispensed"],
  ["Not dispensed", "NotDispensed"],
  ["NotDispensed", "NotDispensed"],
  ["Not dispensed / returned to stock", "NotDispensed"],
  ["Returned to stock", "NotDispensed"],
  ["Transferred", "Transferred"],
  ["Transferred to another pharmacy", "Transferred"],
]);

/** Presentation only: no I/O, routing, persistence or SCRIPT transport. */
export function projectRxFill(event: FillEvent): SimulatedRxFill | null {
  if (event.actor !== "pharmacy" || event.side !== "practice") return null;

  const source_kind = event.type === "claim_run" ? "claim"
    : event.type === "status" || event.type === "dispensed" ? "fill_status" : "other";
  let status = event.status_text === null ? null : STATUSES.get(event.status_text) ?? null;
  if (event.type === "dispensed") {
    status = event.status_text === null || status === "Dispensed" ? "Dispensed" : null;
  }
  if (event.reject_code !== null || source_kind === "other") status = null;
  const example: RxFillExample | null = status
    ? { FillStatus: { [status]: event.note ? { Note: event.note } : {} } } : null;

  return {
    simulated: true,
    label: "Simulated pharmacy · real RxFill vocabulary",
    wire_payload: false,
    source_event: { ...event },
    source_kind,
    dispensing_status: source_kind === "fill_status" ? status : null,
    // This is a made-up request preference, not data received from the pharmacy.
    request_context: {
      simulated: true, message_type: "NewRx", SCRIPT_reference: "2023011", RxFillIndicator: ["All"],
    },
    RxFill: source_kind === "fill_status" ? example : null,
    synthetic_example: source_kind === "claim" && example
      ? { simulated: true, basis: "legacy_status_text_only", RxFill: example } : null,
  };
}
