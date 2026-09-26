import { describe, expect, it } from "vitest";
import type { FillEvent } from "@/components/data/types";
import { planCommand, type WorkflowCommand } from "@/lib/server/workflow";

const NOW = "2026-09-26T06:00:00.000Z";
const prescribe: WorkflowCommand = { kind: "prescribe", patient_id: "pt_maria", drug_id: "drug_otezla" };
const handoff: WorkflowCommand = { kind: "handoff", case_id: "rx_001" };
const fix: WorkflowCommand = { kind: "fix", case_id: "rx_001", fix: "RESEND_COPAY_CARD" };
const use: WorkflowCommand = { kind: "use_card", case_id: "rx_001" };
const fire = (...ids: string[]): WorkflowCommand => ({ kind: "fire", ids });

function run(...commands: WorkflowCommand[]) {
  const history: FillEvent[] = [];
  for (const command of commands) history.push(...planCommand(history, command, NOW));
  return history;
}

describe("workflow command planning", () => {
  it("creates Maria's template-backed app alert in the reason batch and only once", () => {
    const ordered = run(prescribe, fire("ev_04"));
    // The alert must use the committed quote, not the canned event's wrist copy.
    ordered.find((event) => event.id === "ev_04")!.amount_usd = 125.5;
    const pending = planCommand(ordered, fire("ev_05", "ev_05"), NOW);
    expect(pending.map((event) => event.id)).toEqual(["ev_05", "ev_06"]);
    expect(pending[1]).toMatchObject({
      type: "alert_sent", actor: "system", side: "practice", reason: "DECLINED_AT_PRICE",
      wrist: "Maria: Otezla not started. Declined at price ($125.50 demo).", note: "", fix: null,
    });
    expect(planCommand([...ordered, ...pending], fire("ev_05"), NOW)).toEqual([]);
    expect(pending.every((event) => !["label_shown", "started", "recovered"].includes(event.type))).toBe(true);
  });

  it("creates James's template-backed app alert without claiming provider delivery", () => {
    const ordered = run({ kind: "prescribe", patient_id: "pt_james", drug_id: "drug_humira" });
    const pending = planCommand(ordered, fire("ev_16", "ev_17", "ev_18"), NOW);
    expect(pending.map((event) => event.id)).toEqual(["ev_16", "ev_17", "ev_18", "ev_19"]);
    expect(pending[3]).toMatchObject({
      type: "alert_sent", reason: "UNABLE_TO_REACH", side: "practice",
      wrist: "James: Humira not started. Hub can't reach patient (3 calls).", note: "", fix: null,
    });
    expect(planCommand([...ordered, ...pending], fire("ev_18"), NOW)).toEqual([]);
  });

  it("discloses simulated savings-card delivery and resend in the returned events", () => {
    const history = run(prescribe, fire("ev_04", "ev_05"), handoff, fix);
    const delivery = history.find((event) => event.id === "ev_03")!;
    const resend = history.find((event) => event.id === "ev_09")!;
    expect(delivery.type).toBe("copay_card_sent");
    expect(resend.type).toBe("fix_sent");
    for (const event of [delivery, resend]) {
      expect(event.note).toMatch(/simulated/i);
      expect(event.note).toMatch(/stand-in/i);
      expect(event.note).toMatch(/savings.card/i);
    }
    expect(resend.note).toMatch(/resend/i);
  });

  it("discloses James's simulated access-support request without claiming a bridge delivery", () => {
    const history = run(
      { kind: "prescribe", patient_id: "pt_james", drug_id: "drug_humira" },
      fire("ev_16", "ev_17", "ev_18"),
      { kind: "handoff", case_id: "rx_002" },
      { kind: "fix", case_id: "rx_002", fix: "ACCESS_SUPPORT" },
    );
    const sent = history.find((event) => event.id === "ev_21b")!;
    expect(sent).toMatchObject({ type: "fix_sent", fix: "ACCESS_SUPPORT" });
    expect(sent.note).toMatch(/simulated/i);
    expect(sent.note).toMatch(/stand-in/i);
    expect(sent.note).toMatch(/access.support/i);
    expect(sent.note).not.toMatch(/bridge|sample|QPharma|Medvantx/i);
  });

  it.each(["2026-02-30T06:00:00.000Z", "2026-02-29T06:00:00-04:00", "2026-04-31T06:00:00+02:00", "1900-02-29T06:00:00Z"])("rejects impossible calendar dates in the clock and history: %s", (timestamp) => {
    expect(() => planCommand([], prescribe, timestamp)).toThrow();
    const history = run(prescribe);
    history[0].at = timestamp;
    expect(() => planCommand(history, fire("ev_04"), NOW)).toThrow();
  });

  it.each(["2024-02-29T06:00:00-04:00", "2000-02-29T06:00:00Z"])("accepts valid leap-day timestamps: %s", (timestamp) => {
    expect(planCommand([], prescribe, timestamp)[0].at).toBe(new Date(timestamp).toISOString());
  });

  it("rejects numeric historical mock offsets as authoritative event times", () => {
    const history = run(prescribe);
    history[0].at = 0;
    expect(() => planCommand(history, fire("ev_04"), NOW)).toThrow();
  });

  it.each([prescribe, handoff, fix, use, fire("ev_04")])("rejects extra fields on a $kind command", (command) => {
    const history = run(prescribe, fire("ev_04", "ev_05"), handoff, fix);
    expect(() => planCommand(history, { ...command, trusted: true } as unknown as WorkflowCommand, NOW)).toThrow();
  });

  it("leaves history unchanged after successful planning and returns independent event objects", () => {
    const history = run(prescribe);
    const saved = structuredClone(history);
    history.forEach(Object.freeze);
    Object.freeze(history);
    const pending = planCommand(history, fire("ev_04", "ev_05"), NOW);
    expect(pending.map((event) => event.id)).toEqual(["ev_04", "ev_05", "ev_06"]);
    expect(history).toEqual(saved);
    pending[0].note = "Changed only in the returned plan.";
    expect(history).toEqual(saved);
    expect(planCommand(history, fire("ev_04", "ev_05"), NOW)[0].note).not.toBe(pending[0].note);
  });

  it("requires an order, barrier, reviewed handoff and sent resource before acknowledgment", () => {
    const empty: FillEvent[] = [];
    for (const command of [handoff, fix, use, fire("ev_04"), fire("ev_11")]) {
      expect(() => planCommand(empty, command, NOW)).toThrow();
    }
    const ordered = run(prescribe);
    expect(() => planCommand(ordered, handoff, NOW)).toThrow();
    const stuck = run(prescribe, fire("ev_04", "ev_05"));
    expect(() => planCommand(stuck, fix, NOW)).toThrow();
    const handedOff = run(prescribe, fire("ev_04", "ev_05"), handoff);
    expect(() => planCommand(handedOff, use, NOW)).toThrow();
  });

  it("keeps a patient tap separate from independent pharmacy confirmation", () => {
    const history = run(prescribe, fire("ev_04", "ev_05"), handoff, fix);
    const ack = planCommand(history, use, NOW);
    expect(ack.map((e) => e.id)).toEqual(["ev_10"]);
    expect(ack.map((e) => e.type)).toEqual(["copay_card_used"]);
    expect(ack.every((e) => e.amount_usd === null && e.wrist === null)).toBe(true);
    const confirmed = planCommand([...history, ...ack], fire("ev_11"), NOW);
    expect(confirmed).toMatchObject([{ id: "ev_11", actor: "pharmacy", type: "claim_run", status_text: "Dispensed" }]);
    expect(confirmed.some((e) => e.type === "started" || e.type === "recovered")).toBe(false);
  });

  it("retries each screen command without appending duplicate events, even after later steps", () => {
    const commands = [prescribe, fire("ev_04", "ev_05"), handoff, fix, use, fire("ev_11")];
    const history = run(...commands);
    for (const command of commands) expect(planCommand(history, command, NOW)).toEqual([]);
    expect(new Set(history.map((e) => e.id)).size).toBe(history.length);
  });

  it("rejects an injected fix instead of trusting the screen", () => {
    const history = run(prescribe, fire("ev_04", "ev_05"), handoff);
    expect(() => planCommand(history, { ...fix, fix: "BRIDGE_SAMPLE" }, NOW)).toThrow();
    const completed = [...history, ...planCommand(history, fix, NOW)];
    expect(() => planCommand(completed, { ...fix, fix: "BRIDGE_SAMPLE" }, NOW)).toThrow();
  });

  it("routes unreachable James to access support without invented bridge eligibility", () => {
    const history = run(
      { kind: "prescribe", patient_id: "pt_james", drug_id: "drug_humira" },
      fire("ev_16", "ev_17", "ev_18"),
      { kind: "handoff", case_id: "rx_002" },
      { kind: "fix", case_id: "rx_002", fix: "ACCESS_SUPPORT" },
    );
    expect(history.find((e) => e.id === "ev_21")?.fix).toBe("ACCESS_SUPPORT");
    expect(history.find((e) => e.id === "ev_21b")?.fix).toBe("ACCESS_SUPPORT");
    expect(history.some((e) => e.fix === "BRIDGE_SAMPLE")).toBe(false);
    expect(() => planCommand(history, { kind: "use_card", case_id: "rx_002" }, NOW)).toThrow();
  });

  it("validates a whole simulator batch in order without mutating input on failure", () => {
    const history = run(prescribe);
    const saved = structuredClone(history);
    expect(() => planCommand(history, fire("ev_04", "ev_11"), NOW)).toThrow();
    expect(history).toEqual(saved);
    expect(() => planCommand(history, fire("ev_05", "ev_04"), NOW)).toThrow();
    expect(planCommand(history, fire("ev_04", "ev_04", "ev_05"), NOW).map((e) => e.id)).toEqual(["ev_04", "ev_05", "ev_06"]);
  });

  it("does not let the simulator bypass commands or assert unverified integrations/outcomes", () => {
    const history = run(prescribe, fire("ev_04", "ev_05"), handoff, fix, use, fire("ev_11"));
    for (const id of ["ev_02", "ev_06", "ev_07", "ev_09", "ev_10", "ev_12", "ev_13", "ev_15", "ev_19", "ev_22", "missing"]) {
      expect(() => planCommand(history, fire(id), NOW)).toThrow();
    }
    expect(history.some((e) => /Gemini|Grok|byte-exact|ntfy/.test(e.note))).toBe(false);
    expect(history.filter((e) => e.type === "label_shown")).toEqual([]);
  });

  it("uses immutable ISO event time, keeps order on rapid commands, and rejects an invalid clock", () => {
    const history = run(prescribe, fire("ev_04", "ev_05"));
    const times = history.map((e) => Date.parse(e.at as string));
    expect(times.every(Number.isFinite)).toBe(true);
    expect(times[0]).toBe(Date.parse(NOW));
    expect(times.every((t, i) => i === 0 || t > times[i - 1])).toBe(true);
    expect(() => planCommand([], prescribe, "not-a-date")).toThrow();
    expect(() => planCommand([], prescribe, "2026-09-26T06:00:00")).toThrow();
  });

  it("keeps repeat runs independent by taking only the current run history", () => {
    const first = run(prescribe);
    expect(planCommand(first, prescribe, NOW)).toEqual([]);
    expect(planCommand([], prescribe, NOW).map((e) => e.id)).toEqual(first.map((e) => e.id));
  });

  it("rejects unknown cases, crossed patient/drug pairs and malformed runtime commands", () => {
    expect(() => planCommand([], { kind: "prescribe", patient_id: "pt_maria", drug_id: "drug_humira" }, NOW)).toThrow();
    expect(() => planCommand([], { kind: "handoff", case_id: "rx_missing" }, NOW)).toThrow();
    for (const command of [null, {}, { kind: "reset" }, { kind: "fire", ids: [] }, { kind: "fire", ids: [7] }]) {
      expect(() => planCommand([], command as WorkflowCommand, NOW)).toThrow();
    }
  });
});
