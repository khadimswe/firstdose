import { authorize, failure, json, readBody } from "./command-http";
import { validateCoordinatorCommand, type CoordinatorStore } from "./coordinator";
import { createCoordinatorStore } from "./supabase-coordinator";
import { isRunId } from "./supabase-workflow";
import { HttpError } from "./http-body";

type Options = { env?: Record<string, string | undefined>; store?: CoordinatorStore };
export function coordinatorHandler(mode: "read" | "write", options: Options = {}) {
  return async (request: Request): Promise<Response> => {
    try {
      const env = options.env ?? process.env;
      authorize(request, env);
      const store = options.store ?? createCoordinatorStore({ env });
      if (mode === "read") {
        const snapshot = await store.snapshot();
        return json(snapshot, 200, snapshot);
      }
      const runId = request.headers.get("x-firstdose-run");
      if (!runId) throw new HttpError(428, "run_required");
      if (!isRunId(runId)) throw new HttpError(400, "invalid_run");
      const command = await readBody(request);
      validateCoordinatorCommand(command);
      const snapshot = await store.command(runId.toLowerCase(), command);
      return json(snapshot, 200, snapshot);
    } catch (error) { return failure(error); }
  };
}
