import assert from "node:assert/strict";
import type { FillEvent } from "../components/data/types";
import { planCommand, type WorkflowCommand } from "../lib/server/workflow";

// Exercises the local domain module. This does not run a database, provider or HTTP route.
const history: FillEvent[] = [];
const steps: [string, WorkflowCommand][] = [
  ["Prescription", { kind: "prescribe", patient_id: "pt_maria", drug_id: "drug_otezla" }],
  ["Simulated barrier", { kind: "fire", ids: ["ev_04", "ev_05"] }],
  ["Reviewed handoff", { kind: "handoff", case_id: "rx_001" }],
  ["Resource sent (stand-in)", { kind: "fix", case_id: "rx_001", fix: "RESEND_COPAY_CARD" }],
  ["Patient acknowledgment", { kind: "use_card", case_id: "rx_001" }],
  ["Separate simulated pharmacy confirmation", { kind: "fire", ids: ["ev_11"] }],
];

const rows = steps.map(([step, command]) => {
  const events = planCommand(history, command, new Date().toISOString());
  history.push(...events);
  assert.deepEqual(planCommand(history, command, new Date().toISOString()), [], "Retry must not append another event");
  if (command.kind === "use_card") {
    assert(!history.some((event) => event.status_text === "Dispensed"), "Acknowledgment must not confirm dispensing");
  }
  if (command.kind === "fire" && command.ids.includes("ev_05")) {
    assert.deepEqual(events.map((event) => event.id), ["ev_04", "ev_05", "ev_06"]);
    assert.equal(events.at(-1)?.wrist, "Maria: Otezla not started. Declined at price ($410 demo).");
  }
  return { step, new_events: events.map((event) => event.id).join(", ") };
});

assert.equal(history.filter((event) => event.status_text === "Dispensed").length, 1);
assert.equal(history.filter((event) => event.type === "alert_sent").length, 1);
console.table(rows);
console.log("Local workflow passed. No database writes, provider calls, or watch notifications were made.");
