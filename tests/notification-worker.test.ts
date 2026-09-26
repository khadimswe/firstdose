import { describe, expect, it, vi } from "vitest";
import { createNotificationStore, deliverNotifications, type NotificationClaim, type NotificationStore } from "@/lib/server/notification-worker";

const claim: NotificationClaim = {
  run_id: "63d4b651-0eb5-440d-a523-e8daf82f36ca", script_id: "ev_06",
  wrist: "Prepared fictional alert.", claim_id: "12c21f65-988b-401c-a1c5-1973656f77a6",
};
const env = { NEXT_PUBLIC_SUPABASE_URL: "https://demo.supabase.co", SUPABASE_SECRET_KEY: "sb_secret_test_only", NTFY_TOPIC: "test-only" };

function storeFor(rows: NotificationClaim[]) {
  const queue = [...rows];
  return {
    claim: vi.fn(async () => queue.shift() ?? null),
    finish: vi.fn<NotificationStore["finish"]>().mockResolvedValue(undefined),
  };
}

describe("claim-once notification delivery", () => {
  it("sends the committed wrist text once and records HTTP acceptance", async () => {
    const store = storeFor([claim]);
    const publish = vi.fn<(message: string) => Promise<void>>().mockResolvedValue(undefined);
    expect(await deliverNotifications({ store, publish })).toEqual({ attempted: 1, accepted: 1, unknown: 0 });
    expect(await deliverNotifications({ store, publish })).toEqual({ attempted: 0, accepted: 0, unknown: 0 });
    expect(publish.mock.calls).toEqual([[claim.wrist]]);
    expect(store.finish.mock.calls).toEqual([[claim, "accepted"]]);
  });

  it("records uncertain provider failure as unknown without retrying the request", async () => {
    const store = storeFor([claim]);
    const publish = vi.fn<(message: string) => Promise<void>>().mockRejectedValue(new Error("private provider failure"));
    expect(await deliverNotifications({ store, publish })).toEqual({ attempted: 1, accepted: 0, unknown: 1 });
    await deliverNotifications({ store, publish });
    expect(publish).toHaveBeenCalledTimes(1);
    expect(store.finish.mock.calls).toEqual([[claim, "unknown"]]);
  });

  it("does not resend or mark unknown when recording an accepted send fails", async () => {
    const store = storeFor([claim]);
    store.finish.mockRejectedValue(new Error("private database failure"));
    const publish = vi.fn<(message: string) => Promise<void>>().mockResolvedValue(undefined);
    await expect(deliverNotifications({ store, publish })).rejects.toMatchObject({ message: "unavailable" });
    await deliverNotifications({ store, publish });
    expect(publish).toHaveBeenCalledTimes(1);
    expect(store.finish.mock.calls).toEqual([[claim, "accepted"]]);
  });

  it("stops after two sequential deliveries and leaves remaining work for another invocation", async () => {
    const rows = [claim, { ...claim, script_id: "ev_19" }, { ...claim, script_id: "ev_99" }];
    const store = storeFor(rows);
    const order: string[] = [];
    const publish = async () => { order.push("publish"); };
    store.finish.mockImplementation(async (_row, status) => { order.push(status); });
    expect(await deliverNotifications({ store, publish })).toEqual({ attempted: 2, accepted: 2, unknown: 0 });
    expect(order).toEqual(["publish", "accepted", "publish", "accepted"]);
    expect(store.claim).toHaveBeenCalledTimes(2);
    expect((await deliverNotifications({ store, publish })).attempted).toBe(1);
  });

  it("does not contact the provider after an ambiguous claim failure", async () => {
    const store = storeFor([]);
    store.claim.mockRejectedValue(new Error("private database failure"));
    const publish = vi.fn<(message: string) => Promise<void>>();
    await expect(deliverNotifications({ store, publish })).rejects.toMatchObject({ message: "unavailable" });
    expect(store.claim).toHaveBeenCalledTimes(1);
    expect(publish).not.toHaveBeenCalled();
  });

  it("uses the real ntfy transport by default with injected network and configuration", async () => {
    const store = storeFor([claim]);
    const transport = vi.fn<typeof fetch>().mockResolvedValue(new Response("{}"));
    await deliverNotifications({ store, env, fetch: transport });
    expect(transport.mock.calls[0][0]).toBe("https://ntfy.sh/");
    expect(JSON.parse(transport.mock.calls[0][1]!.body as string).message).toBe(claim.wrist);
    expect(store.finish).toHaveBeenCalledWith(claim, "accepted");
  });
});

describe("notification RPC storage", () => {
  it("uses private apikey RPCs and binds finish to the unique claim", async () => {
    const transport = vi.fn<typeof fetch>().mockResolvedValueOnce(Response.json(claim)).mockResolvedValueOnce(Response.json(true)).mockResolvedValueOnce(Response.json(null));
    const store = createNotificationStore({ env, fetch: transport });
    expect(await store.claim()).toEqual(claim);
    await store.finish(claim, "unknown");
    expect(await store.claim()).toBeNull();
    expect(transport.mock.calls.map(([url]) => String(url))).toEqual([
      "https://demo.supabase.co/rest/v1/rpc/fd_claim_notification",
      "https://demo.supabase.co/rest/v1/rpc/fd_finish_notification",
      "https://demo.supabase.co/rest/v1/rpc/fd_claim_notification",
    ]);
    const request = transport.mock.calls[1][1]!;
    expect(new Headers(request.headers).get("apikey")).toBe(env.SUPABASE_SECRET_KEY);
    expect(new Headers(request.headers).has("authorization")).toBe(false);
    expect(request).toMatchObject({ method: "POST", redirect: "error", cache: "no-store" });
    expect(JSON.parse(request.body as string)).toEqual({ p_run_id: claim.run_id, p_script_id: claim.script_id, p_claim_id: claim.claim_id, p_status: "unknown" });
  });

  it.each([{}, { ...claim, claim_id: "bad" }, { ...claim, wrist: " " }, { ...claim, wrist: "x".repeat(201) }, { ...claim, script_id: "bad" }])("rejects malformed claims without delivering", async row => {
    const transport = vi.fn<typeof fetch>().mockResolvedValue(Response.json(row));
    await expect(createNotificationStore({ env, fetch: transport }).claim()).rejects.toMatchObject({ message: "unavailable" });
    expect(transport).toHaveBeenCalledTimes(1);
  });

  it("fails if the claim could not be finished and does not retry the RPC", async () => {
    const transport = vi.fn<typeof fetch>().mockResolvedValue(Response.json(false));
    await expect(createNotificationStore({ env, fetch: transport }).finish(claim, "accepted")).rejects.toMatchObject({ message: "unavailable" });
    expect(transport).toHaveBeenCalledTimes(1);
  });

  it.each([undefined, "http://demo.supabase.co", "https://demo.supabase.co/path", "https://user:pass@demo.supabase.co"])("rejects unsafe provider configuration before requesting", async url => {
    const transport = vi.fn<typeof fetch>();
    await expect(createNotificationStore({ env: { ...env, NEXT_PUBLIC_SUPABASE_URL: url }, fetch: transport }).claim()).rejects.toMatchObject({ message: "unavailable" });
    expect(transport).not.toHaveBeenCalled();
  });

  it("sanitizes provider errors and never retries an ambiguous request", async () => {
    const transport = vi.fn<typeof fetch>().mockRejectedValue(new Error("private schema credentials"));
    await expect(createNotificationStore({ env, fetch: transport }).claim()).rejects.toMatchObject({ message: "unavailable" });
    expect(transport).toHaveBeenCalledTimes(1);
  });
});
