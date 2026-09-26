import { liveCommandHandler } from "@/lib/server/live-command-http";

export const runtime = "nodejs";
// Historical seed events never queue or deliver watch alerts.
export const POST = liveCommandHandler("seed_week", { notifications: false });
