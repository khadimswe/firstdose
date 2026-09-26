import { authorizeDemo as authorize, HttpError } from "./demo-auth";
import { executeCommand, PersistenceError, type Snapshot, type WorkflowStore } from "./commands";
import { createWorkflowStore, isRunId } from "./supabase-workflow";
import { WorkflowError, type WorkflowCommand } from "./workflow";

type Options = { store?: WorkflowStore; env?: Record<string, string | undefined> };
type CommandKind = WorkflowCommand["kind"] | "reset";

async function readBody(request: Request): Promise<Record<string, unknown>> {
  if (request.headers.get("content-type")?.split(";")[0].trim().toLowerCase() !== "application/json") throw new HttpError(415, "json_required");
  const reader = request.body?.getReader();
  const decoder = new TextDecoder();
  let text = "";
  let bytes = 0;
  if (reader) {
    try {
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        bytes += value.byteLength;
        if (bytes > 8_192) {
          await reader.cancel();
          throw new HttpError(413, "body_too_large");
        }
        text += decoder.decode(value, { stream: true });
      }
      text += decoder.decode();
    } finally { reader.releaseLock(); }
  }
  let body: unknown;
  try { body = JSON.parse(text); } catch { throw new HttpError(400, "invalid_json"); }
  if (!body || typeof body !== "object" || Array.isArray(body) || Object.hasOwn(body, "kind")) throw new HttpError(400, "invalid_command");
  return body as Record<string, unknown>;
}

function json(body: unknown, status = 200, snapshot?: Snapshot) {
  return Response.json(body, {
    status,
    headers: {
      "Cache-Control": "no-store",
      ...(snapshot ? { "X-FirstDose-Run": snapshot.run_id, "X-FirstDose-Revision": String(snapshot.revision) } : {}),
    },
  });
}

function failure(error: unknown): Response {
  if (error instanceof HttpError) return json({ error: error.code }, error.status);
  if (error instanceof WorkflowError) return json({ error: error.code }, error.code === "invalid_transition" ? 409 : 400);
  if (error instanceof PersistenceError) return json({ error: error.code }, error.code === "stale_run" || error.code === "revision_conflict" ? 409 : 503);
  return json({ error: "unavailable" }, 503);
}

export function commandHandler(kind: CommandKind, options: Options = {}) {
  return async (request: Request): Promise<Response> => {
    try {
      const env = options.env ?? process.env;
      authorize(request, env);
      const runId = request.headers.get("x-firstdose-run");
      if (!runId) throw new HttpError(428, "run_required");
      if (!isRunId(runId)) throw new HttpError(400, "invalid_run");
      const body = await readBody(request);
      const store = options.store ?? createWorkflowStore({ env });
      if (kind === "reset") {
        if (Object.keys(body).length) throw new HttpError(400, "invalid_command");
        const snapshot = await store.reset(runId);
        return json(snapshot, 200, snapshot);
      }
      const result = await executeCommand(store, runId, { ...body, kind });
      return json(result.inserted, 200, result.snapshot);
    } catch (error) { return failure(error); }
  };
}

export function snapshotHandler(options: Options = {}) {
  return async (request: Request): Promise<Response> => {
    try {
      const env = options.env ?? process.env;
      authorize(request, env);
      const snapshot = await (options.store ?? createWorkflowStore({ env })).snapshot();
      return json(snapshot, 200, snapshot);
    } catch (error) { return failure(error); }
  };
}
