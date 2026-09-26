import { describe, expect, it } from "vitest";
import { CATALOG } from "@/components/data/catalog";
import {
  acceptSnapshot,
  approvalSteps,
  interactivePrescriber,
  isAssigned,
  linkedAt,
  parseCoordinatorSnapshot,
  serverLinkStatus,
  type CoordinatorSnapshot,
} from "@/components/data/coordinatorLinks";
import { deriveCases } from "@/components/data/derive";

const RUN_A = "11111111-1111-4111-8111-111111111111";
const RUN_B = "22222222-2222-4222-8222-222222222222";

function snap(run: string, revision: number, status?: "pending" | "linked", extra: Partial<CoordinatorSnapshot> = {}): CoordinatorSnapshot {
  return {
    run_id: run,
    revision,
    events: [],
    links: status ? [{ coordinator_id: "coord_demo", prescriber_id: "prescriber_demo", status }] : [],
    cases: [],
    ...extra,
  };
}

describe("coordinator links (C7)", () => {
  it("parses a valid snapshot and rejects malformed ones", () => {
    expect(parseCoordinatorSnapshot(snap(RUN_A, 3, "pending")).revision).toBe(3);
    expect(() => parseCoordinatorSnapshot({ run_id: "nope", revision: 0, events: [], links: [], cases: [] })).toThrow();
    expect(() => parseCoordinatorSnapshot({ ...snap(RUN_A, 0), links: [{ coordinator_id: "coord_demo", prescriber_id: "prescriber_demo", status: "maybe" }] })).toThrow();
    expect(() => parseCoordinatorSnapshot(null)).toThrow();
  });

  it("reads the demo pair's status, approval time and assignments", () => {
    expect(serverLinkStatus(null)).toBe("none");
    expect(serverLinkStatus(snap(RUN_A, 1, "pending"))).toBe("pending");
    const linked = snap(RUN_A, 2, "linked", {
      events: [{ id: "e1", type: "coordinator_linked", coordinator_id: "coord_demo", prescriber_id: "prescriber_demo", case_id: null, actor: "doctor", at: "2026-09-26T17:00:00Z" }],
      cases: [{ case_id: "rx_001", coordinator_id: "coord_demo" }],
    });
    expect(serverLinkStatus(linked)).toBe("linked");
    expect(linkedAt(linked)).toBe(Date.parse("2026-09-26T17:00:00Z"));
    expect(isAssigned(linked, "rx_001")).toBe(true);
    expect(isAssigned(linked, "rx_002")).toBe(false);
  });

  it("only writes what the approve tap still needs", () => {
    expect(approvalSteps("none")).toEqual(["request", "approve"]);
    expect(approvalSteps("pending")).toEqual(["approve"]);
    expect(approvalSteps("linked")).toEqual([]);
  });

  it("maps prescriber_demo to the live cases' prescriber, not the seeded week's", () => {
    const cases = deriveCases(CATALOG, []);
    const live = cases.find((c) => c.id === "rx_001")!;
    expect(interactivePrescriber(cases)).toBe(live.rx.prescriber_label);
  });

  it("fences runs: a reset retires the old run, and old revisions never win", () => {
    let fence = { current: null as CoordinatorSnapshot | null, retired: new Set<string>() as ReadonlySet<string> };
    let r = acceptSnapshot(fence, snap(RUN_A, 2, "pending"));
    expect(r.accepted).toBe(true);
    fence = r.fence;
    expect(acceptSnapshot(fence, snap(RUN_A, 1)).accepted).toBe(false);
    r = acceptSnapshot(fence, snap(RUN_A, 3, "linked"));
    expect(r.accepted).toBe(true);
    fence = r.fence;
    r = acceptSnapshot(fence, snap(RUN_B, 0));
    expect(r.accepted).toBe(true);
    fence = r.fence;
    expect(fence.retired.has(RUN_A)).toBe(true);
    // A late response from the old run can't overwrite the new run.
    expect(acceptSnapshot(fence, snap(RUN_A, 9, "linked")).accepted).toBe(false);
  });
});
