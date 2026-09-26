import type { FillEvent } from "@/components/data/types";
import { PersistenceError, type Snapshot, type WorkflowStore } from "./commands";

type Options = { env?: Record<string, string | undefined>; fetch?: typeof fetch };
export type CommittedEvent = {
  run_id: string;
  script_id: string;
  event: FillEvent & { at: string };
};
type ReplayStore = WorkflowStore & {
  readCommittedEvents(runId: string): Promise<CommittedEvent[]>;
};
export const isRunId = (value: unknown): value is string => typeof value === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);

function readSnapshot(value: unknown): Snapshot {
  const snapshot = value as Snapshot | null;
  if (!snapshot || !isRunId(snapshot.run_id) || !Number.isSafeInteger(snapshot.revision) || snapshot.revision < 0 || !Array.isArray(snapshot.events)) {
    throw new PersistenceError("unavailable");
  }
  readEvents(snapshot.events);
  return snapshot;
}

function readEvents(value: unknown): FillEvent[] {
  if (!Array.isArray(value)) throw new PersistenceError("unavailable");
  const seen = new Set<string>();
  for (const event of value) {
    if (!event || typeof event.id !== "string" || seen.has(event.id) || typeof event.case_id !== "string" || typeof event.at !== "string" || !Number.isFinite(Date.parse(event.at)) || typeof event.type !== "string" || typeof event.actor !== "string" || typeof event.note !== "string" || event.side !== "practice") {
      throw new PersistenceError("unavailable");
    }
    seen.add(event.id);
  }
  return value;
}

/** Server routes only. No service key is accepted from or returned to the browser. */
export function createWorkflowStore(options: Options = {}): ReplayStore {
  async function rpc(name: string, body: Record<string, unknown>): Promise<unknown> {
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
      return result;
    } catch (error) {
      if (error instanceof PersistenceError) throw error;
      // Provider bodies/URLs may contain private schema or credentials.
      throw new PersistenceError("unavailable");
    }
  }
  return {
    snapshot: async () => readSnapshot(await rpc("fd_snapshot", {})),
    commit: async (runId: string, revision: number, events: FillEvent[]) => readSnapshot(await rpc("fd_commit", { p_run_id: runId, p_revision: revision, p_events: events })),
    reset: async (runId: string) => readSnapshot(await rpc("fd_reset", { p_run_id: runId })),
    readCommittedEvents: async (runId: string) => {
      if (!isRunId(runId)) throw new PersistenceError("unavailable");
      const expectedRun = runId.toLowerCase();
      const history = await rpc("fd_read_run", { p_run_id: expectedRun }) as { run_id?: unknown; events?: unknown } | null;
      if (!history || history.run_id !== expectedRun) throw new PersistenceError("unavailable");
      return readEvents(history.events).map(event => {
        if (!event.id.trim() || !event.case_id.trim() || typeof event.at !== "string" || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{1,3})?(Z|[+-]\d{2}:\d{2})$/.test(event.at)) {
          throw new PersistenceError("unavailable");
        }
        return { run_id: expectedRun, script_id: event.id, event: { ...event, at: event.at } };
      });
    },
  };
}

/** Practice-side replay input only; project/allowlist before sending to Tiger. */
export async function readCommittedEvents(runId: string): Promise<CommittedEvent[]> {
  return createWorkflowStore().readCommittedEvents(runId);
}
