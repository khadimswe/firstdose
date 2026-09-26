import { parseMessageSnapshot, type MessageCommand, type MessageSnapshot } from "./patient-messages";

export type MessageClientState = { data: MessageSnapshot | null; observedRun: string | null; ready: boolean; pending: boolean; syncError: string | null; actionError: string | null };
export const EMPTY_MESSAGES: MessageClientState = { data: null, observedRun: null, ready: false, pending: false, syncError: null, actionError: null };
const safeErrors = new Set(["unauthorized", "stale_run", "invalid_transition", "unavailable", "invalid_response"]);
class MessageError extends Error { constructor(public code: string) { super(code); } }
const code = (error: unknown) => error instanceof MessageError ? error.code : "unavailable";

/** Cookie-authenticated polling, isolated from the frozen fill-event source. */
export function createMessageClient(options: { fetch?: typeof fetch; interval?: number } = {}) {
  let state = EMPTY_MESSAGES;
  let generation = 0, readSequence = 0, acceptedSequence = 0, lifecycle = 0;
  let timer: ReturnType<typeof setTimeout> | undefined;
  const listeners = new Set<() => void>();
  const retiredRuns = new Set<string>();
  function update(patch: Partial<MessageClientState>) { state = { ...state, ...patch }; for (const listener of listeners) listener(); }
  async function request(init?: RequestInit) {
    const response = await (options.fetch ?? fetch)("/api/patient/message", {
      ...init, credentials: "same-origin", cache: "no-store", signal: AbortSignal.timeout(8_000),
    });
    let data: unknown;
    try { data = await response.json(); } catch { throw new MessageError("invalid_response"); }
    if (!response.ok) {
      const reason = (data as { error?: unknown })?.error;
      throw new MessageError(response.status === 401 ? "unauthorized" : typeof reason === "string" && safeErrors.has(reason) ? reason : "unavailable");
    }
    try { return parseMessageSnapshot(data); } catch { throw new MessageError("invalid_response"); }
  }
  function accept(next: MessageSnapshot) {
    if (retiredRuns.has(next.run_id)) return false;
    const previous = state.data;
    if (previous?.run_id === next.run_id && next.revision < previous.revision) return false;
    if (previous && previous.run_id !== next.run_id) {
      generation++;
      update({ data: next, ready: next.run_id === state.observedRun, pending: false, syncError: null, actionError: null });
    } else update({ data: next, ready: next.run_id === state.observedRun, syncError: null });
    return true;
  }
  async function refresh() {
    const epoch = generation, sequence = ++readSequence;
    try {
      const next = await request();
      if (epoch !== generation || sequence < acceptedSequence) return;
      acceptedSequence = sequence;
      accept(next);
    } catch (error) {
      if (epoch === generation && sequence >= acceptedSequence) update({ ready: false, syncError: code(error) });
    }
  }
  async function command(intent: MessageCommand) {
    if (!state.ready || !state.data || state.pending) return;
    const run = state.data.run_id;
    const epoch = ++generation; // A GET begun before this command cannot erase its result.
    update({ pending: true, actionError: null });
    let failure: string | null = null;
    try {
      const next = await request({ method: "POST", headers: { "Content-Type": "application/json", "X-FirstDose-Run": run }, body: JSON.stringify(intent) });
      if (next.run_id !== run) throw new MessageError("invalid_response");
      if (epoch === generation) accept(next);
    } catch (error) { failure = code(error); }
    finally {
      if (epoch === generation) update({ pending: false });
      // Refresh after success or uncertainty; never replay the command into a new run.
      await refresh();
      if (failure && (epoch === generation || failure === "stale_run")) update({ actionError: failure });
    }
  }
  async function poll(life: number) {
    await refresh();
    if (listeners.size && life === lifecycle) timer = setTimeout(() => { void poll(life); }, options.interval ?? 1_500);
  }
  const reconnect = () => { void refresh(); };
  return {
    getSnapshot: () => state, refresh, command,
    retry: async () => { update({ actionError: null }); await refresh(); },
    observeRun(runId: string) {
      if (runId === state.observedRun || retiredRuns.has(runId)) return;
      if (state.observedRun) retiredRuns.add(state.observedRun);
      generation++;
      const data = state.data?.run_id === runId ? state.data : null;
      update({ observedRun: runId, data, ready: data !== null && state.syncError === null, pending: false, actionError: null });
    },
    subscribe(listener: () => void) {
      listeners.add(listener);
      if (listeners.size === 1) {
        if (typeof window !== "undefined") window.addEventListener("online", reconnect);
        if (typeof document !== "undefined") document.addEventListener("visibilitychange", reconnect);
        void poll(++lifecycle);
      }
      return () => {
        listeners.delete(listener);
        if (!listeners.size) {
          generation++; lifecycle++; clearTimeout(timer);
          state = { ...state, ready: false, pending: false };
          if (typeof window !== "undefined") window.removeEventListener("online", reconnect);
          if (typeof document !== "undefined") document.removeEventListener("visibilitychange", reconnect);
        }
      };
    },
  };
}
