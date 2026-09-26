// Which data source the screens actually use. Supabase mode needs Vihn's
// lib/realtime.ts (see docs/for-vihn.md); until it lands, everything runs on mock.

export type DataMode = "mock" | "supabase";

export const REQUESTED_MODE: DataMode =
  process.env.NEXT_PUBLIC_DATA_SOURCE === "supabase" ? "supabase" : "mock";

export const DATA_MODE: DataMode = "mock";
