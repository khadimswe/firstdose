import { commandHandler } from "@/lib/server/command-http";

export const runtime = "nodejs";
export const POST = commandHandler("reset");
