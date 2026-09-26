import { patientMessageHandler } from "@/lib/server/patient-message-http";

export const runtime = "nodejs";
export const GET = patientMessageHandler("read");
export const POST = patientMessageHandler("write");
