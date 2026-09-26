import { describe, expect, it } from "vitest";
import { CATALOG, SCRIPT } from "@/components/data/catalog";
import { deriveCases } from "@/components/data/derive";
import { inQueue } from "@/components/data/links";
import { coordinatorLinked, DEMO_PRESCRIBER } from "@/components/data/coordinator";
import { EMPTY_COORDINATOR, type CoordinatorState } from "@/components/data/coordinator-live";

const linked: CoordinatorState = { ...EMPTY_COORDINATOR, ready: true, snapshot: {
  run_id: "11111111-1111-4111-8111-111111111111", revision: 1, events: [], cases: [],
  links: [{ coordinator_id: "coord_demo", prescriber_id: "prescriber_demo", status: "linked" }],
} };
describe("persisted coordinator link views", () => {
  it("never uses local approvals or legacy handoff history as live approval", () => {
    const cases = deriveCases(CATALOG, SCRIPT.slice(0, SCRIPT.findIndex(row => row.id === "ev_07") + 1));
    expect(coordinatorLinked(DEMO_PRESCRIBER, cases, { [DEMO_PRESCRIBER]: 1 }, { ...EMPTY_COORDINATOR, ready: true }, true)).toBe(false);
    expect(coordinatorLinked(DEMO_PRESCRIBER, cases, {}, EMPTY_COORDINATOR, true)).toBe(false);
  });
  it("shows profile approval before a prescription without relying on fill events", () => {
    expect(coordinatorLinked(DEMO_PRESCRIBER, deriveCases(CATALOG, []), {}, linked, true)).toBe(true);
  });
  it("puts prescribed cases in the queue after profile-only persisted approval", () => {
    const cases = deriveCases(CATALOG, SCRIPT.slice(0, 1));
    const prescribers = new Set(cases.filter(row => coordinatorLinked(row.rx.prescriber_label, cases, {}, linked, true)).map(row => row.rx.prescriber_label));
    expect(cases.filter(row => inQueue(row, prescribers)).map(row => row.id)).toEqual(["rx_001"]);
  });
  it("does not display cached live approval as linked while reconnecting", () => {
    expect(coordinatorLinked(DEMO_PRESCRIBER, deriveCases(CATALOG, []), {}, { ...linked, ready: false }, true)).toBe(false);
  });
  it("keeps local mock approval behavior", () => {
    expect(coordinatorLinked(DEMO_PRESCRIBER, deriveCases(CATALOG, []), { [DEMO_PRESCRIBER]: 1 }, EMPTY_COORDINATOR, false)).toBe(true);
  });
  it("keeps the prepared background prescriber separate from the fixed demo identity", () => {
    const cases = deriveCases(CATALOG, []);
    const background = cases.find(row => row.rx.prescriber_label !== DEMO_PRESCRIBER)!;
    expect(background.rx.prescriber_label).toContain("Rivera");
    expect(coordinatorLinked(background.rx.prescriber_label, cases, {}, EMPTY_COORDINATOR, true)).toBe(true);
    expect(coordinatorLinked(DEMO_PRESCRIBER, cases, {}, EMPTY_COORDINATOR, true)).toBe(false);
  });
});
