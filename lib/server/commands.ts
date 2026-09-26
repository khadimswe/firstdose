import type { FillEvent, ReasonKey } from "@/components/data/types";
import { planCommand, validateCommand } from "./workflow";

export type Snapshot = { run_id: string; revision: number; events: FillEvent[] };
export type PersistenceCode = "stale_run" | "revision_conflict" | "busy" | "unavailable";

export class PersistenceError extends Error {
  constructor(public readonly code: PersistenceCode) {
    super(code);
    this.name = "PersistenceError";
  }
}

export interface WorkflowStore {
  snapshot(): Promise<Snapshot>;
  commit(runId: string, revision: number, events: FillEvent[]): Promise<Snapshot>;
  reset(runId: string): Promise<Snapshot>;
}

export type ReasonClassifier = (note: string) => Promise<ReasonKey | null>;

/** SQL compares the locked run/revision before committing the entire plan. */
export async function executeCommand(
  store: WorkflowStore,
  runId: string,
  command: unknown,
  now: () => string = () => new Date().toISOString(),
  classify?: ReasonClassifier,
): Promise<{ snapshot: Snapshot; inserted: FillEvent[] }> {
  validateCommand(command);
  const expectedRun = runId.toLowerCase();
  const classifications = new Map<string, ReasonKey | null>();
  for (let attempt = 0; attempt < 3; attempt++) {
    const current = await store.snapshot();
    if (current.run_id !== expectedRun) throw new PersistenceError("stale_run");
    const timestamp = now();
    // Validate the entire scripted transition before sending any note to the provider.
    let inserted = planCommand(current.events, command, timestamp);
    if (classify && command.kind === "fire") {
      const resolved: Record<string, ReasonKey | null> = {};
      const evidence = [...current.events, ...inserted];
      for (const event of inserted.filter(row => row.type === "reason_classified")) {
        const sourceId = event.id === "ev_05" ? "ev_04" : "ev_17";
        const note = evidence.find(row => row.id === sourceId)?.note ?? "";
        const key = JSON.stringify([sourceId, note]);
        if (!classifications.has(key)) {
          let reason: ReasonKey | null = null;
          try { reason = await classify(note); } catch { /* Remain unclassified; never restore a scripted reason. */ }
          classifications.set(key, reason);
        }
        resolved[event.id] = classifications.get(key) ?? null;
      }
      inserted = planCommand(current.events, command, timestamp, resolved);
    }
    try {
      // Even a no-op must compare identity under the lock: reset may have raced the read.
      const snapshot = await store.commit(expectedRun, current.revision, inserted);
      return { snapshot, inserted };
    } catch (error) {
      if (!(error instanceof PersistenceError) || error.code !== "revision_conflict") throw error;
    }
  }
  throw new PersistenceError("busy");
}
