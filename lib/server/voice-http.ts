import { authorizeDemo, HttpError } from "./demo-auth";
import { isRunId } from "./supabase-workflow";
import { readVoiceBody, transcribeAudio, VoiceError, type VoiceOptions } from "./voice";

function json(body: unknown, status = 200, runId?: string) {
  return Response.json(body, { status, headers: { "Cache-Control": "no-store", ...(runId ? { "X-FirstDose-Run": runId } : {}) } });
}

export function voiceHandler(options: Pick<VoiceOptions, "env" | "fetchImpl"> = {}) {
  return async (request: Request): Promise<Response> => {
    try {
      const env = options.env ?? process.env;
      authorizeDemo(request, env);
      const runId = request.headers.get("x-firstdose-run");
      if (!runId) throw new HttpError(428, "run_required");
      if (!isRunId(runId)) throw new HttpError(400, "invalid_run");
      const contentType = request.headers.get("content-type") ?? "";
      if (contentType.split(";")[0].trim().toLowerCase() !== "multipart/form-data") throw new HttpError(415, "multipart_required");
      const inputSignal = AbortSignal.any([request.signal, AbortSignal.timeout(10_000)]);
      const bytes = await readVoiceBody(request.body, 4_100_000, inputSignal, new VoiceError(413, "body_too_large"));
      let form: FormData;
      try { form = await new Response(bytes, { headers: { "Content-Type": contentType } }).formData(); } catch { throw new HttpError(400, "invalid_multipart"); }
      const audio = form.get("audio");
      const keyterms = form.get("keyterms");
      if ([...form.keys()].some(key => key !== "audio" && key !== "keyterms") || form.getAll("audio").length !== 1 || !(audio instanceof Blob) || form.getAll("keyterms").length > 1 || (keyterms !== null && keyterms !== "true" && keyterms !== "false")) throw new HttpError(400, "invalid_voice_request");
      const proposal = await transcribeAudio(audio, { env, fetchImpl: options.fetchImpl, signal: request.signal, keyterms: keyterms !== "false" });
      // This is a proposal, not proof of current state. Confirmation retains this run ID;
      // the existing handoff command validates it atomically and rejects a reset race.
      return json(proposal, 200, runId.toLowerCase());
    } catch (error) {
      if (error instanceof HttpError || error instanceof VoiceError) return json({ error: error.code }, error.status);
      if (error instanceof Error && error.name === "TimeoutError") return json({ error: "upload_timeout" }, 408);
      if (request.signal.aborted) return json({ error: "voice_cancelled" }, 408);
      return json({ error: "voice_unavailable" }, 502);
    }
  };
}
