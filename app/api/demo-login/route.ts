import { demoLoginGet, demoLoginPost } from "@/lib/server/demo-login";

export const runtime = "nodejs";
export const GET = demoLoginGet;
export const POST = (request: Request) => demoLoginPost(request);
