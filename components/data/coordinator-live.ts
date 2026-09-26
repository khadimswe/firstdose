import type { CoordinatorCommand, CoordinatorSnapshot } from "@/lib/server/coordinator";

export type CoordinatorState = { snapshot: CoordinatorSnapshot | null; ready: boolean; pending: boolean; error: string | null; loginPath: string | null };
export const EMPTY_COORDINATOR: CoordinatorState = { snapshot: null, ready: false, pending: false, error: null, loginPath: null };
const record = (value: unknown): value is Record<string, unknown> => !!value && typeof value === "object" && !Array.isArray(value);
class LinkError extends Error { constructor(message: string, public status = 0) { super(message); } }

function parse(value: unknown): CoordinatorSnapshot {
  if (!record(value) || typeof value.run_id !== "string" || !/^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(value.run_id)
    || !Number.isSafeInteger(value.revision) || Number(value.revision) < 0 || !Array.isArray(value.links) || !Array.isArray(value.cases) || !Array.isArray(value.events)
    || !value.links.every(row => record(row) && row.coordinator_id === "coord_demo" && row.prescriber_id === "prescriber_demo" && ["pending", "linked"].includes(String(row.status)))
    || value.links.length > 1 || !value.cases.every(row => record(row) && typeof row.case_id === "string" && (row.coordinator_id === null || row.coordinator_id === "coord_demo"))
    || new Set(value.cases.map(row => row.case_id)).size !== value.cases.length
    || !value.events.every(row => record(row) && typeof row.id === "string" && typeof row.at === "string" && Number.isFinite(Date.parse(row.at))
      && row.coordinator_id === "coord_demo" && row.prescriber_id === "prescriber_demo" && (row.case_id === null || typeof row.case_id === "string")
      && ["doctor", "coordinator"].includes(String(row.actor)) && ["coordinator_invited", "coordinator_link_requested", "coordinator_linked", "coordinator_assigned"].includes(String(row.type)))) {
    throw new LinkError("Coordinator data could not be read. Try reconnecting.");
  }
  return value as CoordinatorSnapshot;
}

export function createCoordinatorLiveStore(options: {
  fetch?: typeof fetch;
  monitor?: (onRun: (id: string) => void) => () => void;
  pollIntervalMs?: number;
} = {}) {
  const fetcher = options.fetch ?? ((input, init) => globalThis.fetch(input, init));
  const listeners = new Set<() => void>();
  const retired = new Set<string>();
  let state = EMPTY_COORDINATOR;
  let lifecycle = 0, epoch = 0;
  let observedRun: string | null = null;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let stopMonitor: (() => void) | undefined;
  let readFlight: { promise: Promise<void>; epoch: number } | null = null;
  let actionFlight: { key: string; promise: Promise<boolean> } | null = null;
  function update(patch: Partial<CoordinatorState>) {
    const next = { ...state, ...patch };
    if (next.snapshot === state.snapshot && next.ready === state.ready && next.pending === state.pending && next.error === state.error && next.loginPath === state.loginPath) return;
    state = next; for (const listener of listeners) listener();
  }
  const active = (life: number, generation: number) => life === lifecycle && generation === epoch && listeners.size > 0;
  function fail(error: unknown, syncing = false) {
    const status = error instanceof LinkError ? error.status : (error as { status?: number })?.status;
    update({ error: status === 401 ? "Sign in to continue." : error instanceof Error ? error.message : "Coordinator request failed. Try again.",
      loginPath: status === 401 ? "/api/demo-login?next=%2Fdoctor%2Fprofile" : null,
      ...(syncing || status === 401 || status === 409 ? { ready: false } : {}) });
  }
  async function request(init?: RequestInit) {
    const controller = new AbortController(); const timeout = setTimeout(() => controller.abort(), 10_000);
    try {
      const response = await fetcher("/api/coordinator", { credentials: "same-origin", cache: "no-store", ...init, signal: controller.signal });
      if (!response.ok) throw new LinkError(response.status === 409 ? "The run changed. Refresh the link state before trying again." : "Coordinator request failed. Try again.", response.status);
      return parse(await response.json());
    } finally { clearTimeout(timeout); }
  }
  function accept(next: CoordinatorSnapshot) {
    if (retired.has(next.run_id)) return false;
    const current = state.snapshot;
    if (current && current.run_id !== next.run_id) { retired.add(current.run_id); epoch++; actionFlight = null; }
    if (!current || current.run_id !== next.run_id || next.revision > current.revision) update({ snapshot: next, pending: current?.run_id !== next.run_id ? false : state.pending });
    update({ ready: !options.monitor || observedRun === next.run_id, error: null, loginPath: null }); return true;
  }
  function schedule() { clearTimeout(timer); if (listeners.size) timer = setTimeout(() => { void refresh(); }, options.pollIntervalMs ?? 1_500); }
  function refresh(): Promise<void> {
    if (!listeners.size) return Promise.resolve();
    if (readFlight?.epoch === epoch) return readFlight.promise;
    const life = lifecycle, generation = epoch;
    const task = (async () => {
      try { const next = await request(); if (active(life, generation)) accept(next); }
      catch (error) { if (active(life, generation)) fail(error, true); }
      finally { if (readFlight?.epoch === generation) readFlight = null; if (life === lifecycle && listeners.size) schedule(); }
    })();
    readFlight = { promise: task, epoch: generation }; return task;
  }
  function observeRun(id: string) {
    if (retired.has(id) || observedRun === id) return;
    const previous = observedRun;
    if (previous) retired.add(previous);
    observedRun = id; epoch++; actionFlight = null;
    const matching = state.snapshot?.run_id === id;
    const snapshot = state.snapshot && !retired.has(state.snapshot.run_id) ? state.snapshot : null;
    update({ snapshot, ready: matching, pending: false, error: null, loginPath: null }); void refresh();
  }
  function finishAction(key: string, valid: () => boolean) {
    if (valid() && actionFlight?.key === key) { actionFlight = null; update({ pending: false }); }
  }
  function perform(key: string, operation: (write: (action: CoordinatorCommand["action"], caseId?: string) => Promise<void>, valid: () => boolean) => Promise<void>): Promise<boolean> {
    if (actionFlight) return actionFlight.key === key ? actionFlight.promise : Promise.resolve(false);
    if (!state.ready || !state.snapshot || !listeners.size) return Promise.resolve(false);
    const run = state.snapshot.run_id, life = lifecycle, generation = epoch;
    const valid = () => active(life, generation) && state.snapshot?.run_id === run;
    update({ pending: true, error: null });
    const task = (async () => {
      try {
        await operation(async (action, caseId) => {
          if (!valid()) throw new LinkError("The run was reset. Review the new run.");
          const next = await request({ method: "POST", headers: { "Content-Type": "application/json", "X-FirstDose-Run": run }, body: JSON.stringify({ action, coordinator_id: "coord_demo", prescriber_id: "prescriber_demo", ...(caseId ? { case_id: caseId } : {}) }) });
          if (!valid() || next.run_id !== run) throw new LinkError("The run was reset. Review the new run.");
          accept(next);
        }, valid);
        return valid();
      } catch (error) { if (valid()) { fail(error); if ((error as LinkError)?.status === 409) void refresh(); } return false; }
      finally { finishAction(key, valid); }
    })();
    actionFlight = { key, promise: task }; return task;
  }
  async function approve(write: (action: CoordinatorCommand["action"]) => Promise<void>) {
    if (!state.snapshot?.links.length) await write("invite");
    if (state.snapshot?.links[0]?.status !== "linked") await write("approve");
    if (state.snapshot?.links[0]?.status !== "linked") throw new LinkError("Approval was not confirmed. Refresh and try again.");
  }
  return {
    getSnapshot: () => state,
    refresh,
    subscribe(listener: () => void) {
      listeners.add(listener);
      if (listeners.size === 1) {
        lifecycle++; epoch++; state = EMPTY_COORDINATOR; observedRun = null;
        stopMonitor = options.monitor?.(observeRun); void refresh();
      }
      return () => { listeners.delete(listener); if (!listeners.size) { lifecycle++; epoch++; clearTimeout(timer); stopMonitor?.(); stopMonitor = undefined; readFlight = null; actionFlight = null; state = EMPTY_COORDINATOR; } };
    },
    command: (action: CoordinatorCommand["action"], caseId?: string) => perform(`${action}:${caseId ?? ""}`, write => write(action, caseId)),
    approve: () => perform("approve-profile", write => approve(write)),
    approveAndHandoff: (caseId: string, handoff: (runId: string) => Promise<void>, expectedRun?: string) => {
      if (expectedRun && state.snapshot?.run_id !== expectedRun) {
        update({ error: "The run changed. Review the new run before sending." });
        return Promise.resolve(false);
      }
      return perform(`handoff:${caseId}`, async (write, valid) => {
        await approve(write);
        if (!valid()) throw new LinkError("The run was reset. Review the new run.");
        if (!state.snapshot?.cases.some(row => row.case_id === caseId && row.coordinator_id === "coord_demo")) await write("assign", caseId);
        if (!state.snapshot?.cases.some(row => row.case_id === caseId && row.coordinator_id === "coord_demo")) throw new LinkError("Case access was not confirmed. Refresh and try again.");
        if (!valid()) throw new LinkError("The run was reset. Review the new run.");
        await handoff(state.snapshot!.run_id);
      });
    },
  };
}
