import { describe, expect, it } from "vitest";
import { WEEK_PATIENTS, WEEK_CASES, WEEK_EVENTS, seedWeekEvents } from "@/lib/demo-week";
import { CATALOG } from "@/components/data/catalog";
import { deriveCases, queueBucket } from "@/components/data/derive";
import { isLinked } from "@/components/data/links";
import { planCommand } from "@/lib/server/workflow";

const now = "2026-09-26T16:00:00.000Z";
// CATALOG already includes the seeded week (Deem's 6.1 wiring); de-duplicating keeps this valid either way.
const uniq = <T extends { id: string }>(rows: T[]) => [...new Map(rows.map(r => [r.id, r])).values()];
const catalog = { ...CATALOG, patients: uniq([...CATALOG.patients, ...WEEK_PATIENTS]), cases: uniq([...CATALOG.cases, ...WEEK_CASES]) };
const buckets = (events: ReturnType<typeof seedWeekEvents>) => {
  const cases = deriveCases(catalog, events).filter(c => c.ordered);
  return ["needs_you", "waiting", "confirmed"].map(bucket => cases.filter(c => queueBucket(c) === bucket).length);
};

describe("fictional seed week", () => {
  it("gives the prepared queue its own prescriber without approving the live doctor", () => {
    const cases = deriveCases(catalog, seedWeekEvents(now));
    const background = WEEK_CASES[0].prescriber_label;
    const live = CATALOG.cases.find(row => row.id === "rx_001")!.prescriber_label;
    expect(new Set(WEEK_CASES.map(row => row.prescriber_label))).toEqual(new Set([background]));
    expect(background).not.toBe(live);
    expect(isLinked(background, cases, {})).toBe(true);
    expect(isLinked(live, cases, {})).toBe(false);
  });

  it("has 13 fixed separate records and the same 3/2/8 queue in offline and persisted form", () => {
    expect(WEEK_PATIENTS).toHaveLength(13);
    expect(WEEK_CASES).toHaveLength(13);
    expect(WEEK_PATIENTS[0].name).toBe("Daniel Brooks");
    expect(WEEK_PATIENTS.at(-1)?.name).toBe("Gregory Hayes");
    expect(new Set(catalog.patients.map(p => p.id)).size).toBe(15);
    expect(new Set(catalog.cases.map(c => c.id)).size).toBe(15);
    expect(buckets(WEEK_EVENTS)).toEqual([3, 2, 8]);
    expect(buckets(seedWeekEvents(now))).toEqual([3, 2, 8]);
    expect(WEEK_EVENTS.every(e => e.note === "" && e.wrist === null && e.side === "practice")).toBe(true);
    expect(WEEK_EVENTS.every(e => /^ev_[A-Za-z0-9_]+$/.test(e.id))).toBe(true);
    expect(WEEK_EVENTS.some(e => ["started", "recovered", "label_shown", "alert_sent"].includes(e.type))).toBe(false);
    expect(WEEK_CASES.every(c => ["drug_otezla", "drug_humira"].includes(c.drug_id))).toBe(true);
  });

  it("anchors the synthetic week before the seed command without mutating numeric offline times", () => {
    const original = structuredClone(WEEK_EVENTS);
    const events = seedWeekEvents(now);
    expect(events[0].at).toBe("2026-09-20T16:00:00.000Z");
    expect(events.every(e => typeof e.at === "string" && Date.parse(e.at) < Date.parse(now))).toBe(true);
    expect(events.every((e, i) => i === 0 || Date.parse(String(e.at)) > Date.parse(String(events[i - 1].at)))).toBe(true);
    expect(WEEK_EVENTS).toEqual(original);
    expect(WEEK_EVENTS.every(event => typeof event.at === "number" && event.at < 0)).toBe(true);
    expect(seedWeekEvents(now)).toEqual(events);
  });

  it("seeds an empty run once and leaves Maria/James unprescribed", () => {
    const events = planCommand([], { kind: "seed_week" }, now);
    expect(events).toEqual(seedWeekEvents(now));
    expect(events.some(e => ["rx_001", "rx_002"].includes(e.case_id))).toBe(false);
    expect(planCommand(events, { kind: "seed_week" }, "2026-09-26T17:00:00.000Z")).toEqual([]);
    expect(planCommand(events, { kind: "prescribe", patient_id: "pt_maria", drug_id: "drug_otezla" }, now).map(e => e.id)).toEqual(["ev_01", "ev_03"]);
  });

  it("requires reset before seeding an active or partially seeded run", () => {
    const existing = planCommand([], { kind: "prescribe", patient_id: "pt_maria", drug_id: "drug_otezla" }, now);
    expect(() => planCommand(existing, { kind: "seed_week" }, now)).toThrowError(expect.objectContaining({ code: "invalid_transition" }));
    expect(() => planCommand(seedWeekEvents(now).slice(1), { kind: "seed_week" }, now)).toThrowError(expect.objectContaining({ code: "invalid_transition" }));
    expect(() => planCommand([], { kind: "seed_week", events: [] } as never, now)).toThrowError(expect.objectContaining({ code: "invalid_command" }));
  });

  it("lets the coordinator send seeded fixes and blocks a copay card for Medicare", () => {
    const events = seedWeekEvents(now);
    const medicare = deriveCases(catalog, events).find(c => c.patient.insurance.type === "medicare" && c.status === "handed_off")!;
    expect(medicare).toBeDefined();
    expect(medicare.fix).toBe("ACCESS_SUPPORT");
    expect(() => planCommand(events, { kind: "fix", case_id: medicare.id, fix: "RESEND_COPAY_CARD" }, now)).toThrowError(expect.objectContaining({ code: "invalid_command" }));
    const sent = planCommand(events, { kind: "fix", case_id: medicare.id, fix: "ACCESS_SUPPORT" }, now);
    expect(sent).toHaveLength(1);
    expect(sent[0]).toMatchObject({ case_id: medicare.id, type: "fix_sent", fix: "ACCESS_SUPPORT", wrist: null });
    expect(sent[0].id).toMatch(/^ev_[A-Za-z0-9_]+$/);
    expect(buckets([...events, ...sent])).toEqual([2, 3, 8]);
    expect(planCommand([...events, ...sent], { kind: "fix", case_id: medicare.id, fix: "ACCESS_SUPPORT" }, now)).toEqual([]);
  });
});
