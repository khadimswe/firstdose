import { describe, expect, it } from "vitest";
import { CATALOG, SCRIPT } from "@/components/data/catalog";
import { accessSummary, atSeconds, boardStop, deriveCases } from "@/components/data/derive";
import type { FillEvent } from "@/components/data/types";
import { planCommand, type WorkflowCommand } from "@/lib/server/workflow";
import { buildThread } from "@/app/(screens)/doctor/_components/thread";
import rawEvents from "@/mock/events.json";

function mariaLoop(confirm = false) {
  const events: FillEvent[] = [];
  const commands: WorkflowCommand[] = [
    { kind: "prescribe", patient_id: "pt_maria", drug_id: "drug_otezla" },
    { kind: "fire", ids: ["ev_04", "ev_05"] },
    { kind: "handoff", case_id: "rx_001" },
    { kind: "fix", case_id: "rx_001", fix: "RESEND_COPAY_CARD" },
    { kind: "use_card", case_id: "rx_001" },
  ];
  if (confirm) commands.push({ kind: "fire", ids: ["ev_11"] });
  commands.forEach((command, i) => events.push(...planCommand(events, command, `2026-09-26T08:0${i}:00Z`)));
  return events;
}

describe("frontend views of the real Maria command loop", () => {
  it("keeps resource acknowledgment pending at the patient stop", () => {
    const events = mariaLoop();
    const c = deriveCases(CATALOG, events)[0];
    expect(c.cardUsed).toBe(true);
    expect(c.status).toBe("fix_sent");
    expect(c.recovered).toBe(false);
    expect(boardStop(c)).toBe(2);
    expect(accessSummary(events).recovered).toBe(0);
    const notes = buildThread([c], events, CATALOG).filter(b => b.kind === "note");
    expect(notes.at(-1)).toMatchObject({ text: expect.stringMatching(/acknowledged.*pending/i) });
  });

  it("completes the final stop and counts one independent fill without synthetic started/recovered events", () => {
    const events = mariaLoop(true);
    const c = deriveCases(CATALOG, events)[0];
    expect(c.status).toBe("dispensed");
    expect(c.recovered).toBe(true);
    expect(boardStop(c)).toBe(3);
    expect(accessSummary([...events, events.at(-1)!])).toEqual({
      recovered: 1, median_ttff_seconds: 300, reason_tally: { DECLINED_AT_PRICE: 1 },
    });
    expect(buildThread([c], events, CATALOG).at(-1)).toMatchObject({
      kind: "note", text: expect.stringMatching(/pharmacy.*fill confirmed/i),
    });
  });

  it("does not turn patient/system/hub claims or synthetic milestones into pharmacy confirmation", () => {
    const pending = mariaLoop();
    const claim = SCRIPT.find(e => e.id === "ev_11")!;
    for (const actor of ["patient", "system", "hub"] as const) {
      const events = [...pending, { ...claim, actor }];
      expect(boardStop(deriveCases(CATALOG, events)[0])).toBe(2);
      expect(accessSummary(events).recovered).toBe(0);
    }
    const synthetic = [...pending, ...(rawEvents.events as FillEvent[]).filter(e => ["started", "recovered", "dispensed"].includes(e.type))];
    expect(boardStop(deriveCases(CATALOG, synthetic)[0])).toBe(2);
    expect(accessSummary(synthetic).recovered).toBe(0);
    expect(accessSummary([claim]).recovered).toBe(0);
  });

  it("requires a preceding prescription in event order before counting a pharmacy confirmation", () => {
    const events = mariaLoop(true);
    const confirmation = events.at(-1)!;
    const premature = [confirmation, ...events.slice(0, -1)];
    expect(accessSummary(premature)).toMatchObject({ recovered: 0, median_ttff_seconds: null });
    expect(boardStop(deriveCases(CATALOG, premature)[0])).toBe(2);

    const later = [...premature, { ...confirmation, id: "later-confirmation", at: "2026-09-26T08:10:00Z" }];
    expect(accessSummary(later)).toMatchObject({ recovered: 1, median_ttff_seconds: 600 });
    expect(boardStop(deriveCases(CATALOG, later)[0])).toBe(3);
  });

  it("counts the latest classified reason once for each prescribed case", () => {
    const events = mariaLoop(true);
    const reason = events.find(e => e.type === "reason_classified")!;
    const updated = { ...reason, id: "updated", reason: "COPAY_NOT_APPLIED" as const };
    const orphan = { ...reason, id: "orphan", case_id: "unknown" };
    expect(accessSummary([...events, reason, updated, orphan]).reason_tally).toEqual({ COPAY_NOT_APPLIED: 1 });
  });

  it.each(["bad timestamp", "2026-09-26T07:00:00Z", Number.POSITIVE_INFINITY])(
    "excludes invalid or negative first-fill duration: %s", (at) => {
      const events = mariaLoop(true);
      events[events.length - 1] = { ...events.at(-1)!, at };
      expect(accessSummary(events)).toMatchObject({ recovered: 1, median_ttff_seconds: null });
    },
  );

  it("preserves Safari-compatible Postgres timestamp parsing", () => {
    expect(atSeconds("2026-09-26 05:00:00+00")).toBe(Date.parse("2026-09-26T05:00:00Z") / 1000);
  });

  it("uses one first-fill duration per case when later claims arrive", () => {
    const events = mariaLoop(true);
    const order = events[0];
    const fill = events.at(-1)!;
    const secondCase: FillEvent[] = [
      { ...order, id: "second-order", case_id: "rx_002", at: "2026-09-26 08:00:00+00" },
      { ...fill, id: "second-fill", case_id: "rx_002", at: "2026-09-26 08:15:00+00" },
      { ...fill, id: "repeat-fill", at: "2026-09-26T09:00:00Z" },
    ];
    expect(accessSummary([...events, ...secondCase])).toMatchObject({
      recovered: 2, median_ttff_seconds: 600,
    });
  });
});
