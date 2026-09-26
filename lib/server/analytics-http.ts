import { authorize, failure, json } from "./command-http";
import { HttpError } from "./http-body";
import { readLiveAccessSummary } from "./analytics-runtime";
import { ReplayError } from "./replay-followup";
import { isRunId } from "./supabase-workflow";

type Options = { env?: Record<string, string | undefined>; readSummary?: typeof readLiveAccessSummary };

export function accessSummaryHandler(options: Options = {}) {
  return async (request: Request): Promise<Response> => {
    try {
      authorize(request, options.env ?? process.env);
      const query = new URL(request.url).searchParams;
      const run = query.get("run_id");
      const revision = query.get("revision");
      if (query.getAll("run_id").length !== 1 || !isRunId(run) || query.getAll("revision").length !== 1
        || revision === null || !/^(0|[1-9]\d*)$/.test(revision) || !Number.isSafeInteger(Number(revision))) throw new HttpError(400, "invalid_checkpoint");
      const result = await (options.readSummary ?? readLiveAccessSummary)({ run_id: run.toLowerCase(), revision: Number(revision) });
      return json(result.summary, 200, result.checkpoint);
    } catch (error) {
      if (error instanceof HttpError) return failure(error);
      if (error instanceof ReplayError && error.code === "analytics_stale") return json({ error: error.code }, 409);
      return json({ error: "analytics_unavailable" }, 503);
    }
  };
}
