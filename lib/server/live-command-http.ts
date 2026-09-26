import { after } from "next/server";
import { commandHandler, type CommandKind, type CommitCheckpoint } from "./command-http";
import { deliverNotifications } from "./notification-worker";
import { classify } from "./classify";
import { replayCommittedRun } from "./analytics-runtime";

type FollowupOptions = {
  notifications?: boolean;
  deliver?: () => Promise<unknown>;
  replay?: (runId: string) => Promise<void>;
};

export async function completeFollowup(checkpoint: CommitCheckpoint, options: FollowupOptions = {}) {
  await Promise.all([
    (async () => {
      if (options.notifications === false) return;
      try { await (options.deliver ?? deliverNotifications)(); }
      catch { console.warn("Notification delivery is unconfirmed; inspect the outbox before retrying."); }
    })(),
    (async () => {
      try { await (options.replay ?? replayCommittedRun)(checkpoint.run_id); }
      catch { console.warn("Analytics replay is unavailable; committed workflow events are retained for retry."); }
    })(),
  ]);
}

export function liveCommandHandler(kind: CommandKind, options: Pick<FollowupOptions, "notifications"> = {}) {
  return commandHandler(kind, {
    classify,
    onCommit: checkpoint => after(() => completeFollowup(checkpoint, options)),
  });
}
