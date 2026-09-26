// Operator-facing names for event types and actors. UI labels only; nothing
// here is a sentence about a patient.
import type { Actor, Beat, EventType } from "@/components/data/types";

export const TYPE_LABEL: Record<EventType, string> = {
  prescribed: "Prescribed",
  label_shown: "Label shown",
  copay_card_sent: "Copay card sent",
  claim_run: "Claim run",
  status: "Hub status",
  reason_classified: "Reason classified",
  alert_sent: "Wrist alert",
  handoff: "Handoff",
  fix_chosen: "Fix chosen",
  fix_sent: "Fix sent",
  copay_card_used: "Card used",
  dispensed: "Dispensed",
  started: "Started",
  before_visit_card: "Before-visit card",
  recovered: "Recovered",
};

export const ACTOR_LABEL: Record<Actor, string> = {
  pharmacy: "Pharmacy",
  hub: "Hub",
  system: "System",
  doctor: "Doctor",
  coordinator: "Coordinator",
  patient: "Patient",
  ascend: "Ascend",
};

/** "ev_04–06" for a beat's event ids. */
export function beatRange(beat: Beat) {
  const first = beat.events[0].id;
  const last = beat.events[beat.events.length - 1].id;
  return first === last ? first : `${first}–${last.replace(/^ev_/, "")}`;
}

export function beatSummary(beat: Beat) {
  return beat.events.map((e) => TYPE_LABEL[e.type]).join(" → ");
}
