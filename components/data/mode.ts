// Which data source the screens use. NEXT_PUBLIC_* is inlined at build time, so
// switching needs a rebuild; the offline fallback is a local mock build.

export type DataMode = "mock" | "supabase";

export const REQUESTED_MODE: DataMode =
  process.env.NEXT_PUBLIC_DATA_SOURCE === "supabase" ? "supabase" : "mock";

export const DATA_MODE: DataMode = REQUESTED_MODE;
