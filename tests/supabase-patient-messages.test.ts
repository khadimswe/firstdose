import { describe, expect, it, vi } from "vitest";
import { createMessageStore } from "@/lib/server/supabase-patient-messages";

const run = "63d4b651-0eb5-440d-a523-e8daf82f36ca";
const env = { NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co", SUPABASE_SECRET_KEY: "private-test-only" };
const snapshot = { run_id: run, revision: 0, messages: [] };
describe("patient message provider transport", () => {
  it("uses the private RPC boundary and sends no arbitrary message text", async () => {
    const transport = vi.fn<typeof fetch>(async () => Response.json(snapshot));
    const store = createMessageStore({ env, fetch: transport });
    await store.command(run.toUpperCase(), { action: "approve", case_id: "rx_001", lang: "es" });
    const [url, init] = transport.mock.calls[0];
    expect(String(url)).toBe("https://example.supabase.co/rest/v1/rpc/fd_patient_message_command");
    expect(init).toMatchObject({ method: "POST", cache: "no-store", redirect: "error", headers: { apikey: "private-test-only" } });
    expect(init?.signal).toBeInstanceOf(AbortSignal);
    expect(JSON.parse(init?.body as string)).toEqual({ p_run_id: run, p_action: "approve", p_case_id: "rx_001", p_lang: "es" });
  });
  it.each(["http://example.supabase.co", "https://user:pw@example.supabase.co", "https://example.supabase.co/path", "https://example.supabase.co?key=x", undefined])("fails closed before sending credentials for %s", async origin => {
    const transport = vi.fn<typeof fetch>();
    await expect(createMessageStore({ env: { ...env, NEXT_PUBLIC_SUPABASE_URL: origin }, fetch: transport }).snapshot()).rejects.toMatchObject({ code: "unavailable" });
    expect(transport).not.toHaveBeenCalled();
  });
  it.each([
    [{ code: "P0001", message: "stale_run" }, "stale_run"],
    [{ code: "P0001", message: "invalid_transition" }, "invalid_transition"],
    [{ code: "22023", message: "invalid_command" }, "invalid_command"],
    [{ code: "XX000", message: "private credentials" }, "unavailable"],
  ])("maps database errors without exposing provider details", async (body, code) => {
    await expect(createMessageStore({ env, fetch: async () => Response.json(body, { status: 400 }) }).snapshot()).rejects.toMatchObject({ code, message: expect.not.stringContaining("private credentials") });
  });
  it("rejects successful responses from a different run", async () => {
    const db = createMessageStore({ env, fetch: async () => Response.json({ ...snapshot, run_id: "12c21f65-988b-401c-a1c5-1973656f77a6" }) });
    await expect(db.command(run, { action: "acknowledge", case_id: "rx_001" })).rejects.toMatchObject({ code: "unavailable" });
  });
  it("projects reviewed fields and strips unexpected provider data", async () => {
    const db = createMessageStore({ env, fetch: async () => Response.json({ ...snapshot, private_detail: "not for browser" }) });
    expect(await db.snapshot()).toEqual(snapshot);
  });
  it("sanitizes network failures and non-JSON provider failures", async () => {
    await expect(createMessageStore({ env, fetch: async () => { throw new Error("private URL"); } }).snapshot()).rejects.toMatchObject({ code: "unavailable", message: "unavailable" });
    await expect(createMessageStore({ env, fetch: async () => new Response("private error", { status: 500 }) }).snapshot()).rejects.toMatchObject({ code: "unavailable" });
  });
});
