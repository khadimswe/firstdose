import { isMessageRun, parseMessageSnapshot } from "../patient-messages";
import { PersistenceError } from "./commands";
import { validateMessageCommand, type MessageStore } from "./patient-messages";
import { WorkflowError } from "./workflow";

type Options = { env?: Record<string, string | undefined>; fetch?: typeof fetch };
export function createMessageStore(options: Options = {}): MessageStore {
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
        if (error?.code === "P0001" && error.message === "invalid_transition") throw new WorkflowError("invalid_transition", "Patient message action unavailable.");
        if (error?.code === "22023") throw new WorkflowError("invalid_command", "Invalid patient message command.");
        throw new PersistenceError("unavailable");
      }
      return parseMessageSnapshot(result);
    } catch (error) {
      if (error instanceof PersistenceError || error instanceof WorkflowError) throw error;
      throw new PersistenceError("unavailable");
    }
  }
  return {
    snapshot: () => rpc("fd_patient_message_snapshot", {}),
    command: async (runId, command) => {
      if (!isMessageRun(runId)) throw new WorkflowError("invalid_command", "Invalid run.");
      validateMessageCommand(command);
      const snapshot = await rpc("fd_patient_message_command", {
        p_run_id: runId.toLowerCase(), p_action: command.action, p_case_id: command.case_id,
        p_lang: command.action === "approve" ? command.lang : null,
      });
      if (snapshot.run_id !== runId.toLowerCase()) throw new PersistenceError("unavailable");
      return snapshot;
    },
  };
}
