import type { FillEvent } from "@/components/data/types";
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

/** SQL compares the locked run/revision before committing the entire plan. */
export async function executeCommand(
  store: WorkflowStore,
  runId: string,
  command: unknown,
  now: () => string = () => new Date().toISOString(),
): Promise<{ snapshot: Snapshot; inserted: FillEvent[] }> {
  validateCommand(command);
  const expectedRun = runId.toLowerCase();
  for (let attempt = 0; attempt < 3; attempt++) {
    const current = await store.snapshot();
    if (current.run_id !== expectedRun) throw new PersistenceError("stale_run");
    const inserted = planCommand(current.events, command, now());
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
