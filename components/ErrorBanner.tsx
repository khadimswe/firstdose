"use client";

import { Button } from "@/components/ui/button";
import { usePathname } from "next/navigation";
import { useEvents } from "@/components/data/useEvents";

/**
 * Shows live-mode failures instead of letting a screen look fine. The sync line
 * clears only when a snapshot succeeds again (including unchanged snapshots);
 * the action line stays until the next good command
 * or Dismiss. Both can show at once.
 */
export function ErrorBanner() {
  const { error, dismissError } = useEvents();
  const pathname = usePathname();
  if (!error) return null;

  return (
    <div
      role="alert"
      className="fixed inset-x-0 top-6 z-50 mx-auto w-fit max-w-[90vw] space-y-1 rounded-lg border border-stuck bg-background px-4 py-2 text-sm text-foreground shadow-md print:hidden"
    >
      {error.sync && (
        <p className="flex flex-wrap items-center gap-x-3">
          <span className="font-medium text-stuck">Live data isn&apos;t updating. Retrying.</span>
          <span className="text-muted-foreground">{error.sync}</span>
        </p>
      )}
      {error.loginPath && (
        <a className="inline-block font-semibold underline" href={`${error.loginPath}?next=${encodeURIComponent(pathname)}`}>
          Sign in
        </a>
      )}
      {error.action && (
        <p className="flex flex-wrap items-center gap-x-3">
          <span className="font-medium text-stuck">Could not confirm that action. Check the current run before trying again.</span>
          <span className="text-muted-foreground">{error.action}</span>
          <Button size="xs" variant="ghost" onClick={dismissError}>
            Dismiss
          </Button>
        </p>
      )}
    </div>
  );
}
