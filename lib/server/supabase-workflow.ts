import type { FillEvent } from "@/components/data/types";
import { PersistenceError, type Snapshot, type WorkflowStore } from "./commands";

type Options = { env?: Record<string, string | undefined>; fetch?: typeof fetch };
export const isRunId = (value: unknown): value is string => typeof value === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);

function readSnapshot(value: unknown): Snapshot {
  const snapshot = value as Snapshot | null;
  if (!snapshot || !isRunId(snapshot.run_id) || !Number.isSafeInteger(snapshot.revision) || snapshot.revision < 0 || !Array.isArray(snapshot.events)) {
    throw new PersistenceError("unavailable");
  }
  const seen = new Set<string>();
  for (const event of snapshot.events) {
    if (!event || typeof event.id !== "string" || seen.has(event.id) || typeof event.case_id !== "string" || typeof event.at !== "string" || !Number.isFinite(Date.parse(event.at)) || typeof event.type !== "string" || typeof event.actor !== "string" || typeof event.note !== "string" || event.side !== "practice") {
      throw new PersistenceError("unavailable");
    }
    seen.add(event.id);
  }
  return snapshot;
}

/** Server routes only. No service key is accepted from or returned to the browser. */
export function createWorkflowStore(options: Options = {}): WorkflowStore {
  async function rpc(name: string, body: Record<string, unknown>): Promise<Snapshot> {
    try {
      const env = options.env ?? process.env;
      const origin = new URL(env.NEXT_PUBLIC_SUPABASE_URL ?? "");
      const secret = env.SUPABASE_SECRET_KEY;
      if (origin.protocol !== "https:" || origin.username || origin.password || origin.pathname !== "/" || origin.search || origin.hash || !secret) throw new Error();
      const response = await (options.fetch ?? fetch)(new URL(`/rest/v1/rpc/${name}`, origin), {
        method: "POST",
        headers: { apikey: secret, "Content-Type": "application/json" },
        body: JSON.stringify(body),
        cache: "no-store",
        redirect: "error",
        signal: AbortSignal.timeout(5_000),
      });
      const result: unknown = await response.json();
      if (!response.ok) {
        const failure = result as { code?: string; message?: string } | null;
        if (failure?.code === "P0001" && (failure.message === "stale_run" || failure.message === "revision_conflict")) {
          throw new PersistenceError(failure.message);
        }
        throw new PersistenceError("unavailable");
      }
      return readSnapshot(result);
    } catch (error) {
      if (error instanceof PersistenceError) throw error;
      // Provider bodies/URLs may contain private schema or credentials.
      throw new PersistenceError("unavailable");
    }
  }
  return {
    snapshot: () => rpc("fd_snapshot", {}),
    commit: (runId: string, revision: number, events: FillEvent[]) => rpc("fd_commit", { p_run_id: runId, p_revision: revision, p_events: events }),
    reset: (runId: string) => rpc("fd_reset", { p_run_id: runId }),
  };
}
