// The doctor's Impiricus Ascend thread, built from fired events. Every line of
// text is a templates.json fill or event.wrist as sent. Bubbles carry name, drug,
// reason and status only: no age, condition or plan (the alert carries no chart).
import { fill } from "@/components/copy/fill";
import { templates } from "@/components/copy/templates";
import type { Catalog, CaseView, FillEvent } from "@/components/data/types";
import { calendarDaysBetween } from "@/components/data/derive";

type Base = { id: string; at: number | string; caseId: string };

export type Bubble =
  | (Base & {
      kind: "alert";
      title: string;
      body: string;
      /** Pharmacy/hub status and quote as they were when the alert fired. */
      statusText: string | null;
      rejectCode: string | null;
      quoteUsd: number | null;
      answered: boolean;
    })
  | (Base & { kind: "reply"; text: string })
  | (Base & { kind: "note"; title?: string; text: string; tone?: "started" | "visit" });

export function buildThread(cases: CaseView[], fired: FillEvent[], catalog: Catalog): Bubble[] {
  const byId = new Map(cases.map((c) => [c.id, c]));
  const status = new Map<string, { statusText: string | null; rejectCode: string | null }>();
  const quote = new Map<string, number>();
  const out: Bubble[] = [];

  for (const e of fired) {
    const c = byId.get(e.case_id);
    if (!c) continue;
    const base = { id: e.id, at: e.at, caseId: c.id };

    if (e.actor === "pharmacy" || e.actor === "hub") {
      const prev = status.get(c.id) ?? { statusText: null, rejectCode: null };
      status.set(c.id, {
        statusText: e.status_text ?? prev.statusText,
        rejectCode: e.reject_code ?? prev.rejectCode,
      });
    }
    if (e.type === "claim_run" && e.amount_usd !== null && !quote.has(c.id)) {
      quote.set(c.id, e.amount_usd);
    }

    switch (e.type) {
      case "alert_sent": {
        const t = templates.doctor_alert;
        const s = status.get(c.id) ?? { statusText: null, rejectCode: null };
        out.push({
          ...base,
          kind: "alert",
          title: fill(t.title, { patient_name: c.patient.name, drug: c.drug.brand }),
          body: fill(t.body, { reason_label: e.reason ? catalog.reasons[e.reason].label : "" }),
          ...s,
          quoteUsd: quote.get(c.id) ?? null,
          answered: c.events.some((x) => x.type === "handoff"),
        });
        break;
      }
      case "handoff":
        out.push({ ...base, kind: "reply", text: templates.doctor_alert.action });
        break;
      case "fix_chosen":
        if (e.fix) {
          const fix = catalog.fixes[e.fix];
          out.push({
            ...base,
            kind: "note",
            text: fill(templates.coordinator_card.fix_line, {
              fix_label: fix.label,
              fix_via: fix.via,
            }),
          });
        }
        break;
      case "started":
        if (e.wrist) out.push({ ...base, kind: "note", text: e.wrist, tone: "started" });
        break;
      case "before_visit_card": {
        const t = templates.before_visit_card;
        out.push({
          ...base,
          kind: "note",
          tone: "visit",
          title: fill(t.text, { patient_name: c.patient.name, drug: c.drug.brand }),
          text: fill(t.sub, {
            days_ago: calendarDaysBetween(c.rx.prescribed_at, c.rx.followup_at),
            reason_label: c.reason ? catalog.reasons[c.reason].label : "",
            fix_label: c.fix ? catalog.fixes[c.fix].label : "",
          }),
        });
        break;
      }
    }
  }
  return out;
}
