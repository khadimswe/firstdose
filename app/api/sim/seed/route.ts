import { commandHandler } from "@/lib/server/command-http";

export const runtime = "nodejs";
// Historical seed events never queue or deliver watch alerts.
export const POST = commandHandler("seed_week");
