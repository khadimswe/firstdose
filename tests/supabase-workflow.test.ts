import { describe, expect, it } from "vitest";
import { createWorkflowStore } from "@/lib/server/supabase-workflow";

const snapshot = { run_id: "63d4b651-0eb5-440d-a523-e8daf82f36ca", revision: 0, events: [] };
const env = { NEXT_PUBLIC_SUPABASE_URL: "https://demo.supabase.co", SUPABASE_SECRET_KEY: "sb_secret_test_only" };

describe("Supabase workflow RPC transport", () => {
  it("uses only server API-key authentication and sends the observed revision", async () => {
    const requests: { url: string; init: RequestInit }[] = [];
    const store = createWorkflowStore({ env, fetch: async (url, init) => {
      requests.push({ url: String(url), init: init! });
      return Response.json(snapshot);
    } });
    expect(await store.snapshot()).toEqual(snapshot);
    await store.commit(snapshot.run_id, 4, []);
    await store.reset(snapshot.run_id);
    expect(requests.map(r => r.url)).toEqual(["https://demo.supabase.co/rest/v1/rpc/fd_snapshot", "https://demo.supabase.co/rest/v1/rpc/fd_commit", "https://demo.supabase.co/rest/v1/rpc/fd_reset"]);
    const headers = new Headers(requests[0].init.headers);
    expect(headers.get("apikey")).toBe(env.SUPABASE_SECRET_KEY);
    expect(headers.has("authorization")).toBe(false); // modern keys aren't JWTs
    expect(requests[0].init.redirect).toBe("error");
    expect(requests[0].init.cache).toBe("no-store");
    expect(JSON.parse(requests[1].init.body as string)).toEqual({ p_run_id: snapshot.run_id, p_revision: 4, p_events: [] });
    expect(JSON.parse(requests[2].init.body as string)).toEqual({ p_run_id: snapshot.run_id });
  });

  it.each(["stale_run", "revision_conflict"])("preserves the database's %s conflict", async message => {
    const store = createWorkflowStore({ env, fetch: async () => Response.json({ code: "P0001", message }, { status: 400 }) });
    await expect(store.commit(snapshot.run_id, 0, [])).rejects.toMatchObject({ code: message });
  });

  it.each([
    new Response("private SQL and credentials", { status: 500 }),
    Response.json({ code: "23505", message: "private schema details" }, { status: 409 }),
    Response.json({ ...snapshot, revision: -1 }),
    Response.json({ ...snapshot, run_id: "not-a-run" }),
    Response.json({ ...snapshot, events: [{}] }),
    new Response("not json"),
  ])("sanitizes provider errors and malformed responses", async response => {
    const store = createWorkflowStore({ env, fetch: async () => response.clone() });
    await expect(store.snapshot()).rejects.toMatchObject({ code: "unavailable", message: "unavailable" });
  });

  it.each([undefined, "http://demo.supabase.co", "https://demo.supabase.co/path", "https://user:pass@demo.supabase.co", "https://demo.supabase.co/?key=private"])("fails closed on unsafe/missing provider configuration", async url => {
    let sent = false;
    const store = createWorkflowStore({ env: { ...env, NEXT_PUBLIC_SUPABASE_URL: url }, fetch: async () => { sent = true; return Response.json(snapshot); } });
    await expect(store.snapshot()).rejects.toMatchObject({ code: "unavailable" });
    expect(sent).toBe(false);
  });

  it("does not retry or leak a network error", async () => {
    let sent = 0;
    const store = createWorkflowStore({ env, fetch: async () => { sent++; throw new Error("private provider URL"); } });
    await expect(store.reset(snapshot.run_id)).rejects.toMatchObject({ code: "unavailable", message: "unavailable" });
    expect(sent).toBe(1);
  });
});
