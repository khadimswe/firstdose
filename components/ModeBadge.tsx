"use client";

import { useEvents } from "@/components/data/useEvents";

/** Which data this tab is showing: mock or live, and whether it is frozen or replaying. */
export function ModeBadge() {
  const { mode, override } = useEvents();
  const extra =
    override?.kind === "upto"
      ? ` · frozen at ${override.id}`
      : override?.kind === "replay"
        ? ` · replay${override.speed !== 1 ? ` ${override.speed}×` : ""}`
        : "";

  return (
    <div className="pointer-events-none fixed top-0 left-1/2 z-50 -translate-x-1/2 rounded-b bg-muted px-2 py-0.5 font-mono text-[10px] text-muted-foreground">
      {mode === "mock" ? "mock data" : "live"}
      {extra}
    </div>
  );
}
