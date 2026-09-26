import { expect, it } from "vitest";
import { SCRIPT } from "@/components/data/catalog";

it("keeps offline previews free of treatment-start and unverified provider claims", () => {
  expect(SCRIPT.some(e => e.type === "started" || e.type === "recovered")).toBe(false);
  expect(SCRIPT.filter(e => e.actor !== "pharmacy" && e.actor !== "hub").every(e => !e.note)).toBe(true);
  expect(SCRIPT.find(e => e.id === "ev_06")?.wrist).toContain("first fill pending");
  expect(SCRIPT.some(e => e.wrist?.includes("started"))).toBe(false);
  expect(SCRIPT.find(e => e.id === "ev_11")?.status_text).toBe("Dispensed");
  expect(SCRIPT.filter(e => ["ev_21", "ev_21b", "ev_22"].includes(e.id)).every(e => e.fix === "ACCESS_SUPPORT")).toBe(true);
});
