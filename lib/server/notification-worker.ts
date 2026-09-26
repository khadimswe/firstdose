import { PersistenceError } from "./commands";
import { publishNtfy } from "./ntfy";
import { isRunId } from "./supabase-workflow";

export type NotificationClaim = { run_id: string; script_id: string; wrist: string; claim_id: string };
export type NotificationStatus = "accepted" | "unknown";
export interface NotificationStore {
  claim(): Promise<NotificationClaim | null>;
  finish(claim: NotificationClaim, status: NotificationStatus): Promise<void>;
}
type TransportOptions = { env?: Record<string, string | undefined>; fetch?: typeof fetch };
type Options = TransportOptions & { store?: NotificationStore; publish?: (message: string) => Promise<void> };

export function createNotificationStore(options: TransportOptions = {}): NotificationStore {
  async function rpc(name: string, body: Record<string, unknown>): Promise<unknown> {
    try {
      const env = options.env ?? process.env;
      const origin = new URL(env.NEXT_PUBLIC_SUPABASE_URL ?? "");
      const secret = env.SUPABASE_SECRET_KEY;
      if (origin.protocol !== "https:" || origin.username || origin.password || origin.pathname !== "/" || origin.search || origin.hash || !secret) throw new Error();
      const response = await (options.fetch ?? fetch)(new URL(`/rest/v1/rpc/${name}`, origin), {
        method: "POST", headers: { apikey: secret, "Content-Type": "application/json" },
        body: JSON.stringify(body), cache: "no-store", redirect: "error", signal: AbortSignal.timeout(5_000),
      });
      if (!response.ok) throw new Error();
      return await response.json();
    } catch {
      // Claim/finish timeouts are ambiguous. Never retry or expose provider details.
      throw new PersistenceError("unavailable");
    }
  }
  return {
    async claim() {
      const value = await rpc("fd_claim_notification", {});
      if (value === null) return null;
      const row = value as Partial<NotificationClaim> | undefined;
      if (!row || !isRunId(row.run_id) || !isRunId(row.claim_id) || typeof row.script_id !== "string" || !/^ev_[A-Za-z0-9_]+$/.test(row.script_id) || typeof row.wrist !== "string" || !row.wrist.trim() || [...row.wrist].length > 200) {
        throw new PersistenceError("unavailable");
      }
      return row as NotificationClaim;
    },
    async finish(claim, status) {
      const result = await rpc("fd_finish_notification", {
        p_run_id: claim.run_id, p_script_id: claim.script_id, p_claim_id: claim.claim_id, p_status: status,
      });
      if (result !== true) throw new PersistenceError("unavailable");
    },
  };
}

/** At most two sends. Claimed/unknown rows are never automatically reclaimed. */
export async function deliverNotifications(options: Options = {}): Promise<{ attempted: number; accepted: number; unknown: number }> {
  const store = options.store ?? createNotificationStore(options);
  const publish = options.publish ?? ((message: string) => publishNtfy(message, options));
  const result = { attempted: 0, accepted: 0, unknown: 0 };
  try {
    for (let i = 0; i < 2; i++) {
      const claim = await store.claim();
      if (!claim) break;
      result.attempted++;
      let status: NotificationStatus = "accepted";
      try { await publish(claim.wrist); } catch { status = "unknown"; }
      // A reset can occur after claiming. Already in-flight sends cannot be recalled.
      // If recording fails or the process dies, leave the claim unresolved, never resend.
      await store.finish(claim, status);
      result[status]++;
    }
    return result;
  } catch {
    throw new PersistenceError("unavailable");
  }
}
