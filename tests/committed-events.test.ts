import { describe, expect, it } from "vitest";
import { createWorkflowStore } from "@/lib/server/supabase-workflow";

const run = "63d4b651-0eb5-440d-a523-e8daf82f36ca";
const other = "766ba776-c7c9-47f5-a3f6-3faf36c67629";
const env = { NEXT_PUBLIC_SUPABASE_URL: "https://demo.supabase.co", SUPABASE_SECRET_KEY: "sb_secret_test_only" };
const event = {
  id: "ev_01", case_id: "rx_001", at: "2026-09-26T14:00:00.000Z",
  actor: "doctor", type: "prescribed", note: "", side: "practice",
  status_text: null, reject_code: null, reason: null, fix: null, amount_usd: null, wrist: null,
};

describe("committed run history for analytics replay", () => {
  it("requests an explicit run and preserves durable identity, event time and sequence order", async () => {
    const requests: { url: string; init: RequestInit }[] = [];
    const events = [event, { ...event, id: "ev_11", actor: "pharmacy", type: "claim_run", status_text: "Dispensed", at: "2026-09-26T14:02:00.000Z" }];
    const store = createWorkflowStore({ env, fetch: async (url, init) => {
      requests.push({ url: String(url), init: init! });
      return Response.json({ run_id: run, events });
    } });
    const history = await store.readCommittedEvents(run.toUpperCase());
    expect(history).toEqual(events.map(event => ({ run_id: run, script_id: event.id, event })));
    expect(await store.readCommittedEvents(run)).toEqual(history);
    expect(requests[0].url).toBe("https://demo.supabase.co/rest/v1/rpc/fd_read_run");
    expect(JSON.parse(requests[0].init.body as string)).toEqual({ p_run_id: run });
    expect(new Headers(requests[0].init.headers).get("apikey")).toBe(env.SUPABASE_SECRET_KEY);
    expect(requests[0].init.cache).toBe("no-store");
    expect(requests[0].init.redirect).toBe("error");
  });

  it("distinguishes an existing empty run from an unavailable run", async () => {
    const store = createWorkflowStore({ env, fetch: async () => Response.json({ run_id: run, events: [] }) });
    expect(await store.readCommittedEvents(run)).toEqual([]);
    const missing = createWorkflowStore({ env, fetch: async () => Response.json(null) });
    await expect(missing.readCommittedEvents(run)).rejects.toMatchObject({ code: "unavailable" });
  });

  it.each([
    { run_id: other, events: [event] },
    { run_id: run, events: [event, event] },
    { run_id: run, events: [{ ...event, at: 42 }] },
    { run_id: run, events: [{ ...event, at: "2026-09-26T14:00:00" }] },
    { run_id: run, events: [{ ...event, at: "invalid" }] },
    { run_id: run, events: [{ ...event, side: "ascend" }] },
    { run_id: run, events: [{ ...event, id: "" }] },
    { run_id: run, events: [{ ...event, case_id: "" }] },
    { run_id: run, events: [null] },
    { run_id: run, events: {} },
  ])("rejects malformed or cross-run history", async body => {
    const store = createWorkflowStore({ env, fetch: async () => Response.json(body) });
    await expect(store.readCommittedEvents(run)).rejects.toMatchObject({ code: "unavailable", message: "unavailable" });
  });

  it("rejects invalid run identity before making a request", async () => {
    let calls = 0;
    const store = createWorkflowStore({ env, fetch: async () => { calls++; return Response.json(null); } });
    await expect(store.readCommittedEvents("bad/run?secret=value")).rejects.toMatchObject({ code: "unavailable" });
    expect(calls).toBe(0);
  });

  it("fails without retrying or returning empty success on provider failure", async () => {
    let calls = 0;
    const store = createWorkflowStore({ env, fetch: async () => { calls++; throw new Error("private provider detail"); } });
    await expect(store.readCommittedEvents(run)).rejects.toMatchObject({ code: "unavailable", message: "unavailable" });
    expect(calls).toBe(1);
  });
});
