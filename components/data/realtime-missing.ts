// Stand-in used only when lib/realtime.ts doesn't exist yet (see tsconfig.json
// "paths": "@/lib/realtime" tries Vinh's file first, then this one). It lets
// every build pass before the live adapter lands. Mock builds never load it;
// a supabase build without the real adapter shows this message in the banner
// instead of failing to build. Delete it (and the tsconfig entry) once
// lib/realtime.ts is on main.
import type { EventSource } from "./types";

const missing = () =>
  Promise.reject(
    new Error("lib/realtime.ts isn't in this build yet, so live mode has no data source."),
  );

const realtimeMissing: EventSource = {
  load: missing,
  subscribe: () => {
    throw new Error("lib/realtime.ts isn't in this build yet, so live mode has no data source.");
  },
  act: missing,
  fire: missing,
  reset: missing,
  accessSummary: missing,
};

export default realtimeMissing;
