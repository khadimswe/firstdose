import { executeCommand, PersistenceError, type ReasonClassifier, type Snapshot, type WorkflowStore } from "./commands";
import { createWorkflowStore, isRunId } from "./supabase-workflow";
import { WorkflowError, type WorkflowCommand } from "./workflow";
import { demoAccess, demoConfigured } from "./demo-session";
import { HttpError, readText, requireSameOrigin } from "./http-body";

export type CommandKind = WorkflowCommand["kind"] | "reset";
export type CommitCheckpoint = Pick<Snapshot, "run_id" | "revision"> & { kind: CommandKind };
type Options = { store?: WorkflowStore; env?: Record<string, string | undefined>; classify?: ReasonClassifier; onCommit?: (checkpoint: CommitCheckpoint) => void | Promise<void> };
export function authorize(request: Request, env: Record<string, string | undefined>) {
  if (!demoConfigured(env)) throw new HttpError(503, "demo_not_configured");
  const access = demoAccess(request, env);
  if (!access) throw new HttpError(401, "unauthorized");
  requireSameOrigin(request, access === "session" && request.method !== "GET");
}

export async function readBody(request: Request): Promise<Record<string, unknown>> {
  if (request.headers.get("content-type")?.split(";")[0].trim().toLowerCase() !== "application/json") throw new HttpError(415, "json_required");
  const text = await readText(request);
  let body: unknown;
  try { body = JSON.parse(text); } catch { throw new HttpError(400, "invalid_json"); }
  if (!body || typeof body !== "object" || Array.isArray(body) || Object.hasOwn(body, "kind")) throw new HttpError(400, "invalid_command");
  return body as Record<string, unknown>;
}

export function json(body: unknown, status = 200, snapshot?: Pick<Snapshot, "run_id" | "revision">) {
  return Response.json(body, {
    status,
    headers: {
      "Cache-Control": "no-store",
      ...(snapshot ? { "X-FirstDose-Run": snapshot.run_id, "X-FirstDose-Revision": String(snapshot.revision) } : {}),
    },
  });
}

export function failure(error: unknown): Response {
  if (error instanceof HttpError) return json({ error: error.code }, error.status);
  if (error instanceof WorkflowError) return json({ error: error.code }, error.code === "invalid_transition" ? 409 : 400);
  if (error instanceof PersistenceError) return json({ error: error.code }, error.code === "stale_run" || error.code === "revision_conflict" ? 409 : 503);
  return json({ error: "unavailable" }, 503);
}

export function commandHandler(kind: CommandKind, options: Options = {}) {
  async function scheduleFollowup(snapshot: Snapshot) {
    try { await options.onCommit?.({ kind, run_id: snapshot.run_id, revision: snapshot.revision }); }
    catch { console.warn("Post-commit scheduling failed; committed events are retained."); }
  }
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
        await scheduleFollowup(snapshot);
        return json(snapshot, 200, snapshot);
      }
      const result = await executeCommand(store, runId, { ...body, kind }, undefined, options.classify);
      await scheduleFollowup(result.snapshot);
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
      const etag = `"${snapshot.run_id}:${snapshot.revision}"`;
      if (request.headers.get("if-none-match") === etag) {
        return new Response(null, { status: 304, headers: { "Cache-Control": "no-store", ETag: etag, "X-FirstDose-Run": snapshot.run_id, "X-FirstDose-Revision": String(snapshot.revision) } });
      }
      const response = json(snapshot, 200, snapshot);
      response.headers.set("ETag", etag);
      return response;
    } catch (error) { return failure(error); }
  };
}
