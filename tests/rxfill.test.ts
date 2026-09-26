import { describe, expect, it } from "vitest";
import { CATALOG, SCRIPT } from "@/components/data/catalog";
import { deriveCases, queueBucket } from "@/components/data/derive";
import type { FillEvent } from "@/components/data/types";
import { WEEK_EVENTS, seedWeekEvents } from "@/lib/demo-week";
import { projectRxFill } from "@/lib/rxfill";

function event(overrides: Partial<FillEvent> = {}): FillEvent {
  return { ...SCRIPT.find(row => row.id === "ev_04")!, type: "status", ...overrides };
}

describe("simulated RxFill projection", () => {
  it("shows NotDispensed vocabulary while preserving the original status and note", () => {
    const source = Object.freeze(event());
    const result = projectRxFill(source)!;
    expect(result).not.toBeNull();
    expect(result.source_event).toEqual(source);
    expect(result.source_event).not.toBe(source);
    expect(result.RxFill).toEqual({ FillStatus: { NotDispensed: { Note: source.note } } });
    expect(result.dispensing_status).toBe("NotDispensed");
    expect(result.synthetic_example).toBeNull();
    expect(result.simulated).toBe(true);
    expect(result.label).toBe("Simulated pharmacy · real RxFill vocabulary");
    expect(result.wire_payload).toBe(false);
    expect(result.source_kind).toBe("fill_status");
  });

  it("keeps RxFillIndicator in a separate, explicitly synthetic prescriber request", () => {
    const result = projectRxFill(event())!;
    expect(result.request_context).toEqual({
      simulated: true, message_type: "NewRx", SCRIPT_reference: "2023011", RxFillIndicator: ["All"],
    });
    expect(result.RxFill).not.toHaveProperty("RxFillIndicator");
    expect(result.source_event).not.toHaveProperty("RxFillIndicator");
  });

  it.each(["ev_04", "ev_11"])("keeps legacy claim %s as illustration only, not a fill report", id => {
    const source = SCRIPT.find(row => row.id === id)!;
    const result = projectRxFill(source)!;
    expect(result.source_kind).toBe("claim");
    expect(result.RxFill).toBeNull();
    expect(result.dispensing_status).toBeNull();
    expect(result.synthetic_example).toEqual({
      simulated: true, basis: "legacy_status_text_only",
      RxFill: { FillStatus: { [id === "ev_04" ? "NotDispensed" : "Dispensed"]: { Note: source.note } } },
    });
  });

  it.each(["Rejected", "Paid", "Not dispensed / returned to stock", "Dispensed"])(
    "never turns a rejected claim (%s) into a pharmacy fill status", status_text => {
      const result = projectRxFill(event({ type: "claim_run", status_text, reject_code: "75" }))!;
      expect(result.source_event.reject_code).toBe("75");
      expect(result.RxFill).toBeNull();
      expect(result.synthetic_example).toBeNull();
      expect(result.dispensing_status).toBeNull();
    },
  );

  it.each(["Paid", "Rejected", null])("does not infer a fill from claim payment or amount (%s)", status_text => {
    const result = projectRxFill(event({ type: "claim_run", status_text, amount_usd: 0 }))!;
    expect(result.RxFill).toBeNull();
    expect(result.synthetic_example).toBeNull();
    expect(result.dispensing_status).toBeNull();
  });

  it.each([
    ["Dispensed", "Dispensed"], ["Partially dispensed", "PartiallyDispensed"],
    ["Transferred to another pharmacy", "Transferred"], ["Returned to stock", "NotDispensed"],
  ])("maps explicit pharmacy status %s to %s", (status_text, status) => {
    const result = projectRxFill(event({ status_text, note: "" }))!;
    expect(result.dispensing_status).toBe(status);
    expect(result.RxFill).toEqual({ FillStatus: { [status]: {} } });
    expect(result.source_event.status_text).toBe(status_text);
  });

  it("recognizes a dedicated dispensing event without inventing a source status", () => {
    const result = projectRxFill(event({ type: "dispensed", status_text: null }))!;
    expect(result.dispensing_status).toBe("Dispensed");
    expect(result.source_event.status_text).toBeNull();
  });

  it.each(["Unable to Reach Patient", "Not dispensed?", " DISPENSED ", null])(
    "fails closed for unrecognized status (%s)", status_text => {
      const result = projectRxFill(event({ status_text }))!;
      expect(result.RxFill).toBeNull();
      expect(result.dispensing_status).toBeNull();
      expect(result.source_event.status_text).toBe(status_text);
    },
  );

  it("fails closed for contradictory dispensing fields", () => {
    for (const overrides of [
      { type: "dispensed" as const, status_text: "Not dispensed" },
      { status_text: "Dispensed", reject_code: "75" },
    ]) {
      const result = projectRxFill(event(overrides))!;
      expect(result.RxFill).toBeNull();
      expect(result.dispensing_status).toBeNull();
    }
  });

  it("never copies claim reject codes or application reasons into a SCRIPT ReasonCode", () => {
    const result = projectRxFill(event({ reason: "DECLINED_AT_PRICE" }))!;
    expect(result.source_event.reason).toBe("DECLINED_AT_PRICE");
    expect(result.RxFill).toEqual({ FillStatus: { NotDispensed: { Note: result.source_event.note } } });
  });

  it("does not promote hub, patient, system or pharma-side events to pharmacy messages", () => {
    for (const source of [
      event({ actor: "hub" }), event({ actor: "patient", type: "copay_card_used" }),
      event({ actor: "system", type: "started" }), event({ side: "ascend" }),
    ]) expect(projectRxFill(source)).toBeNull();
  });

  it("keeps unrelated pharmacy event types informational", () => {
    const result = projectRxFill(event({ type: "copay_card_used", status_text: "Dispensed" }))!;
    expect(result.source_kind).toBe("other");
    expect(result.RxFill).toBeNull();
    expect(result.synthetic_example).toBeNull();
    expect(result.dispensing_status).toBeNull();
  });

  it("preserves the existing Maria workflow's independent simulated pharmacy confirmation", () => {
    const fired = SCRIPT.slice(0, SCRIPT.findIndex(row => row.id === "ev_11") + 1);
    const before = JSON.stringify(fired);
    fired.map(projectRxFill);
    expect(JSON.stringify(fired)).toBe(before);
    const maria = deriveCases(CATALOG, fired).find(row => row.id === "rx_001")!;
    expect(maria.statusText).toBe("Dispensed");
    expect(queueBucket(maria)).toBe("confirmed");
  });

  it("preserves ordering and IDs across offline and live seed events without fabricating fills", () => {
    for (const sourceEvents of [WEEK_EVENTS, seedWeekEvents("2026-09-26T16:00:00Z")]) {
      const projections = sourceEvents.map(projectRxFill).filter(row => row !== null);
      const pharmacyEvents = sourceEvents.filter(row => row.actor === "pharmacy" && row.side === "practice");
      expect(projections.map(row => row.source_event)).toEqual(pharmacyEvents);
      expect(projections).toHaveLength(8);
      expect(projections.every(row => row.RxFill === null && row.dispensing_status === null)).toBe(true);
      expect(projections.every(row => row.synthetic_example?.RxFill.FillStatus.Dispensed)).toBe(true);
    }
  });

  it("allocates independent payloads without mutating input or future projections", () => {
    const source = event();
    const before = JSON.stringify(source);
    const first = projectRxFill(source)!;
    first.source_event.status_text = "changed";
    first.request_context.RxFillIndicator.push("All");
    expect(JSON.stringify(source)).toBe(before);
    expect(projectRxFill(source)!.request_context.RxFillIndicator).toEqual(["All"]);
    expect(projectRxFill(source)!.source_event.status_text).toBe(source.status_text);
  });
});
