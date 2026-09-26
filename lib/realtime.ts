import type { AccessSummary, EventSource, FillEvent, FixKey, RxCase, ScreenAction } from "@/components/data/types";

export class RealtimeError extends Error {
  readonly loginPath: string | undefined;
  constructor(public readonly code: string, public readonly status = 0) {
    super(code === "unauthorized" ? "Sign in to the demo to continue." : `FirstDose synchronization failed (${code}).`);
    this.name = "RealtimeError";
    this.loginPath = code === "unauthorized" ? "/api/demo-login" : undefined;
  }
}

export interface PollingEventSource extends EventSource {
  /** Preserve a reviewed handoff's run through deferred confirmation. */
  handoffInRun(caseId: string, runId: string): Promise<void>;
  /** Clear old-run UI state here, before any new-run insert callbacks. Also called on initial load. */
  subscribe(
    onInsert: (event: FillEvent) => void,
    onRunChange?: (runId: string, previousRunId: string | null) => void,
    onError?: (error: Error) => void,
    onSync?: () => void,
  ): () => void;
}

type Snapshot = { run_id: string; revision: number; events: FillEvent[] };
type Visibility = Pick<Document, "addEventListener" | "removeEventListener" | "visibilityState">;
type Options = { fetch?: typeof fetch; document?: Visibility; pollIntervalMs?: number };
type Subscriber = {
  onInsert: (event: FillEvent) => void;
  onRunChange?: (runId: string, previousRunId: string | null) => void;
  onError?: (error: Error) => void;
  onSync?: () => void;
  runId: string | null;
  seen: Set<string>;
  suspended: boolean;
};
const record = (value: unknown): value is Record<string, unknown> => !!value && typeof value === "object" && !Array.isArray(value);

function parseSnapshot(value: unknown): Snapshot {
  if (!record(value) || typeof value.run_id !== "string" || !/^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(value.run_id)
    || !Number.isSafeInteger(value.revision) || Number(value.revision) < 0 || !Array.isArray(value.events)
    || !value.events.every(event => record(event) && typeof event.id === "string" && typeof event.case_id === "string" && typeof event.at === "string" && typeof event.type === "string")
    || new Set(value.events.map(event => event.id)).size !== value.events.length) {
    throw new RealtimeError("invalid_response");
  }
  return value as Snapshot;
}

async function readJson(response: Response): Promise<unknown> {
  try { return await response.json(); } catch { throw new RealtimeError("invalid_response", response.status); }
}

/** Cookie-authenticated polling through the practice server; no browser Supabase credentials. */
export function createPollingEventSource(options: Options = {}): PollingEventSource & { seedWeek(): Promise<void> } {
  const fetcher = options.fetch ?? ((input, init) => globalThis.fetch(input, init));
  const visibility = options.document ?? (typeof document === "undefined" ? undefined : document);
  const interval = options.pollIntervalMs ?? 1_500;
  const subscribers = new Set<Subscriber>();
  const retiredRuns = new Set<string>();
  let current: Snapshot | null = null;
  let generation = 0;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let flight: { promise: Promise<void>; controller: AbortController } | undefined;

  function report(subscriber: Subscriber, error: unknown) {
    // A consumer callback must not stop synchronization for the other subscribers.
    try { subscriber.onError?.(error instanceof Error ? error : new RealtimeError("unavailable")); } catch { /* Consumer owns its error presentation. */ }
  }
  function reportAll(error: unknown) { for (const subscriber of subscribers) report(subscriber, error); }
  function synced() {
    for (const subscriber of subscribers) {
      try { subscriber.onSync?.(); } catch (error) { report(subscriber, error); }
    }
  }

  function deliver(subscriber: Subscriber) {
    if (!current || !subscribers.has(subscriber)) return;
    if (subscriber.runId !== current.run_id) {
      const previous = subscriber.runId;
      subscriber.runId = current.run_id;
      subscriber.seen.clear();
      // An insert-only legacy consumer cannot clear old rows. Keep it load-only
      // after a reset, until it resubscribes with a run-change handler.
      if (previous && !subscriber.onRunChange) {
        subscriber.suspended = true;
        report(subscriber, new RealtimeError("run_change_handler_required"));
      }
      try { subscriber.onRunChange?.(current.run_id, previous); }
      catch (error) { subscriber.suspended = true; report(subscriber, error); }
    }
    if (subscriber.suspended) return;
    for (const event of current.events) {
      if (!subscribers.has(subscriber)) break;
      if (subscriber.seen.has(event.id)) continue;
      subscriber.seen.add(event.id);
      try { subscriber.onInsert(event); } catch (error) { report(subscriber, error); }
    }
  }

  function accept(next: Snapshot) {
    if (retiredRuns.has(next.run_id)) return;
    if (current?.run_id === next.run_id && next.revision <= current.revision) return;
    if (current && current.run_id !== next.run_id) {
      retiredRuns.add(current.run_id);
      generation++;
    }
    current = next;
    for (const subscriber of subscribers) deliver(subscriber);
  }

  async function request(path: string, init: RequestInit = {}) {
    let response: Response;
    const timeoutController = new AbortController();
    const timeout = setTimeout(() => timeoutController.abort(), 10_000);
    const signal = init.signal ? AbortSignal.any([init.signal, timeoutController.signal]) : timeoutController.signal;
    try {
      response = await fetcher(path, { ...init, signal, credentials: "same-origin", cache: "no-store" });
      // Keep the same deadline through body transfer, not only until headers arrive.
      const text = await response.text();
      response = new Response(text || null, { status: response.status, statusText: response.statusText, headers: response.headers });
    }
    catch { throw new RealtimeError(timeoutController.signal.aborted ? "timeout" : "unavailable"); }
    finally { clearTimeout(timeout); }
    if (!response.ok && response.status !== 304) {
      let code = response.status === 401 ? "unauthorized" : "unavailable";
      try {
        const body: unknown = await response.json();
        if (response.status !== 401 && record(body) && typeof body.error === "string" && /^[a-z_]+$/.test(body.error)) code = body.error;
      } catch { /* Non-JSON provider failures still have a stable error code. */ }
      throw new RealtimeError(code, response.status);
    }
    return response;
  }

  async function refresh(afterPending = false): Promise<FillEvent[]> {
    if (flight) {
      try { await flight.promise; } catch (error) { if (!afterPending) throw error; }
      if (afterPending) return refresh();
      return [...(current?.events ?? [])];
    }
    const epoch = generation;
    const controller = new AbortController();
    const promise = (async () => {
      try {
        const response = await request("/api/events", {
          signal: controller.signal,
          headers: current ? { "If-None-Match": `"${current.run_id}:${current.revision}"` } : {},
        });
        if (epoch !== generation) return;
        if (response.status === 304) {
          if (!current) throw new RealtimeError("invalid_response", 304);
          synced();
          return;
        }
        const next = parseSnapshot(await readJson(response));
        if (epoch === generation) { accept(next); synced(); }
      } catch (error) {
        if (epoch === generation) throw error;
      }
    })();
    flight = { promise, controller };
    try { await promise; }
    finally { if (flight?.promise === promise) flight = undefined; }
    return [...(current?.events ?? [])];
  }

  function schedule() {
    if (subscribers.size && timer === undefined) timer = setTimeout(() => { timer = undefined; void poll(); }, interval);
  }
  async function poll() {
    try { await refresh(); } catch (error) { reportAll(error); }
    finally { schedule(); }
  }
  function onVisibility() {
    if (visibility?.visibilityState === "visible") {
      clearTimeout(timer); timer = undefined;
      void poll();
    }
  }

  async function mutate(path: string, body: unknown, reset = false, expectedRun?: string): Promise<void> {
    // Capture the observed run at click time. A failed click is never retargeted.
    let run = current?.run_id;
    if (!run) { await refresh(); run = current?.run_id; }
    if (!run) throw new RealtimeError("invalid_response");
    if (expectedRun && run !== expectedRun) throw new RealtimeError("stale_run", 409);
    const epoch = generation;
    let response: Response;
    try {
      response = await request(path, {
        method: "POST", headers: { "Content-Type": "application/json", "X-FirstDose-Run": run }, body: JSON.stringify(body),
      });
    } catch (error) {
      if (error instanceof RealtimeError && error.status === 409) {
        try { await refresh(true); } catch (refreshError) { reportAll(refreshError); }
      }
      throw error;
    }
    const result = await readJson(response);
    if (reset) {
      const next = parseSnapshot(result);
      if (generation === epoch || current?.run_id === next.run_id) {
        if (current?.run_id !== next.run_id) {
          // Cancel/detach a GET begun before the reset. Its callers return the
          // current cache if a delayed response still arrives after cancellation.
          generation++;
          flight?.controller.abort();
          flight = undefined;
        }
        accept(next);
      }
    } else if (!Array.isArray(result)) throw new RealtimeError("invalid_response", response.status);
    // Fetch the full committed history, including changes made by another device.
    await refresh(true);
  }

  return {
    handoffInRun: (caseId, runId) => mutate("/api/handoff", { case_id: caseId }, false, runId),
    load: () => refresh(),
    subscribe(onInsert, onRunChange, onError, onSync) {
      const subscriber: Subscriber = { onInsert, onRunChange, onError, onSync, runId: null, seen: new Set(), suspended: false };
      subscribers.add(subscriber);
      deliver(subscriber);
      if (subscribers.size === 1) { visibility?.addEventListener("visibilitychange", onVisibility); void poll(); }
      return () => {
        subscribers.delete(subscriber);
        if (!subscribers.size) {
          clearTimeout(timer); timer = undefined;
          visibility?.removeEventListener("visibilitychange", onVisibility);
        }
      };
    },
    async act(action: ScreenAction, rx: RxCase, fix: FixKey | null) {
      switch (action) {
        case "prescribe": return mutate("/api/rx", { patient_id: rx.patient_id, drug_id: rx.drug_id });
        case "handoff": return mutate("/api/handoff", { case_id: rx.id });
        case "fix": return mutate("/api/fix", { case_id: rx.id, fix });
        case "use_card": return mutate("/api/patient/use", { case_id: rx.id });
        default: throw new RealtimeError("invalid_command");
      }
    },
    fire: ids => mutate("/api/sim/fire", { ids }),
    seedWeek: () => mutate("/api/sim/seed", {}),
    reset: () => mutate("/api/sim/reset", {}, true),
    async accessSummary(): Promise<AccessSummary> {
      if (!current) await refresh();
      if (!current) throw new RealtimeError("unavailable");
      const { run_id, revision } = current;
      const epoch = generation;
      const query = new URLSearchParams({ run_id, revision: String(revision) });
      const response = await request(`/api/access/summary?${query}`);
      const body = await readJson(response);
      if (epoch !== generation || current?.run_id !== run_id || current.revision !== revision
        || response.headers.get("x-firstdose-run") !== run_id || response.headers.get("x-firstdose-revision") !== String(revision)) {
        throw new RealtimeError("analytics_stale");
      }
      if (!record(body) || !Number.isFinite(body.recovered) || (body.median_ttff_seconds !== null && !Number.isFinite(body.median_ttff_seconds)) || !record(body.reason_tally)) throw new RealtimeError("invalid_response");
      return body as AccessSummary;
    },
  };
}

const source = createPollingEventSource();
export default source;
