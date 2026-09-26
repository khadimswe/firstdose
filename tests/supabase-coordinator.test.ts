import { describe, expect, it, vi } from "vitest";
import { createCoordinatorStore } from "@/lib/server/supabase-coordinator";

const run = "63d4b651-0eb5-440d-a523-e8daf82f36ca";
const env = { NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co", SUPABASE_SECRET_KEY: "private-test-only" };
const snapshot = { run_id: run, revision: 0, events: [], links: [], cases: [] };
const command = { action: "request", coordinator_id: "coord_demo", prescriber_id: "prescriber_demo" } as const;

describe("coordinator persistence transport", () => {
  it("sends private credentials only to the configured RPC with bounded fetch and no redirect", async () => {
    const transport = vi.fn<typeof fetch>(async () => Response.json(snapshot));
    const db = createCoordinatorStore({ env, fetch: transport });
    expect(await db.command(run.toUpperCase(), command)).toEqual(snapshot);
    const [url, init] = transport.mock.calls[0];
    expect(String(url)).toBe("https://example.supabase.co/rest/v1/rpc/fd_coordinator_command");
    expect(init).toMatchObject({ method: "POST", cache: "no-store", redirect: "error", headers: { apikey: "private-test-only" } });
    expect(init?.signal).toBeInstanceOf(AbortSignal);
    expect(JSON.parse(init?.body as string)).toEqual({ p_run_id: run, p_action: "request", p_coordinator_id: "coord_demo", p_prescriber_id: "prescriber_demo", p_case_id: null });
  });
  it.each(["http://example.supabase.co", "https://user:password@example.supabase.co", "https://example.supabase.co/path", "https://example.supabase.co?secret=1"])("rejects unsafe origin %s without making a request", async origin => {
    const transport = vi.fn<typeof fetch>();
    await expect(createCoordinatorStore({ env: { ...env, NEXT_PUBLIC_SUPABASE_URL: origin }, fetch: transport }).snapshot()).rejects.toMatchObject({ code: "unavailable" });
    expect(transport).not.toHaveBeenCalled();
  });
  it.each([
    [{ code: "P0001", message: "stale_run" }, "stale_run"],
    [{ code: "P0001", message: "invalid_transition" }, "invalid_transition"],
    [{ code: "22023", message: "invalid_command" }, "invalid_command"],
    [{ code: "XX999", message: "secret provider detail" }, "unavailable"],
  ])("maps safe database errors", async (body, code) => {
    const transport = vi.fn<typeof fetch>(async () => Response.json(body, { status: 400 }));
    await expect(createCoordinatorStore({ env, fetch: transport }).command(run, command)).rejects.toMatchObject({ code, message: expect.not.stringContaining("secret provider detail") });
  });
  it.each([
    null, { ...snapshot, revision: -1 }, { ...snapshot, events: [{}] },
    { ...snapshot, cases: [{ case_id: "rx_001", coordinator_id: "other" }] },
    { ...snapshot, links: [{ coordinator_id: "coord_demo", prescriber_id: "prescriber_demo", status: "unapproved" }] },
    { ...snapshot, run_id: "12c21f65-988b-401c-a1c5-1973656f77a6" },
  ])("fails closed on malformed or mismatched provider snapshot", async body => {
    const transport = vi.fn<typeof fetch>(async () => Response.json(body));
    await expect(createCoordinatorStore({ env, fetch: transport }).command(run, command)).rejects.toMatchObject({ code: "unavailable" });
  });
  it("accepts real database timestamp format and fixed link/case projection", async () => {
    const data = { ...snapshot, revision: 3,
      events: [{ id: "coord_linked", type: "coordinator_linked", at: "2026-09-26T12:00:00.123456+00:00", actor: "doctor", case_id: null, coordinator_id: "coord_demo", prescriber_id: "prescriber_demo" }],
      links: [{ coordinator_id: "coord_demo", prescriber_id: "prescriber_demo", status: "linked" }],
      cases: [{ case_id: "rx_001", coordinator_id: "coord_demo" }],
    };
    expect(await createCoordinatorStore({ env, fetch: async () => Response.json(data) }).snapshot()).toEqual(data);
  });
});
