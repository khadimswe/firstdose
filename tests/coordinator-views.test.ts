import { describe, expect, it } from "vitest";
import { CATALOG, SCRIPT } from "@/components/data/catalog";
import { deriveCases, prescriberLinked, queueBucket, waitingOn } from "@/components/data/derive";
import { isValidNpi } from "@/components/data/npi";

function maria(upto: string) {
  const fired = SCRIPT.slice(0, SCRIPT.findIndex((e) => e.id === upto) + 1);
  return deriveCases(CATALOG, fired).find((c) => c.id === "rx_001")!;
}

describe("coordinator views (v2)", () => {
  it("checks the NPI check digit (CMS example 1234567893)", () => {
    expect(isValidNpi("1234567893")).toBe(true);
    expect(isValidNpi("1234567890")).toBe(false);
    expect(isValidNpi("12345")).toBe(false);
  });

  it("says who Maria is waiting on at each step", () => {
    expect(waitingOn(maria("ev_03"))).toBe("Pharmacy");
    expect(waitingOn(maria("ev_06"))).toBe("Doctor");
    expect(waitingOn(maria("ev_08"))).toBe("Coordinator");
    expect(waitingOn(maria("ev_09"))).toBe("Patient");
    expect(waitingOn(maria("ev_10"))).toBe("Pharmacy");
    expect(waitingOn(maria("ev_11"))).toBeNull();
  });

  it("puts Maria in the right queue bucket", () => {
    expect(queueBucket(maria("ev_06"))).toBe("waiting");
    expect(queueBucket(maria("ev_08"))).toBe("needs_you");
    expect(queueBucket(maria("ev_11"))).toBe("confirmed");
  });

  it("links the prescriber by approval or by the first handoff", () => {
    const before = deriveCases(CATALOG, SCRIPT.slice(0, 6));
    const p = before[0].rx.prescriber_label;
    expect(prescriberLinked(p, before, {})).toBe(false);
    expect(prescriberLinked(p, before, { [p]: 1 })).toBe(true);
    const after = deriveCases(CATALOG, SCRIPT.slice(0, SCRIPT.findIndex((e) => e.id === "ev_07") + 1));
    expect(prescriberLinked(p, after, {})).toBe(true);
  });
});
