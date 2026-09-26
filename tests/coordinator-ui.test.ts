import { beforeEach, describe, expect, it, vi } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import type { CaseView } from "@/components/data/types";
import { CATALOG, SCRIPT } from "@/components/data/catalog";
import { deriveCases } from "@/components/data/derive";
import { voiceResult } from "@/app/(screens)/doctor/_components/voice";

const ui = vi.hoisted(() => ({ cases: [] as CaseView[], live: true, linked: false, pending: false, ready: true,
  act: vi.fn(async () => {}), handoff: vi.fn(async () => true), localApprove: vi.fn(), request: vi.fn(async () => true), approve: vi.fn(async () => true) }));
vi.mock("@/components/data/useEvents", () => ({ useEvents: () => ({ cases: ui.cases, canAct: () => true, act: ui.act }) }));
vi.mock("@/components/data/local", () => ({ useLocal: () => ({ approved: { [ui.cases[0]?.rx.prescriber_label ?? ""]: 1 }, marks: {}, requests: [] }), local: { approve: ui.localApprove } }));
vi.mock("@/components/data/coordinator", async () => { const { CATALOG, isWeekCase } = await import("@/components/data/catalog"); return { DEMO_PRESCRIBER: CATALOG.cases.find(row => !isWeekCase(row.id))!.prescriber_label, useCoordinator: () => ({
  live: ui.live, ready: ui.ready, pending: ui.pending, error: null, loginPath: null, snapshot: { links: [], events: [], cases: [] },
  linked: () => ui.linked, handoff: ui.handoff, request: ui.request, approve: ui.approve, refresh: vi.fn(),
}) }; });
import { useHandoff } from "@/app/(screens)/doctor/_components/ApproveSheet";
import { Profile } from "@/app/(screens)/doctor/_components/Profile";
import { PrescribersScreen } from "@/app/(screens)/coordinator/_components/PrescribersScreen";

beforeEach(() => { vi.clearAllMocks(); ui.cases = deriveCases(CATALOG, SCRIPT.slice(0, 6)); ui.live = true; ui.ready = true; ui.pending = false; ui.linked = false; });
function handoffHook() {
  let result!: ReturnType<typeof useHandoff>;
  function Probe() { result = useHandoff(); return result.sheet; }
  renderToStaticMarkup(createElement(Probe)); return result;
}
describe("coordinator approval UI", () => {
  it("Profile reports persisted unlinked state despite local approval", () => {
    const html = renderToStaticMarkup(createElement(Profile));
    expect(html).toContain("Not linked"); expect(html).not.toContain("already verified");
    expect(html).toContain('role="status"'); expect(html).toContain('role="alert"');
  });
  it("uses the catalog identity and NPI records for the scoped live request", () => {
    const html = renderToStaticMarkup(createElement(PrescribersScreen));
    expect(html).toContain(`Request ${ui.cases[0].rx.prescriber_label} approval`);
    expect(html).toContain("approved you yet.");
    expect(html).toContain("NPI "); expect(html).not.toContain("Dr. Demo");
  });
  it("routes a voice-confirmed proposal through persisted assignment and handoff", async () => {
    ui.linked = true;
    const api = handoffHook();
    const proposal = voiceResult(200, { transcript: "send Maria to my coordinator", intent: "SEND_TO_COORDINATOR", case_id: "rx_001" });
    expect(proposal.kind).toBe("proposal"); if (proposal.kind === "proposal") api.request(proposal.caseId);
    await Promise.resolve();
    expect(ui.handoff).toHaveBeenCalledExactlyOnceWith(ui.cases.find(row => row.id === "rx_001"));
    expect(ui.act).not.toHaveBeenCalled(); expect(ui.localApprove).not.toHaveBeenCalled();
  });
  it("does not send an unapproved voice proposal before the approval sheet is confirmed", () => {
    handoffHook().request("rx_001"); expect(ui.handoff).not.toHaveBeenCalled(); expect(ui.act).not.toHaveBeenCalled();
  });
  it("keeps the offline linked handoff on the existing mock action", () => {
    ui.live = false; ui.linked = true; handoffHook().request("rx_001");
    expect(ui.act).toHaveBeenCalledExactlyOnceWith("handoff", "rx_001"); expect(ui.handoff).not.toHaveBeenCalled();
  });
});
