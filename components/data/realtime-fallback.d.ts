// Types for "@/lib/realtime" while that file doesn't exist yet. TypeScript
// always prefers a real module over an ambient declaration, so once Vinh's
// lib/realtime.ts lands this is ignored (and can be deleted with
// realtime-missing.ts and the alias in next.config.ts).
declare module "@/lib/realtime" {
  import type { EventSource } from "@/components/data/types";

  const source: EventSource;
  export default source;
}
