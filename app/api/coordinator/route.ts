import { coordinatorHandler } from "@/lib/server/coordinator-http";

export const runtime = "nodejs";
export const GET = coordinatorHandler("read");
export const POST = coordinatorHandler("write");
