// One line per event for the coordinator's case timeline. Pharmacy and hub
// statuses are shown as they arrived; the one sentence about the patient is a
// template. Legacy "started"/"recovered" milestones are skipped (PLAN D8).
import { fill } from "@/components/copy/fill";
import { templates } from "@/components/copy/templates";
import type { Catalog, CaseView, FillEvent } from "@/components/data/types";

export type TimelineLine = { id: string; at: number | string; who: string; text: string; tone?: "stuck" | "done" };

export function timeline(c: CaseView, catalog: Catalog): TimelineLine[] {
  const out: TimelineLine[] = [];
  for (const e of c.events) {
    const line = describe(e, c, catalog);
    if (line) out.push({ id: e.id, at: e.at, ...line });
  }
  return out;
}

function describe(
  e: FillEvent,
  c: CaseView,
  catalog: Catalog,
): Omit<TimelineLine, "id" | "at"> | null {
  switch (e.type) {
    case "prescribed":
      return { who: "Doctor", text: `Signed and sent ${c.drug.brand} ${c.drug.strength}` };
    case "label_shown":
      return { who: "System", text: "DailyMed label shown with the order" };
    case "copay_card_sent":
      return { who: "Wallet", text: `Savings card issued · ${c.drug.copay_program.name}` };
    case "claim_run":
    case "status": {
      const reject = e.reject_code ? ` · Reject ${e.reject_code} ${catalog.rejectCodes[e.reject_code] ?? ""}` : "";
      const who = e.actor === "hub" ? "Hub" : "Pharmacy";
      const done = e.type === "claim_run" && e.status_text === "Dispensed";
      return e.status_text ? { who, text: `${e.status_text}${reject}`, tone: done ? "done" : undefined } : null;
    }
    case "reason_classified":
      return e.reason ? { who: "System", text: catalog.reasons[e.reason].label, tone: "stuck" } : null;
    case "alert_sent":
      return { who: "System", text: "Doctor alerted" };
    case "handoff":
      return { who: "Doctor", text: "Sent to you" };
    case "fix_chosen":
      return e.fix ? { who: "Rule", text: `Picked: ${catalog.fixes[e.fix].label}` } : null;
    case "fix_sent":
      return e.fix ? { who: "You", text: `${catalog.fixes[e.fix].label} · sent` } : null;
    case "copay_card_used":
      return {
        who: "Patient",
        text: fill(templates.doctor_confirmation.acknowledged, {
          patient_name: c.patient.name,
          drug: c.drug.brand,
        }),
      };
    case "before_visit_card":
      return { who: "System", text: "Before-visit note sent to the doctor" };
    default:
      return null;
  }
}
