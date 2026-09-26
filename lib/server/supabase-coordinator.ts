import { PersistenceError } from "./commands";
import { validateCoordinatorCommand, type CoordinatorSnapshot, type CoordinatorStore } from "./coordinator";
import { isRunId } from "./supabase-workflow";
import { WorkflowError } from "./workflow";

type Options = { env?: Record<string, string | undefined>; fetch?: typeof fetch };
function readSnapshot(value: unknown): CoordinatorSnapshot {
  const s = value as CoordinatorSnapshot | null;
  if (!s || !isRunId(s.run_id) || !Number.isSafeInteger(s.revision) || s.revision < 0 ||
      !Array.isArray(s.events) || !Array.isArray(s.links) || !Array.isArray(s.cases)) throw new PersistenceError("unavailable");
  const seen = new Set<string>();
  for (const e of s.events) {
    if (!e || typeof e.id !== "string" || !e.id || seen.has(e.id) || e.coordinator_id !== "coord_demo" || e.prescriber_id !== "prescriber_demo" ||
        !["coordinator_invited", "coordinator_link_requested", "coordinator_linked", "coordinator_assigned"].includes(e.type) ||
        !["doctor", "coordinator"].includes(e.actor) || !(e.case_id === null || typeof e.case_id === "string") ||
        typeof e.at !== "string" || !Number.isFinite(Date.parse(e.at))) throw new PersistenceError("unavailable");
    seen.add(e.id);
  }
  for (const l of s.links) if (!l || l.coordinator_id !== "coord_demo" || l.prescriber_id !== "prescriber_demo" || !["pending", "linked"].includes(l.status)) throw new PersistenceError("unavailable");
  for (const c of s.cases) if (!c || typeof c.case_id !== "string" || !(c.coordinator_id === null || c.coordinator_id === "coord_demo")) throw new PersistenceError("unavailable");
  return s;
}

/** Server-only, separate from the frozen fill-event contract. */
export function createCoordinatorStore(options: Options = {}): CoordinatorStore {
  async function rpc(name: string, body: Record<string, unknown>) {
    try {
      const env = options.env ?? process.env;
      const origin = new URL(env.NEXT_PUBLIC_SUPABASE_URL ?? "");
      const secret = env.SUPABASE_SECRET_KEY;
      if (origin.protocol !== "https:" || origin.username || origin.password || origin.pathname !== "/" || origin.search || origin.hash || !secret) throw new Error();
      const response = await (options.fetch ?? fetch)(new URL(`/rest/v1/rpc/${name}`, origin), {
        method: "POST", headers: { apikey: secret, "Content-Type": "application/json" },
        body: JSON.stringify(body), cache: "no-store", redirect: "error", signal: AbortSignal.timeout(5_000),
      });
      const result: unknown = await response.json();
      if (!response.ok) {
        const error = result as { code?: string; message?: string } | null;
        if (error?.code === "P0001" && error.message === "stale_run") throw new PersistenceError("stale_run");
        if (error?.code === "P0001" && error.message === "invalid_transition") throw new WorkflowError("invalid_transition", "Coordinator action unavailable.");
        if (error?.code === "22023") throw new WorkflowError("invalid_command", "Invalid coordinator command.");
        throw new PersistenceError("unavailable");
      }
      return readSnapshot(result);
    } catch (error) {
      if (error instanceof PersistenceError || error instanceof WorkflowError) throw error;
      throw new PersistenceError("unavailable");
    }
  }
  return {
    snapshot: () => rpc("fd_coordinator_snapshot", {}),
    command: async (runId, command) => {
      if (!isRunId(runId)) throw new WorkflowError("invalid_command", "Invalid run.");
      validateCoordinatorCommand(command);
      const expectedRun = runId.toLowerCase();
      const snapshot = await rpc("fd_coordinator_command", {
        p_run_id: expectedRun, p_action: command.action,
        p_coordinator_id: command.coordinator_id, p_prescriber_id: command.prescriber_id,
        p_case_id: command.case_id ?? null,
      });
      if (snapshot.run_id !== expectedRun) throw new PersistenceError("unavailable");
      return snapshot;
    },
  };
}
