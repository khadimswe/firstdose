import { describe, expect, it, vi } from "vitest";
import { completeFollowup } from "@/lib/server/live-command-http";

const checkpoint = { kind: "fire" as const, run_id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa", revision: 2 };
describe("independent notification and analytics follow-up", () => {
  it.each(["analytics", "notifications"])("attempts both jobs even when %s fails and sanitizes its error", async failing => {
    const deliver = vi.fn(async () => { if (failing === "notifications") throw new Error("private details"); });
    const replay = vi.fn(async () => { if (failing === "analytics") throw new Error("private details"); });
    const warning = vi.spyOn(console, "warn").mockImplementation(() => {});
    try {
      await completeFollowup(checkpoint, { deliver, replay });
      expect(deliver).toHaveBeenCalledOnce();
      expect(replay).toHaveBeenCalledExactlyOnceWith(checkpoint.run_id);
      expect(JSON.stringify(warning.mock.calls)).not.toContain("private details");
    } finally { warning.mockRestore(); }
  });
  it("replays seed history without delivering historical notifications", async () => {
    const deliver = vi.fn();
    const replay = vi.fn();
    await completeFollowup({ ...checkpoint, kind: "seed_week" }, { notifications: false, deliver, replay });
    expect(deliver).not.toHaveBeenCalled();
    expect(replay).toHaveBeenCalledExactlyOnceWith(checkpoint.run_id);
  });
});
