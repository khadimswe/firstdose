import { expect, it } from "vitest";
import { SCRIPT } from "@/components/data/catalog";
import { canFireLive, liveBeats } from "@/components/data/simulator";

it("offers only independent simulator inputs, never screen actions or generated alerts", () => {
  expect(liveBeats(SCRIPT).flatMap(b => b.events.map(e => e.id))).toEqual(["ev_04", "ev_05", "ev_11", "ev_16", "ev_17", "ev_18"]);
  expect(canFireLive(["ev_06"], new Set(["ev_05"]))).toBe(false);
  expect(canFireLive(["ev_01"], new Set())).toBe(false);
  expect(liveBeats(SCRIPT).find(b => b.id === "ev_05")!.events[0].note).toBe("");
});
it("keeps confirmation disabled until acknowledgment and checks ordered batches", () => {
  expect(canFireLive(["ev_11"], new Set(["ev_09"]))).toBe(false);
  expect(canFireLive(["ev_11"], new Set(["ev_10"]))).toBe(true);
  expect(canFireLive(["ev_04", "ev_05"], new Set(["ev_01"]))).toBe(true);
  expect(canFireLive(["ev_05", "ev_04"], new Set(["ev_01"]))).toBe(false);
  expect(canFireLive(["ev_11"], new Set(["ev_10", "ev_11"]))).toBe(false);
});
