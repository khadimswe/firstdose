import { after } from "next/server";
import { commandHandler, type CommandKind } from "./command-http";
import { deliverNotifications } from "./notification-worker";

export function liveCommandHandler(kind: CommandKind) {
  return commandHandler(kind, {
    onCommit: () => after(async () => {
      try { await deliverNotifications(); }
      catch { console.warn("Notification delivery is unconfirmed; inspect the outbox before retrying."); }
    }),
  });
}
