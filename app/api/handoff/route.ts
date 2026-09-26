import { liveCommandHandler } from "@/lib/server/live-command-http";

export const runtime = "nodejs";
export const POST = liveCommandHandler("handoff");
