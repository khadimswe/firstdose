"use client";

import { Button } from "@/components/ui/button";
import { useEvents } from "@/components/data/useEvents";

/**
 * Shows live-mode failures instead of letting a screen look fine. Sync errors
 * clear on the next good load (it retries on focus and every 15 s); action
 * errors stay until the next good action or Dismiss.
 */
export function ErrorBanner() {
  const { error, dismissError } = useEvents();
  if (!error) return null;

  return (
    <div
      role="alert"
      className="fixed inset-x-0 top-6 z-50 mx-auto flex w-fit max-w-[90vw] flex-wrap items-center gap-x-3 gap-y-1 rounded-lg border border-stuck bg-background px-4 py-2 text-sm text-foreground shadow-md print:hidden"
    >
      <span className="font-medium text-stuck">
        {error.kind === "sync" ? "Live data isn't updating. Retrying." : "That action didn't go through."}
      </span>
      <span className="text-muted-foreground">{error.message}</span>
      {error.kind === "action" && (
        <Button size="xs" variant="ghost" onClick={dismissError}>
          Dismiss
        </Button>
      )}
    </div>
  );
}
