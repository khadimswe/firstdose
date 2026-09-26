import type { FillEvent, FixKey, ReasonKey } from "@/components/data/types";
import eventsJson from "@/mock/events.json";
import patientsJson from "@/mock/patients.json";
import templates from "@/mock/templates.json";
import { fill, money } from "@/components/copy/fill";
import { routeFix } from "./router";
import { WEEK_PATIENTS, WEEK_CASES, WEEK_EVENTS, WEEK_ACTIONS, seedWeekEvents, weekActionIds } from "../demo-week";

export type WorkflowCommand =
  | { kind: "seed_week" }
  | { kind: "prescribe"; patient_id: string; drug_id: string }
  | { kind: "handoff" | "use_card"; case_id: string }
  | { kind: "fix"; case_id: string; fix: FixKey }
  | { kind: "fire"; ids: string[] };

export class WorkflowError extends Error {
  constructor(public readonly code: "invalid_command" | "invalid_transition", message: string) {
    super(message);
    this.name = "WorkflowError";
  }
}

const SCRIPT = [...eventsJson.events as FillEvent[], ...WEEK_ACTIONS];
const CASES = [...patientsJson.cases, ...WEEK_CASES];
const PATIENTS = [...patientsJson.patients, ...WEEK_PATIENTS];
const SIMULATED_FIX_NOTES: Record<FixKey, string> = {
  RESEND_COPAY_CARD: "Simulated savings-card resend (stand-in).",
  BRIDGE_SAMPLE: "Simulated bridge-sample request (stand-in).",
  ACCESS_SUPPORT: "Simulated access-support request (stand-in).",
};
const SIMULATOR_PREREQUISITES: Record<string, string> = {
  ev_04: "ev_01", // Maria's simulated pharmacy quote
  ev_05: "ev_04", // supplied demo reason, not a Gemini result
  ev_11: "ev_10", // separate pharmacy confirmation after acknowledgment
  ev_16: "ev_14", // James's pharmacy rejection
  ev_17: "ev_16", // hub attempts
  ev_18: "ev_17", // supplied demo reason
};

function invalid(message: string): never {
  throw new WorkflowError("invalid_command", message);
}

function requireTransition(allowed: boolean) {
  if (!allowed) throw new WorkflowError("invalid_transition", "This action is not available in the current case state.");
}

/** Strict allowlist for the small fictional-demo command surface, also used before HTTP integration. */
export function validateCommand(value: unknown): asserts value is WorkflowCommand {
  if (!value || typeof value !== "object" || Array.isArray(value)) invalid("Expected a command object.");
  const command = value as Record<string, unknown>;
  let keys: string[];
  switch (command.kind) {
    case "seed_week":
      keys = ["kind"];
      break;
    case "prescribe":
      keys = ["kind", "patient_id", "drug_id"];
      if (typeof command.patient_id !== "string" || typeof command.drug_id !== "string") invalid("Patient and drug IDs are required.");
      break;
    case "handoff":
    case "use_card":
      keys = ["kind", "case_id"];
      if (typeof command.case_id !== "string") invalid("A case ID is required.");
      break;
    case "fix":
      keys = ["kind", "case_id", "fix"];
      if (typeof command.case_id !== "string" || !["RESEND_COPAY_CARD", "BRIDGE_SAMPLE", "ACCESS_SUPPORT"].includes(command.fix as string)) invalid("A valid case ID and fix are required.");
      break;
    case "fire":
      keys = ["kind", "ids"];
      if (!Array.isArray(command.ids) || command.ids.length === 0 || command.ids.length > eventsJson.events.length || !command.ids.every((id) => typeof id === "string")) invalid("Supply a non-empty, bounded list of event IDs.");
      break;
    default:
      invalid("Unknown command.");
  }
  if (Object.keys(command).some((key) => !keys.includes(key))) invalid("Unexpected command fields.");
}

function isoMillis(value: string | number): number {
  // Numeric mock offsets and timezone-less dates are not authoritative event time.
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?(?:Z|[+-]\d{2}:\d{2})$/.test(value) || !Number.isFinite(Date.parse(value))) {
    invalid("Expected an ISO timestamp with timezone.");
  }
  // Date.parse normalizes impossible dates such as February 30 into the next month.
  const calendarDate = value.slice(0, 10);
  if (new Date(calendarDate).toISOString().slice(0, 10) !== calendarDate) {
    invalid("Expected a valid calendar date.");
  }
  return Date.parse(value);
}

/** Local command planner. Its caller must lock the run and persist the entire result atomically. */
export function planCommand(
  history: readonly FillEvent[],
  command: WorkflowCommand,
  now: string,
): FillEvent[] {
  validateCommand(command);
  if (command.kind === "seed_week") {
    isoMillis(now);
    const seen = new Set(history.map(event => event.id));
    if (WEEK_EVENTS.every(event => seen.has(event.id))) return [];
    requireTransition(history.length === 0);
    return seedWeekEvents(now);
  }
  let nextTime = isoMillis(now);
  for (const event of history) nextTime = Math.max(nextTime, isoMillis(event.at) + 1);
  const pending: FillEvent[] = [];
  const seen = new Set(history.map((event) => event.id));
  const all = () => [...history, ...pending];

  function emit(id: string, changes: Partial<FillEvent> = {}) {
    if (seen.has(id)) return;
    const template = SCRIPT.find((event) => event.id === id);
    if (!template) invalid("Unknown script event.");
    let wrist: string | null = null;
    if (template.actor === "pharmacy" && template.type === "claim_run" && template.status_text === "Dispensed") {
      requireTransition(all().some((event) => event.case_id === template.case_id && event.type === "prescribed"));
      const rx = patientsJson.cases.find((row) => row.id === template.case_id)!;
      const patient = patientsJson.patients.find((row) => row.id === rx.patient_id)!;
      const drug = patientsJson.drugs.find((row) => row.id === rx.drug_id)!;
      // The confirmation itself owns the outbox key; replay cannot queue another alert.
      wrist = fill(templates.wrist.fill_confirmed, { patient_short: patient.display_short, drug: drug.brand });
    }
    pending.push({
      ...template,
      // Script notes make unverified provider/label claims. Only retain the supplied pharmacy/hub input.
      note: template.actor === "pharmacy" || template.actor === "hub" ? template.note : "",
      wrist,
      side: "practice",
      ...changes,
      at: new Date(nextTime++).toISOString(),
    });
    seen.add(id);
  }

  function emitReasonAlert(reasonEvent: FillEvent, alertId: string) {
    const rx = patientsJson.cases.find((row) => row.id === reasonEvent.case_id)!;
    const patient = patientsJson.patients.find((row) => row.id === rx.patient_id)!;
    const drug = patientsJson.drugs.find((row) => row.id === rx.drug_id)!;
    const reason = reasonEvent.reason!;
    const reasonTemplate = templates.reason_short[reason];
    const quote = all().findLast((event) => event.case_id === rx.id && event.type === "claim_run" && event.amount_usd !== null)?.amount_usd;
    if (reasonTemplate.includes("{quote}") && (typeof quote !== "number" || !Number.isFinite(quote))) invalid("The price alert requires a recorded pharmacy quote.");
    const wrist = fill(templates.wrist.stuck, {
      patient_short: patient.display_short,
      drug: drug.brand,
      reason_short: fill(reasonTemplate, { quote: typeof quote === "number" ? money(quote) : "" }),
    });
    // Legacy alert_sent records an app alert; the transaction queues provider delivery separately.
    emit(alertId, { reason, wrist });
  }

  if (command.kind === "fire") {
    for (const id of command.ids) {
      if (!Object.hasOwn(SIMULATOR_PREREQUISITES, id)) invalid("This beat requires a screen action or a verified integration.");
      if (seen.has(id)) continue;
      requireTransition(seen.has(SIMULATOR_PREREQUISITES[id]));
      emit(id);
      if (id === "ev_05" || id === "ev_18") emitReasonAlert(pending.at(-1)!, id === "ev_05" ? "ev_06" : "ev_19");
    }
    return pending;
  }

  const rx = command.kind === "prescribe"
    ? CASES.find((row) => row.patient_id === command.patient_id && row.drug_id === command.drug_id)
    : CASES.find((row) => row.id === command.case_id);
  if (!rx) invalid("Unknown fictional case or patient/drug pair.");
  const patient = PATIENTS.find((row) => row.id === rx.patient_id)!;
  const caseEvents = all().filter((event) => event.case_id === rx.id);
  const has = (type: FillEvent["type"]) => caseEvents.some((event) => event.type === type);
  const reason = caseEvents.findLast((event) => event.type === "reason_classified")?.reason as ReasonKey | null | undefined;
  const fix = routeFix({
    insuranceType: patient.insurance.type,
    reason: reason ?? null,
    // Explicit prepared fictional evidence, not an inference from commercial coverage.
    copayCardEligible: patient.insurance.copay_card_eligible,
    bridgeSampleEligible: false,
  });
  const ids = rx.id === "rx_001"
    ? { prescribe: "ev_01", handoff: "ev_07", choose: "ev_08", send: "ev_09" }
    : rx.id === "rx_002"
      ? { prescribe: "ev_14", handoff: "ev_20", choose: "ev_21", send: "ev_21b" }
      : weekActionIds(rx.id);

  switch (command.kind) {
    case "prescribe":
      if (has("prescribed")) return [];
      emit(ids.prescribe);
      if (rx.id === "rx_001" && patient.insurance.type === "commercial" && patient.insurance.copay_card_eligible) {
        emit("ev_03", { note: "Simulated savings-card delivery (stand-in)." });
      }
      // label_shown needs proof from the verified-label/UI integration, not a prescription click.
      break;
    case "handoff":
      if (has("handoff")) return [];
      requireTransition(has("prescribed") && has("reason_classified") && !has("dispensed") && !caseEvents.some((e) => e.type === "claim_run" && e.status_text === "Dispensed"));
      emit(ids.handoff, { reason: reason ?? null, fix: null });
      emit(ids.choose, { reason: reason ?? null, fix });
      break;
    case "fix":
      if (command.fix !== fix) invalid("Requested fix does not match the server's eligibility decision.");
      if (has("fix_sent")) return [];
      requireTransition(has("handoff") && has("fix_chosen"));
      emit(ids.send, { reason: reason ?? null, fix, note: SIMULATED_FIX_NOTES[fix] });
      break;
    case "use_card":
      requireTransition(rx.id === "rx_001" && fix === "RESEND_COPAY_CARD" && has("fix_sent"));
      emit("ev_10", { fix });
      break;
  }
  return pending;
}
