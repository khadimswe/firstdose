import { authorize, failure, json, readBody } from "./command-http";
import { isMessageRun } from "../patient-messages";
import { validateMessageCommand, type MessageStore } from "./patient-messages";
import { createMessageStore } from "./supabase-patient-messages";
import { HttpError } from "./http-body";

export function patientMessageHandler(mode: "read" | "write", options: { env?: Record<string, string | undefined>; store?: MessageStore } = {}) {
  return async (request: Request): Promise<Response> => {
    try {
      const env = options.env ?? process.env;
      authorize(request, env);
      const store = options.store ?? createMessageStore({ env });
      if (mode === "read") {
        const snapshot = await store.snapshot();
        return json(snapshot, 200, snapshot);
      }
      const runId = request.headers.get("x-firstdose-run");
      if (!runId) throw new HttpError(428, "run_required");
      if (!isMessageRun(runId)) throw new HttpError(400, "invalid_run");
      const command = await readBody(request);
      validateMessageCommand(command);
      const snapshot = await store.command(runId.toLowerCase(), command);
      return json(snapshot, 200, snapshot);
    } catch (error) { return failure(error); }
  };
}
