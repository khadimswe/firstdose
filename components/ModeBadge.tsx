"use client";

import { useEvents } from "@/components/data/useEvents";

/** Operator tools only (/sim, /demo): which data source this tab runs on, and whether it is frozen or replaying. */
export function ModeBadge() {
  const { mode, override } = useEvents();
  const extra =
    override?.kind === "upto"
      ? ` · frozen at ${override.id}`
      : override?.kind === "replay"
        ? ` · replay${override.speed !== 1 ? ` ${override.speed}×` : ""}`
        : "";

  return (
    <div className="pointer-events-none fixed top-0 left-1/2 z-50 print:hidden -translate-x-1/2 rounded-b bg-muted px-2 py-0.5 font-mono text-[10px] text-muted-foreground">
      {mode === "mock" ? "Offline data" : "Live data"}
      {extra}
    </div>
  );
}
